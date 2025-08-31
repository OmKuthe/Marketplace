import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function SupportScreen() {
  const router = useRouter();

  const handleContact = (type: "email" | "phone") => {
    if (type === "email") {
      Linking.openURL("mailto:support@freshgrocery.com");
    } else {
      Linking.openURL("tel:+919876543210");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🆘 Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.title}>Need Help?</Text>
        <Text style={styles.subtitle}>We’re here to support your business 24/7.</Text>

        <TouchableOpacity style={styles.option} onPress={() => handleContact("phone")}>
          <Ionicons name="call-outline" size={22} color="#007AFF" />
          <Text style={styles.optionText}>Call Support</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={() => handleContact("email")}>
          <Ionicons name="mail-outline" size={22} color="#007AFF" />
          <Text style={styles.optionText}>Email Support</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option}>
          <Ionicons name="chatbubbles-outline" size={22} color="#007AFF" />
          <Text style={styles.optionText}>Live Chat</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 16, borderBottomWidth: 1, borderBottomColor: "#eee",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  body: { padding: 20 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#666", marginBottom: 24 },
  option: {
    flexDirection: "row", alignItems: "center", paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: "#eee",
  },
  optionText: { fontSize: 16, marginLeft: 12 },
});
