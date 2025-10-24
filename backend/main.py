from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
from PIL import Image
import io
import os
from typing import Optional
import json
import re

# Initialize FastAPI app
app = FastAPI(title="Medical Image Analysis API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyCYACQUXFwk9DFuM54vQJPJy3zcDtP62Go")
genai.configure(api_key=GEMINI_API_KEY)

# Initialize Gemini model - using the correct model name
model = genai.GenerativeModel('gemini-1.5-flash-latest')

# Response models
class DiagnosisResponse(BaseModel):
    diagnosis_english: str
    diagnosis_arabic: str
    confidence_score: float
    findings: list[str]
    recommendations: Optional[str] = None
    image_type: str

class ErrorResponse(BaseModel):
    error: str
    detail: str


def extract_confidence_score(text: str) -> float:
    """Extract confidence score from the response text"""
    # Look for patterns like "confidence: 85%", "85% confident", etc.
    patterns = [
        r'confidence[:\s]+(\d+)%',
        r'(\d+)%\s+confiden',
        r'score[:\s]+(\d+)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text.lower())
        if match:
            return float(match.group(1)) / 100
    
    # Default confidence if not found
    return 0.75


def parse_json_response(text: str) -> dict:
    """Parse JSON from text response"""
    try:
        # Try to find JSON in the response
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
    except:
        pass
    return None


async def analyze_medical_image(image_bytes: bytes, filename: str) -> dict:
    """Analyze medical image using Gemini"""
    
    try:
        # Open image
        image = Image.open(io.BytesIO(image_bytes))
        
        # Create detailed prompt for medical analysis
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

        # Generate response
        response = model.generate_content([prompt, image])
        response_text = response.text
        
        # Try to parse JSON response
        parsed_data = parse_json_response(response_text)
        
        if parsed_data:
            # Ensure confidence score is a float between 0 and 1
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
            # Fallback: parse the text response
            confidence = extract_confidence_score(response_text)
            
            # Split response to find English and Arabic sections
            lines = response_text.split('\n')
            diagnosis_en = []
            diagnosis_ar = []
            findings = []
            
            arabic_started = False
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                # Check if line contains Arabic characters
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


@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Medical Image Analysis API",
        "version": "1.0.0",
        "endpoints": {
            "/analyze": "POST - Upload medical image for analysis",
            "/health": "GET - Check API health"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "Medical Image Analysis API"}


@app.post("/analyze", response_model=DiagnosisResponse)
async def analyze_image(file: UploadFile = File(...)):
    """
    Analyze medical image (X-ray, ECG, medical report, etc.)
    
    Args:
        file: Medical image file (JPG, PNG, JPEG, etc.)
    
    Returns:
        DiagnosisResponse with diagnosis in English and Arabic, confidence score, and findings
    """
    
    # Validate file type
    allowed_extensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp']
    file_extension = file.filename.split('.')[-1].lower()
    
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type. Allowed types: {', '.join(allowed_extensions)}"
        )
    
    try:
        # Read file content
        image_bytes = await file.read()
        
        # Check file size (max 10MB)
        if len(image_bytes) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")
        
        # Analyze image
        result = await analyze_medical_image(image_bytes, file.filename)
        
        return DiagnosisResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)