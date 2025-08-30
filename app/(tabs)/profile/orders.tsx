// app/customer/orders.tsx
import React from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// Mock past orders data
const pastOrders = [
  {
    id: "1",
    title: "Wireless Headphones",
    date: "Aug 12, 2025",
    amount: "$120",
    status: "Delivered",
  },
  {
    id: "2",
    title: "Running Shoes",
    date: "Jul 28, 2025",
    amount: "$75",
    status: "Delivered",
  },
  {
    id: "3",
    title: "Smartwatch",
    date: "Jun 10, 2025",
    amount: "$200",
    status: "Cancelled",
  },
];

export default function OrdersHistory() {
  const router = useRouter();

  const renderItem = ({ item }: { item: typeof pastOrders[0] }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/order/${item.id}`as any)}
    >
      <View style={styles.row}>
        <Ionicons name="cube-outline" size={28} color="#007AFF" />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.subtitle}>{item.date}</Text>
        </View>
        <Text style={styles.amount}>{item.amount}</Text>
      </View>

      <View style={styles.footerRow}>
        <Text style={[styles.status, item.status === "Cancelled" && { color: "red" }]}>
          {item.status}
        </Text>
        <Ionicons name="chevron-forward" size={20} color="#999" />
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
        <Text style={styles.headerTitle}>Order History</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* List */}
      <FlatList
        data={pastOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
      />
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
  amount: { fontSize: 15, fontWeight: "bold", color: "#007AFF" },

  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    alignItems: "center",
  },
  status: { fontSize: 14, fontWeight: "500", color: "green" },
});
