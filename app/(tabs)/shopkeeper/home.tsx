import { collection, getDocs, orderBy, query } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity
} from "react-native";
import { db } from "../../../firebaseConfig";

export default function CustomerHome() {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPosts(data);
      } catch (err) {
        console.log("Error fetching posts:", err);
      }
    };
    fetchPosts();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>🛒 Customer Dashboard</Text>

      <TouchableOpacity style={styles.createButton}>
        <Text style={styles.createButtonText}>+ Create Need Post</Text>
      </TouchableOpacity>

      <Text style={styles.subHeader}>📢 Latest Posts</Text>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.card,
              item.type === "NEED" ? styles.needCard : styles.offerCard,
            ]}
          >
            <Text style={styles.cardTitle}>
              {item.type === "NEED" ? "📝 Need" : "🏷️ Offer"}
            </Text>
            <Text style={styles.cardContent}>{item.content}</Text>
            {item.timestamp && (
              <Text style={styles.timestamp}>
                {new Date(item.timestamp.seconds * 1000).toLocaleString()}
              </Text>
            )}
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f9f9f9",
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
  },
  createButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  subHeader: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  card: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  needCard: {
    backgroundColor: "#ffe0e6",
  },
  offerCard: {
    backgroundColor: "#e1f0ff",
  },
  cardTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 6,
  },
  cardContent: {
    fontSize: 14,
    marginBottom: 6,
    color: "#333",
  },
  timestamp: {
    fontSize: 12,
    color: "#666",
    textAlign: "right",
  },
});
