import React, { useEffect, useState } from "react";
import { View, Text, Button, FlatList, TouchableOpacity } from "react-native";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../../marketplace/firebaseConfig";

export default function CustomerHome() {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setPosts(data);
      } catch (err) {
        console.log("Error fetching posts:", err);
      }
    };
    fetchPosts();
  }, []);

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>
        🛒 Customer Dashboard
      </Text>

      <Button title="Create Need Post" onPress={() => { /* TODO */ }} />

      <Text style={{ marginTop: 20, fontSize: 16 }}>Latest Posts</Text>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{
              padding: 15,
              marginVertical: 8,
              borderWidth: 1,
              borderRadius: 10,
              backgroundColor: item.type === "NEED" ? "#fce4ec" : "#e3f2fd",
            }}
          >
            <Text style={{ fontWeight: "bold" }}>
              {item.type === "NEED" ? "📝 Need" : "🏷️ Offer"}
            </Text>
            <Text>{item.content}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
