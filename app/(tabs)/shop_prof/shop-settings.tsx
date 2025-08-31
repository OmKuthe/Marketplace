import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Switch, SafeAreaView, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function ShopSettingsScreen() {
  const router = useRouter();
  const [openStatus, setOpenStatus] = useState(true);
  const [autoAcceptOrders, setAutoAcceptOrders] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>⚙️ Shop Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.settingItem}>
          <Text style={styles.label}>Shop Open</Text>
          <Switch value={openStatus} onValueChange={setOpenStatus} />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.label}>Auto Accept Orders</Text>
          <Switch value={autoAcceptOrders} onValueChange={setAutoAcceptOrders} />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.label}>Business Category</Text>
          <Text style={styles.value}>Groceries</Text>
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.label}>Shop Timing</Text>
          <Text style={styles.value}>08:00 AM - 08:00 PM</Text>
        </View>
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
  settingItem: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#eee",
  },
  label: { fontSize: 16, color: "#333" },
  value: { fontSize: 16, color: "#666" },
});
