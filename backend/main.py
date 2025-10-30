from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
import google.generativeai as genai
from PIL import Image
import io
import os
import json
import re
from datetime import datetime
from bson import ObjectId
import cloudinary
import cloudinary.uploader
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="Medical Image Analysis API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure APIs from environment variables
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MONGODB_URL = os.getenv("MONGODB_URL")
CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

# Validate required environment variables
required_env_vars = {
    "GEMINI_API_KEY": GEMINI_API_KEY,
    "MONGODB_URL": MONGODB_URL,
    "CLOUDINARY_CLOUD_NAME": CLOUDINARY_CLOUD_NAME,
    "CLOUDINARY_API_KEY": CLOUDINARY_API_KEY,
    "CLOUDINARY_API_SECRET": CLOUDINARY_API_SECRET,
}

missing_vars = [var for var, value in required_env_vars.items() if not value]
if missing_vars:
    raise Exception(f"Missing required environment variables: {', '.join(missing_vars)}")

# Configure Gemini
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.5-flash')
chat_model = genai.GenerativeModel('gemini-2.5-flash')  # Separate model for chat

# Configure Cloudinary
cloudinary.config(
    cloud_name=CLOUDINARY_CLOUD_NAME,
    api_key=CLOUDINARY_API_KEY,
    api_secret=CLOUDINARY_API_SECRET
)

# MongoDB connection
mongodb_client = AsyncIOMotorClient(MONGODB_URL)
db = mongodb_client.medical_analysis
records_collection = db.medical_records
chat_history_collection = db.chat_history  # New collection for chat history

# Response models
class DiagnosisResponse(BaseModel):
    diagnosis_english: str
    diagnosis_arabic: str
    confidence_score: float
    findings: List[str]
    recommendations: Optional[str] = None
    image_type: str

class StoredDiagnosisResponse(BaseModel):
    id: str = Field(alias="_id")
    patient_id: Optional[str] = None
    image_url: str
    diagnosis_english: str
    diagnosis_arabic: str
    confidence_score: float
    findings: List[str]
    recommendations: Optional[str] = None
    image_type: str
    created_at: datetime
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

# New models for chat endpoint
class ChatMessage(BaseModel):
    message: str
    patient_id: Optional[str] = None
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response_english: str
    response_arabic: str
    session_id: str
    is_medical: bool
    confidence_score: float

class ChatHistoryResponse(BaseModel):
    id: str = Field(alias="_id")
    patient_id: Optional[str]
    session_id: str
    user_message: str
    ai_response_english: str
    ai_response_arabic: str
    is_medical: bool
    confidence_score: float
    created_at: datetime
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class ErrorResponse(BaseModel):
    error: str
    detail: str

# Medical context and restrictions
MEDICAL_SYSTEM_PROMPT = """
You are a specialized medical AI assistant designed to provide medical information and answer health-related questions. 

STRICT GUIDELINES:
1. ONLY answer medical, health, wellness, and healthcare-related questions
2. If a question is NOT medical-related, politely decline to answer and explain that you're a medical assistant
3. Always provide responses in both English and Arabic
4. Be clear, accurate, and professional in your medical explanations
5. Include a confidence score (0-100) based on how well you can answer the question
6. Always include disclaimers that you're an AI and recommend consulting healthcare professionals

MEDICAL TOPICS YOU CAN DISCUSS:
- Symptoms and conditions
- Medications and treatments
- Medical procedures
- Health and wellness advice
- Disease information
- First aid and emergency care
- Nutrition and exercise for health
- Mental health topics
- Medical terminology explanations

NON-MEDICAL TOPICS TO REJECT:
- Politics, religion, or personal opinions
- Technical or programming questions
- General knowledge or trivia
- Entertainment or sports
- Personal advice unrelated to health
- Legal or financial advice

RESPONSE FORMAT:
Provide your response in this exact JSON format:
{
    "response_english": "Your detailed response in English",
    "response_arabic": "ردك التفصيلي بالعربية",
    "is_medical": true/false,
    "confidence_score": 85
}

If the question is not medical, set "is_medical" to false and provide an explanation.
"""

