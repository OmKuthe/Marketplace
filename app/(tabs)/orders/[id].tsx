import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function OrderDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const order = {
    id,
    product: {
      name: "iPhone 15 Pro Max",
      image: "https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-1inch-blue-titanium_AV1?wid=940&hei=1112&fmt=png-alpha&.v=1692923761222",
      price: "₹1,45,000",
    },
    quantity: 1,
    status: "Shipped",
    expectedDelivery: "30 Aug 2025",
    paymentMethod: "UPI (Google Pay)",
    address: "Om Kuthe, 123 MG Road, Pune, Maharashtra",
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
      </View>

      {/* Order ID */}
      <Text style={styles.orderId}>Order ID: {order.id}</Text>

      {/* Product Info */}
      <View style={styles.productCard}>
        <Image source={{ uri: order.product.image }} style={styles.productImage} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.productName}>{order.product.name}</Text>
          <Text style={styles.price}>{order.product.price}</Text>
          <Text>Quantity: {order.quantity}</Text>
        </View>
      </View>

      {/* Order Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Status</Text>
        <Text style={styles.status}>{order.status}</Text>
        <Text style={styles.delivery}>Expected Delivery: {order.expectedDelivery}</Text>
      </View>

      {/* Payment Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment</Text>
        <Text>{order.paymentMethod}</Text>
      </View>

      {/* Delivery Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Address</Text>
        <Text>{order.address}</Text>
      </View>

      {/* Support Button */}
      <TouchableOpacity style={styles.supportButton}>
        <Ionicons name="headset" size={20} color="#fff" />
        <Text style={styles.supportText}>Need Help?</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  orderId: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  productCard: {
    flexDirection: "row",
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  price: {
    fontSize: 14,
    color: "#008000",
    marginVertical: 4,
  },
  section: {
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
  },
  status: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1E90FF",
  },
  delivery: {
    fontSize: 13,
    color: "#555",
  },
  supportButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1E90FF",
    padding: 14,
    borderRadius: 10,
    marginTop: 10,
  },
  supportText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 8,
    fontWeight: "bold",
  },
});
