// app/customer/payment.tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// Mock payment methods
const paymentMethods = [
  {
    id: "1",
    type: "Credit Card",
    details: "**** **** **** 1234",
    icon: "card-outline",
    isDefault: true,
  },
  {
    id: "2",
    type: "UPI",
    details: "om@upi",
    icon: "cash-outline",
    isDefault: false,
  },
  {
    id: "3",
    type: "Cash on Delivery",
    details: "Pay at doorstep",
    icon: "wallet-outline",
    isDefault: false,
  },
];

export default function PaymentMethods() {
  const router = useRouter();

  const renderItem = ({ item }: { item: typeof paymentMethods[0] }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.row}>
        <Ionicons name={item.icon as any} size={26} color="#007AFF" />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={styles.title}>{item.type}</Text>
          <Text style={styles.subtitle}>{item.details}</Text>
        </View>
        {item.isDefault && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultText}>Default</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* List */}
      <FlatList
        data={paymentMethods}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
      />

      {/* Add Payment Method Button */}
      <TouchableOpacity style={styles.addButton}>
        <Ionicons name="add-circle-outline" size={22} color="#fff" />
        <Text style={styles.addButtonText}>Add New Method</Text>
      </TouchableOpacity>
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

  card: {
    backgroundColor: "#f9f9f9",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  row: { flexDirection: "row", alignItems: "center" },
  title: { fontSize: 16, fontWeight: "600", color: "#333" },
  subtitle: { fontSize: 13, color: "#666", marginTop: 2 },

  defaultBadge: {
    backgroundColor: "#007AFF",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  defaultText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    margin: 16,
    padding: 14,
    borderRadius: 12,
  },
  addButtonText: { color: "#fff", fontSize: 15, fontWeight: "600", marginLeft: 6 },
});