def is_medical_question(question: str) -> bool:
    """Check if the question is medical-related"""
    medical_keywords = [
        # Symptoms and conditions
        'pain', 'hurt', 'symptom', 'fever', 'headache', 'cough', 'cold', 'flu', 
        'virus', 'infection', 'disease', 'illness', 'sick', 'health', 'medical',
        'doctor', 'hospital', 'clinic', 'medicine', 'drug', 'pill', 'tablet',
        'treatment', 'therapy', 'diagnosis', 'prognosis', 'prescription',
        
        # Body parts and systems
        'heart', 'lung', 'liver', 'kidney', 'stomach', 'brain', 'blood',
        'bone', 'muscle', 'nerve', 'skin', 'eye', 'ear', 'nose', 'throat',
        'chest', 'back', 'arm', 'leg', 'head', 'foot', 'hand',
        
        # Medical specialties
        'cardiology', 'neurology', 'pediatrics', 'surgery', 'dentist',
        'psychology', 'psychiatry', 'dermatology', 'orthopedics',
        
        # Arabic medical terms
        'ألم', 'مرض', 'علاج', 'طبيب', 'مستشفى', 'دواء', 'صحة', 'عرض',
        'حمى', 'سعال', 'صداع', 'قلب', 'رئة', 'كبد', 'كلية', 'معدة'
    ]
    
    question_lower = question.lower()
    return any(keyword in question_lower for keyword in medical_keywords)

