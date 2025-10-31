import { diagnosisService } from "@/lib/api";
import { StoredDiagnosisResponse } from "@/lib/api/types";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";

export default function HistoryScreen() {
  const [records, setRecords] = useState<StoredDiagnosisResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { state } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const result = await diagnosisService.getRecords(state.user?.email);
      if (result.success && result.data) {
        setRecords(result.data);
      }
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadHistory();
    setIsRefreshing(false);
  };

  const renderRecord = ({ item }: { item: StoredDiagnosisResponse }) => (
    <TouchableOpacity
      style={styles.recordCard}
      onPress={() => {
        // Navigate to detail screen if needed
        // router.push(`/record/${item._id}`);
      }}
    >
      {item.image_url && (
        <Image source={{ uri: item.image_url }} style={styles.recordImage} />
      )}
      <View style={styles.recordContent}>
        <View style={styles.recordHeader}>
          <Text style={styles.recordTitle}>{item.image_type}</Text>
          <View
            style={[
              styles.confidenceBadge,
              {
                backgroundColor:
                  item.confidence_score > 0.7 ? "#4CAF50" : "#FF9800",
              },
            ]}
          >
            <Text style={styles.confidenceText}>
              {(item.confidence_score * 100).toFixed(0)}%
            </Text>
          </View>
        </View>
        <Text style={styles.recordDate}>
          {new Date(item.created_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
        <Text style={styles.recordDiagnosis} numberOfLines={3}>
          {item.diagnosis_english}
        </Text>
        {item.findings && item.findings.length > 0 && (
          <View style={styles.findingsContainer}>
            <Text style={styles.findingsLabel}>
              {item.findings.length} Finding(s)
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No medical records yet</Text>
      <Text style={styles.emptySubtext}>
        Take a photo of a medical image to get started
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C5FDC" />
        <Text style={styles.loadingText}>Loading history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Diagnosis History</Text>
        <Text style={styles.headerSubtitle}>
          {records.length} record(s) found
        </Text>
      </View>
      <FlatList
        data={records}
        renderItem={renderRecord}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={["#7C5FDC"]}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    backgroundColor: "#7C5FDC",
    paddingVertical: 20,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#FFFFFF",
    marginTop: 5,
    opacity: 0.9,
  },
  listContent: {
    padding: 15,
  },
  recordCard: {
    backgroundColor: "white",
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  recordImage: {
    width: "100%",
    height: 200,
    backgroundColor: "#E0E0E0",
  },
  recordContent: {
    padding: 15,
  },
  recordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  recordTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  confidenceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  recordDate: {
    color: "#666",
    fontSize: 13,
    marginBottom: 10,
  },
  recordDiagnosis: {
    fontSize: 15,
    color: "#444",
    lineHeight: 20,
  },
  findingsContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  findingsLabel: {
    fontSize: 13,
    color: "#7C5FDC",
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
});
