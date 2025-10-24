// services/records.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL, SECURITY_SERVICE_URL } from "@env";

export const fetchPatientRecords = async () => {
  try {
    const userId = await AsyncStorage.getItem("userId");
    if (!userId) throw new Error("User not authenticated");

    const response = await fetch(`${API_URL}records/${userId}`);
    if (!response.ok) throw new Error("Failed to fetch records");

    const data = await response.json();
    return data.records || [];
  } catch (error) {
    console.error("Error fetching records:", error);
    return [];
  }
};
