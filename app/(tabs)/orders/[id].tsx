
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Order, getOrderById, updateOrderStatus } from '../../../lib/orders';

export default function OrderDetailsPage() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    
    const fetchOrder = async () => {
      try {
        const orderData = await getOrderById(id as string);
        setOrder(orderData);
      } catch (error) {
        console.error('Error fetching order:', error);
        Alert.alert('Error', 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const handleStatusUpdate = async (newStatus: Order['status']) => {
    if (!order) return;
    
    try {
      await updateOrderStatus(order.id, newStatus);
      setOrder({ ...order, status: newStatus });
      Alert.alert('Success', `Order status updated to ${getStatusText(newStatus)}`);
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return '#FF9500';
      case 'confirmed': return '#007AFF';
      case 'preparing': return '#5856D6';
      case 'ready': return '#34C759';
      case 'completed': return '#4CD964';
      case 'cancelled': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'Pending Review';
      case 'confirmed': return 'Order Confirmed';
      case 'preparing': return 'Preparing Order';
      case 'ready': return 'Ready for Pickup';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Order not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Order Status */}
        <View style={styles.section}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
              {getStatusText(order.status)}
            </Text>
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.customerInfo}>
            <Image 
              source={{ uri: order.customerAvatar || 'https://via.placeholder.com/150' }} 
              style={styles.customerAvatar}
            />
            <View style={styles.customerDetails}>
              <Text style={styles.customerName}>{order.customerName}</Text>
              {order.customerPhone && (
                <Text style={styles.customerPhone}>{order.customerPhone}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {order.items.map((item, index) => (
            <View key={index} style={styles.orderItem}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>{formatCurrency(item.price)} each</Text>
              </View>
              <View style={styles.itemQuantity}>
                <Text style={styles.quantityText}>Qty: {item.quantity}</Text>
                <Text style={styles.itemTotal}>{formatCurrency(item.price * item.quantity)}</Text>
              </View>
            </View>
          ))}
          <View style={styles.totalContainer}>
            <Text style={styles.totalText}>Total: {formatCurrency(order.totalAmount)}</Text>
          </View>
        </View>

        {/* Order Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order ID:</Text>
            <Text style={styles.detailValue}>{order.id}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order Date:</Text>
            <Text style={styles.detailValue}>{formatDate(order.createdAt)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Method:</Text>
            <Text style={styles.detailValue}>{order.paymentMethod.toUpperCase()}</Text>
          </View>
        </View>

        {/* Delivery Address */}
        {order.deliveryAddress && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <Text style={styles.addressText}>{order.deliveryAddress}</Text>
          </View>
        )}

        {/* Special Instructions */}
        {order.specialInstructions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Special Instructions</Text>
            <Text style={styles.instructionsText}>{order.specialInstructions}</Text>
          </View>
        )}

        {/* Status Update Buttons */}
        {order.status !== 'completed' && order.status !== 'cancelled' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Update Status</Text>
            <View style={styles.statusButtons}>
              {order.status === 'pending' && (
                <>
                  <TouchableOpacity 
                    style={[styles.statusButton, { backgroundColor: '#007AFF' }]}
                    onPress={() => handleStatusUpdate('confirmed')}
                  >
                    <Text style={styles.statusButtonText}>Confirm Order</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.statusButton, { backgroundColor: '#FF3B30' }]}
                    onPress={() => handleStatusUpdate('cancelled')}
                  >
                    <Text style={styles.statusButtonText}>Cancel Order</Text>
                  </TouchableOpacity>
                </>
              )}
              {order.status === 'confirmed' && (
                <>
                  <TouchableOpacity 
                    style={[styles.statusButton, { backgroundColor: '#5856D6' }]}
                    onPress={() => handleStatusUpdate('preparing')}
                  >
                    <Text style={styles.statusButtonText}>Start Preparing</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.statusButton, { backgroundColor: '#FF3B30' }]}
                    onPress={() => handleStatusUpdate('cancelled')}
                  >
                    <Text style={styles.statusButtonText}>Cancel Order</Text>
                  </TouchableOpacity>
                </>
              )}
              {order.status === 'preparing' && (
                <TouchableOpacity 
                  style={[styles.statusButton, { backgroundColor: '#34C759' }]}
                  onPress={() => handleStatusUpdate('ready')}
                >
                  <Text style={styles.statusButtonText}>Mark as Ready</Text>
                </TouchableOpacity>
              )}
              {order.status === 'ready' && (
                <TouchableOpacity 
                  style={[styles.statusButton, { backgroundColor: '#4CD964' }]}
                  onPress={() => handleStatusUpdate('completed')}
                >
                  <Text style={styles.statusButtonText}>Mark as Completed</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    marginTop:27
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  customerPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  itemPrice: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  itemQuantity: {
    alignItems: 'flex-end',
  },
  quantityText: {
    fontSize: 12,
    color: '#666',
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
  totalContainer: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    marginTop: 8,
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  addressText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  instructionsText: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
    lineHeight: 20,
    backgroundColor: '#fff9c4',
    padding: 12,
    borderRadius: 6,
  },
  statusButtons: {
    gap: 8,
  },
  statusButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});