async def generate_medical_chat_response(user_message: str) -> dict:
    """Generate medical chat response using Gemini"""
    try:
        # Check if question is medical
        if not is_medical_question(user_message):
            return {
                "response_english": "I apologize, but I'm designed specifically to answer medical and health-related questions only. Please ask me about symptoms, conditions, treatments, or general health information.",
                "response_arabic": "أعتذر، ولكنني مصمم خصيصًا للإجابة على الأسئلة الطبية والمتعلقة بالصحة فقط. يرجى سؤالي عن الأعراض، الحالات، العلاجات، أو المعلومات الصحية العامة.",
                "is_medical": False,
                "confidence_score": 100.0
            }
        
        # Create prompt with medical context
        prompt = f"""
        {MEDICAL_SYSTEM_PROMPT}
        
        User Question: {user_message}
        
        Please analyze this question and provide a helpful, accurate medical response in both English and Arabic.
        """
        
        response = chat_model.generate_content(prompt)
        response_text = response.text
        
        # Parse JSON response
        try:
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                parsed_response = json.loads(json_match.group())
                return parsed_response
        except:
            pass
        
        # Fallback if JSON parsing fails
        return {
            "response_english": "I've analyzed your medical question. " + response_text[:500] + "\n\n⚠️ Disclaimer: I am an AI assistant. Please consult with a qualified healthcare professional for medical advice.",
            "response_arabic": "لقد قمت بتحليل سؤالك الطبي. " + "يرجى استشارة أخصائي طبي مؤهل للحصول على المشورة الطبية المناسبة." + "\n\n⚠️ تنبيه: أنا مساعد ذكي. يرجى استشارة أخصائي طبي مؤهل للحصول على المشورة الطبية.",
            "is_medical": True,
            "confidence_score": 75.0
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating chat response: {str(e)}")

async def save_chat_history(
    user_message: str,
    ai_response: dict,
    patient_id: Optional[str] = None,
    session_id: Optional[str] = None
) -> str:
    """Save chat conversation to MongoDB"""
    try:
        if not session_id:
            session_id = str(ObjectId())
        
        document = {
            "patient_id": patient_id,
            "session_id": session_id,
            "user_message": user_message,
            "ai_response_english": ai_response["response_english"],
            "ai_response_arabic": ai_response["response_arabic"],
            "is_medical": ai_response["is_medical"],
            "confidence_score": ai_response["confidence_score"],
            "created_at": datetime.utcnow()
        }
        
        result = await chat_history_collection.insert_one(document)
        return session_id
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving chat history: {str(e)}")

def extract_confidence_score(text: str) -> float:
    """Extract confidence score from the response text"""
    patterns = [
        r'confidence[:\s]+(\d+)%',
        r'(\d+)%\s+confiden',
        r'score[:\s]+(\d+)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text.lower())
        if match:
            return float(match.group(1)) / 100
    
    return 0.75

def parse_json_response(text: str) -> dict:
    """Parse JSON from text response"""
    try:
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
    except:
        pass
    return None

async def upload_to_cloudinary(image_bytes: bytes, filename: str) -> str:
    """Upload image to Cloudinary and return URL"""
    try:
        # Upload image
        upload_result = cloudinary.uploader.upload(
            image_bytes,
            folder="medical_images",
            public_id=f"medical_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{filename.split('.')[0]}",
            resource_type="image",
            format="jpg",
            quality="auto",
            transformation=[
                {"width": 1000, "crop": "limit"},
                {"quality": "auto:good"}
            ]
        )
        return upload_result['secure_url']
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading to Cloudinary: {str(e)}")

async def analyze_medical_image(image_bytes: bytes, filename: str) -> dict:
    """Analyze medical image using Gemini"""
    
    try:
        image = Image.open(io.BytesIO(image_bytes))
        
        prompt = """You are an expert medical AI assistant. Analyze this medical image carefully and provide a detailed assessment.

Please provide your response in the following JSON format:
{
    "image_type": "X-ray/ECG/Medical Report/Other",
    "diagnosis_english": "Detailed diagnosis in English",
    "diagnosis_arabic": "التشخيص التفصيلي بالعربية",
    "confidence_score": 85,
    "findings": ["Finding 1", "Finding 2", "Finding 3"],
    "recommendations": "Medical recommendations"
}

Important instructions:
1. Identify the type of medical image (X-ray, ECG, CT scan, MRI, lab report, etc.)
2. Provide a clear, professional diagnosis in English
3. Provide the same diagnosis translated to Arabic
4. Give a confidence score (0-100) based on image quality and clarity
5. List specific findings you observe
6. Provide medical recommendations if appropriate
7. If the image is unclear or not a medical image, state that clearly

Remember: This is for educational purposes. Always recommend consulting with a qualified healthcare professional for actual medical advice."""

        response = model.generate_content([prompt, image])
        response_text = response.text
        
        parsed_data = parse_json_response(response_text)
        
        if parsed_data:
            confidence = parsed_data.get("confidence_score", 75)
            if confidence > 1:
                confidence = confidence / 100
            
            return {
                "image_type": parsed_data.get("image_type", "Medical Image"),
                "diagnosis_english": parsed_data.get("diagnosis_english", "Analysis completed"),
                "diagnosis_arabic": parsed_data.get("diagnosis_arabic", "تم التحليل"),
                "confidence_score": confidence,
                "findings": parsed_data.get("findings", ["Image analyzed"]),
                "recommendations": parsed_data.get("recommendations", "Consult a healthcare professional")
            }
        else:
            confidence = extract_confidence_score(response_text)
            lines = response_text.split('\n')
            diagnosis_en = []
            diagnosis_ar = []
            findings = []
            
            arabic_started = False
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                if any('\u0600' <= char <= '\u06FF' for char in line):
                    arabic_started = True
                    diagnosis_ar.append(line)
                elif not arabic_started and line and not line.startswith('{'):
                    diagnosis_en.append(line)
                    if any(keyword in line.lower() for keyword in ['finding', 'observed', 'shows', 'indicates']):
                        findings.append(line)
            
            return {
                "image_type": "Medical Image",
                "diagnosis_english": ' '.join(diagnosis_en) if diagnosis_en else response_text[:500],
                "diagnosis_arabic": ' '.join(diagnosis_ar) if diagnosis_ar else "يرجى استشارة أخصائي طبي للحصول على تشخيص دقيق",
                "confidence_score": confidence,
                "findings": findings if findings else ["Analysis completed"],
                "recommendations": "Please consult with a qualified healthcare professional for proper diagnosis and treatment."
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing image: {str(e)}")

async def save_to_mongodb(image_url: str, analysis_result: dict, patient_id: Optional[str] = None) -> str:
    """Save analysis result to MongoDB"""
    try:
        document = {
            "patient_id": patient_id,
            "image_url": image_url,
            "diagnosis_english": analysis_result["diagnosis_english"],
            "diagnosis_arabic": analysis_result["diagnosis_arabic"],
            "confidence_score": analysis_result["confidence_score"],
            "findings": analysis_result["findings"],
            "recommendations": analysis_result.get("recommendations"),
            "image_type": analysis_result["image_type"],
            "created_at": datetime.utcnow()
        }
        
        result = await records_collection.insert_one(document)
        return str(result.inserted_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving to MongoDB: {str(e)}")

# Startup event
@app.on_event("startup")
async def startup_db_client():
    """Connect to MongoDB on startup"""
    try:
        await mongodb_client.admin.command('ping')
        print("✅ Connected to MongoDB successfully")
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB: {e}")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_db_client():
    """Close MongoDB connection on shutdown"""
    mongodb_client.close()
    print("MongoDB connection closed")

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Medical Image Analysis API",
        "version": "1.0.0",
        "endpoints": {
            "/analyze": "POST - Analyze medical image only",
            "/analyze-and-store": "POST - Analyze and store in database",
            "/records": "GET - Get all medical records",
            "/records/{record_id}": "GET - Get specific record",
            "/chat": "POST - Chat with medical AI",
            "/chat/history": "GET - Get chat history",
            "/health": "GET - Check API health"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Medical Image Analysis API",
        "mongodb": "connected" if mongodb_client else "disconnected",
        "cloudinary": "configured" if CLOUDINARY_CLOUD_NAME != "your-cloud-name" else "not configured"
    }

@app.post("/analyze", response_model=DiagnosisResponse)
async def analyze_image(file: UploadFile = File(...)):
    """
    Analyze medical image only (without storing)
    
    Args:
        file: Medical image file (JPG, PNG, JPEG, etc.)
    
    Returns:
        DiagnosisResponse with diagnosis in English and Arabic
    """
    
    allowed_extensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp']
    file_extension = file.filename.split('.')[-1].lower()
    
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type. Allowed types: {', '.join(allowed_extensions)}"
        )
    
    try:
        image_bytes = await file.read()
        
        if len(image_bytes) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")
        
        result = await analyze_medical_image(image_bytes, file.filename)
        
        return DiagnosisResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@app.post("/analyze-and-store", response_model=StoredDiagnosisResponse)
async def analyze_and_store_image(
    file: UploadFile = File(...),
    patient_id: Optional[str] = Form(None)
):
    """
    Analyze medical image, upload to Cloudinary, and store in MongoDB
    
    Args:
        file: Medical image file (JPG, PNG, JPEG, etc.)
        patient_id: Optional patient ID
    
    Returns:
        StoredDiagnosisResponse with diagnosis and database record
    """
    
    allowed_extensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp']
    file_extension = file.filename.split('.')[-1].lower()
    
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type. Allowed types: {', '.join(allowed_extensions)}"
        )
    
    try:
        image_bytes = await file.read()
        
        if len(image_bytes) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")
        
        # Analyze image
        analysis_result = await analyze_medical_image(image_bytes, file.filename)
        
        # Upload to Cloudinary
        image_url = await upload_to_cloudinary(image_bytes, file.filename)
        
        # Save to MongoDB
        record_id = await save_to_mongodb(image_url, analysis_result, patient_id)
        
        # Return complete record
        return StoredDiagnosisResponse(
            _id=record_id,
            patient_id=patient_id,
            image_url=image_url,
            created_at=datetime.utcnow(),
            **analysis_result
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")

@app.get("/records", response_model=List[StoredDiagnosisResponse])
async def get_all_records(
    patient_id: Optional[str] = None,
    limit: int = 50,
    skip: int = 0
):
    """
    Get all medical records
    
    Args:
        patient_id: Optional filter by patient ID
        limit: Maximum number of records to return
        skip: Number of records to skip
    
    Returns:
        List of medical records
    """
    try:
        query = {}
        if patient_id:
            query["patient_id"] = patient_id
        
        cursor = records_collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
        records = await cursor.to_list(length=limit)
        
        # Convert ObjectId to string
        for record in records:
            record["_id"] = str(record["_id"])
        
        return records
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching records: {str(e)}")

@app.get("/records/{record_id}", response_model=StoredDiagnosisResponse)
async def get_record_by_id(record_id: str):
    """
    Get a specific medical record by ID
    
    Args:
        record_id: MongoDB document ID
    
    Returns:
        Medical record
    """
    try:
        record = await records_collection.find_one({"_id": ObjectId(record_id)})
        
        if not record:
            raise HTTPException(status_code=404, detail="Record not found")
        
        record["_id"] = str(record["_id"])
        return record
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching record: {str(e)}")

@app.delete("/records/{record_id}")
async def delete_record(record_id: str):
    """
    Delete a medical record
    
    Args:
        record_id: MongoDB document ID
    
    Returns:
        Success message
    """
    try:
        result = await records_collection.delete_one({"_id": ObjectId(record_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Record not found")
        
        return {"message": "Record deleted successfully", "deleted_id": record_id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting record: {str(e)}")

@app.post("/chat", response_model=ChatResponse)
async def medical_chat(chat_message: ChatMessage):
    """
    Chat with medical AI - Only answers medical questions
    
    Args:
        chat_message: User message and optional patient/session ID
    
    Returns:
        Medical response in English and Arabic
    """
    try:
        if not chat_message.message or chat_message.message.strip() == "":
            raise HTTPException(status_code=400, detail="Message cannot be empty")
        
        # Generate AI response
        ai_response = await generate_medical_chat_response(chat_message.message)
        
        # Save to chat history
        session_id = await save_chat_history(
            user_message=chat_message.message,
            ai_response=ai_response,
            patient_id=chat_message.patient_id,
            session_id=chat_message.session_id
        )
        
        return ChatResponse(
            response_english=ai_response["response_english"],
            response_arabic=ai_response["response_arabic"],
            session_id=session_id,
            is_medical=ai_response["is_medical"],
            confidence_score=ai_response["confidence_score"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in chat: {str(e)}")

@app.get("/chat/history", response_model=List[ChatHistoryResponse])
async def get_chat_history(
    session_id: Optional[str] = None,
    patient_id: Optional[str] = None,
    limit: int = 50,
    skip: int = 0
):
    """
    Get chat history
    
    Args:
        session_id: Filter by session ID
        patient_id: Filter by patient ID
        limit: Maximum number of records
        skip: Number of records to skip
    
    Returns:
        List of chat messages
    """
    try:
        query = {}
        if session_id:
            query["session_id"] = session_id
        if patient_id:
            query["patient_id"] = patient_id
        
        cursor = chat_history_collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
        records = await cursor.to_list(length=limit)
        
        # Convert ObjectId to string
        for record in records:
            record["_id"] = str(record["_id"])
        
        return records
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching chat history: {str(e)}")

@app.delete("/chat/history/{session_id}")
async def delete_chat_session(session_id: str):
    """
    Delete all chat messages from a session
    
    Args:
        session_id: Session ID to delete
    
    Returns:
        Success message
    """
    try:
        result = await chat_history_collection.delete_many({"session_id": session_id})
        
        return {
            "message": "Chat session deleted successfully",
            "session_id": session_id,
            "deleted_count": result.deleted_count
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting chat session: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)