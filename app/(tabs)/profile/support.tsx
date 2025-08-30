// app/customer/support.tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function Support() {
  const router = useRouter();

  const handleLink = (type: string) => {
    if (type === "call") {
      Linking.openURL("tel:+911234567890");
    } else if (type === "email") {
      Linking.openURL("mailto:support@myapp.com");
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.sectionTitle}>Need Help?</Text>
        <Text style={styles.sectionSubtitle}>
          Our team is here to assist you with orders, payments, or any issues.
        </Text>

        {/* Contact Options */}
        <TouchableOpacity style={styles.card} onPress={() => handleLink("call")}>
          <Ionicons name="call-outline" size={24} color="#007AFF" />
          <Text style={styles.cardText}>Call Us: +91 12345 67890</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => handleLink("email")}>
          <Ionicons name="mail-outline" size={24} color="#007AFF" />
          <Text style={styles.cardText}>Email: support@myapp.com</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => handleLink("chat")}>
          <Ionicons name="chatbubble-ellipses-outline" size={24} color="#007AFF" />
          <Text style={styles.cardText}>Chat with Support</Text>
        </TouchableOpacity>

        {/* FAQ Section */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>FAQs</Text>

        <View style={styles.faqBox}>
          <Text style={styles.faqQ}>Q: How do I track my order?</Text>
          <Text style={styles.faqA}>
            You can check your order status under "My Orders" in the app.
          </Text>
        </View>

        <View style={styles.faqBox}>
          <Text style={styles.faqQ}>Q: What payment methods do you accept?</Text>
          <Text style={styles.faqA}>
            We accept Credit/Debit Cards, UPI, Net Banking, and Cash on Delivery.
          </Text>
        </View>

        <View style={styles.faqBox}>
          <Text style={styles.faqQ}>Q: How can I cancel an order?</Text>
          <Text style={styles.faqA}>
            Go to "My Orders", select your order, and choose "Cancel Order".
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: 16, borderBottomWidth: 1, borderBottomColor: "#eee"
  },
  headerTitle: { fontSize: 18, fontWeight: "bold" },

  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 6, color: "#333" },
  sectionSubtitle: { fontSize: 14, color: "#666", marginBottom: 16 },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  cardText: { marginLeft: 12, fontSize: 15, fontWeight: "500", color: "#333" },

  faqBox: {
    backgroundColor: "#f4f4f4",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  faqQ: { fontSize: 15, fontWeight: "600", marginBottom: 4, color: "#333" },
  faqA: { fontSize: 14, color: "#555" },
});
