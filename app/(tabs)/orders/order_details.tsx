// app/customer/order-details.tsx
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
import { Order, getOrderById } from '../../../lib/orders';
import { useAuth } from '@/hooks/useAuth';

const colors = {
  primary: '#2874F0',
  secondary: '#FB641B',
  background: '#F1F3F6',
  surface: '#FFFFFF',
  textPrimary: '#212121',
  textSecondary: '#878787',
  border: '#E0E0E0',
  success: '#388E3C',
  warning: '#FF9800',
  error: '#D32F2F'
};

export default function CustomerOrderDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Order ID is missing');
      setLoading(false);
      return;
    }
    
    const fetchOrder = async () => {
        try {
          console.log('=== ORDER DETAILS DEBUG ===');
          console.log('📋 Order ID from params:', id);
          console.log('👤 Current user:', user);
          console.log('👤 User UID:', user?.uid);
          console.log('👤 User logged in?', !!user);
          
          const orderData = await getOrderById(id as string);
          
          console.log('📦 Order data from Firebase:', orderData);
          
          // Check if orderData is null
          if (!orderData) {
            console.log('❌ Order not found in database');
            setError('Order not found');
            setLoading(false);
            return;
          }
          
          console.log('🔍 Order customerId:', orderData.customerId);
          console.log('🔍 Current user uid:', user?.uid);
          console.log('🔍 IDs match?', orderData.customerId === user?.uid);
          
          // TEMPORARY: Comment out the customer verification for debugging
          // TODO: Re-enable this after fixing the customerId issue
          /*
          if (orderData.customerId !== user?.uid) {
            console.warn('🚫 Access denied: Customer ID mismatch');
            setError(`Access Denied: This order does not belong to you. 
  Order Customer: ${orderData.customerId}
  Your ID: ${user?.uid || 'Not logged in'}`);
            setLoading(false);
            return;
          }
          */
          
          console.log('✅ Access granted (temporarily bypassed)');
          setOrder(orderData);
          
        } catch (error) {
          console.error('❌ Error fetching order:', error);
          setError('Failed to load order details. Please try again.');
        } finally {
          setLoading(false);
        }
      };
  
      fetchOrder();
    }, [id, user?.uid]);

    
  // Add safe type guards for order properties
  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return colors.warning;
      case 'confirmed': return colors.primary;
      case 'preparing': return '#5856D6';
      case 'ready': return '#34C759';
      case 'completed': return colors.success;
      case 'cancelled': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'Pending Review';
      case 'confirmed': return 'Order Confirmed';
      case 'preparing': return 'Preparing Your Order';
      case 'ready': return 'Ready for Pickup/Delivery';
      case 'completed': return 'Order Completed';
      case 'cancelled': return 'Order Cancelled';
      default: return status;
    }
  };

  const getStatusDescription = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'Your order is being reviewed by the shopkeeper.';
      case 'confirmed': return 'Shopkeeper has accepted your order.';
      case 'preparing': return 'Your items are being prepared.';
      case 'ready': return 'Your order is ready for pickup/delivery.';
      case 'completed': return 'Order has been successfully delivered.';
      case 'cancelled': return 'This order has been cancelled.';
      default: return '';
    }
  };

  const getEstimatedTime = (status: Order['status']) => {
    switch (status) {
      case 'pending': return '30 minutes';
      case 'confirmed': return '20-25 minutes';
      case 'preparing': return '10-15 minutes';
      case 'ready': return 'Ready now';
      case 'completed': return 'Delivered';
      case 'cancelled': return 'N/A';
      default: return '';
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', { 
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const handleContactSeller = () => {
    if (order?.shopName) {
      Alert.alert(
        'Contact Seller',
        `Would you like to contact ${order.shopName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Contact', onPress: () => {
            // Add contact functionality here
            console.log('Contact seller:', order.shopName);
          }}
        ]
      );
    }
  };

  const handleReorder = () => {
    if (order) {
      Alert.alert(
        'Reorder',
        'Add these items to cart?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add to Cart', onPress: () => {
            // Implement reorder logic
            router.push('/customer/home');
          }}
        ]
      );
    }
  };

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error || !order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Ionicons name="document-text-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.errorText}>{error || 'Order not found'}</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate total amount safely
  const deliveryFee = order.totalAmount > 500 ? 0 : 40;
  const finalAmount = order.totalAmount + deliveryFee;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Order Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.orderId}>Order # {order.id?.slice(-8).toUpperCase() || 'N/A'}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                {getStatusText(order.status)}
              </Text>
            </View>
          </View>
          
          <Text style={styles.statusDescription}>
            {getStatusDescription(order.status)}
          </Text>
          
          {order.status !== 'completed' && order.status !== 'cancelled' && (
            <View style={styles.etaContainer}>
              <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.etaText}>
                Estimated time: {getEstimatedTime(order.status)}
              </Text>
            </View>
          )}
        </View>

        {/* Shop Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shop Information</Text>
          <View style={styles.shopInfo}>
            <View style={styles.shopIcon}>
              <Ionicons name="storefront-outline" size={24} color={colors.primary} />
            </View>
            <View style={styles.shopDetails}>
              <Text style={styles.shopName}>{order.shopName || 'Unknown Shop'}</Text>
              <Text style={styles.shopAddress}>
                {order.deliveryAddress?.split(',')[0] || 'Address not available'}
              </Text>
            </View>
            <TouchableOpacity style={styles.contactButton} onPress={handleContactSeller}>
              <Ionicons name="call-outline" size={16} color={colors.primary} />
              <Text style={styles.contactButtonText}>Contact</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {order.items?.map((item, index) => (
            <View key={index} style={styles.orderItem}>
              <Image 
                source={{ uri: item.image || 'https://via.placeholder.com/60' }} 
                style={styles.itemImage}
                defaultSource={{ uri: 'https://via.placeholder.com/60' }}
              />
              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.name || 'Unknown Item'}</Text>
                <Text style={styles.itemPrice}>
                  {formatCurrency(item.price || 0)} × {item.quantity || 1}
                </Text>
              </View>
              <Text style={styles.itemTotal}>
                {formatCurrency((item.price || 0) * (item.quantity || 1))}
              </Text>
            </View>
          ))}
          
          {/* Price Breakdown */}
          <View style={styles.priceBreakdown}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Items Total</Text>
              <Text style={styles.priceValue}>{formatCurrency(order.totalAmount || 0)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Delivery Fee</Text>
              <Text style={styles.priceValue}>
                {deliveryFee === 0 ? 'FREE' : formatCurrency(deliveryFee)}
              </Text>
            </View>
            <View style={[styles.priceRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(finalAmount)}
              </Text>
            </View>
          </View>
        </View>

        {/* Order Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Timeline</Text>
          <View style={styles.timeline}>
            {['pending', 'confirmed', 'preparing', 'ready', 'completed'].map((status, index) => {
              const currentStatusIndex = ['pending', 'confirmed', 'preparing', 'ready', 'completed'].indexOf(order.status);
              const statusIndex = ['pending', 'confirmed', 'preparing', 'ready', 'completed'].indexOf(status);
              
              const isActive = order.status === status;
              const isCompleted = statusIndex < currentStatusIndex;
              const isCancelled = order.status === 'cancelled';
              
              return (
                <View key={status} style={styles.timelineItem}>
                  <View style={[
                    styles.timelineDot,
                    isCompleted && !isCancelled && styles.timelineDotCompleted,
                    isActive && !isCancelled && styles.timelineDotActive,
                    isCancelled && styles.timelineDotCancelled
                  ]}>
                    {isCompleted && !isCancelled && <Ionicons name="checkmark" size={12} color="#fff" />}
                    {isCancelled && <Ionicons name="close" size={12} color="#fff" />}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={[
                      styles.timelineStatus,
                      (isCompleted || isActive) && styles.timelineStatusActive,
                      isCancelled && styles.timelineStatusCancelled
                    ]}>
                      {getStatusText(status as Order['status'])}
                    </Text>
                    {isActive && !isCancelled && (
                      <Text style={styles.timelineTime}>In progress</Text>
                    )}
                    {isCancelled && status === 'pending' && (
                      <Text style={styles.timelineTime}>Order was cancelled</Text>
                    )}
                  </View>
                  {index < 4 && (
                    <View style={[
                      styles.timelineLine,
                      isCompleted && !isCancelled && styles.timelineLineCompleted,
                      isCancelled && styles.timelineLineCancelled
                    ]} />
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Order Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Information</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.infoLabel}>Order Date</Text>
              <Text style={styles.infoValue}>{formatDate(order.createdAt)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="card-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.infoLabel}>Payment Method</Text>
              <Text style={styles.infoValue}>{(order.paymentMethod || 'cash').toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Delivery Address */}
        {order.deliveryAddress && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <View style={styles.addressContainer}>
              <Ionicons name="location-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.addressText}>{order.deliveryAddress}</Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleContactSeller}>
            <Ionicons name="chatbubble-outline" size={18} color={colors.primary} />
            <Text style={styles.secondaryButtonText}>Contact Support</Text>
          </TouchableOpacity>
          
          {order.status === 'completed' && (
            <TouchableOpacity style={styles.primaryButton} onPress={handleReorder}>
              <Ionicons name="repeat-outline" size={18} color="#fff" />
              <Text style={styles.primaryButtonText}>Reorder</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 18,
    color: colors.textSecondary,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 4,
  },
  backButtonText: {
    color: colors.surface,
    fontWeight: 'bold',
  },
  statusCard: {
    backgroundColor: colors.surface,
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusDescription: {
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  etaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  etaText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  section: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  shopInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shopIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  shopDetails: {
    flex: 1,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  shopAddress: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 6,
  },
  contactButtonText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
    marginLeft: 4,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  priceBreakdown: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  priceValue: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  timeline: {
    marginLeft: 12,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: colors.surface,
    zIndex: 1,
  },
  timelineDotCompleted: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  timelineDotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 4,
  },
  timelineStatus: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  timelineStatusActive: {
    color: colors.textPrimary,
  },
  timelineTime: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  timelineLine: {
    position: 'absolute',
    left: 9,
    top: 20,
    bottom: -20,
    width: 2,
    backgroundColor: colors.border,
  },
  timelineLineCompleted: {
    backgroundColor: colors.success,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    marginLeft: 8,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: colors.surface,
    fontWeight: '600',
    marginLeft: 6,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontWeight: '600',
    marginLeft: 6,
  },
  timelineDotCancelled: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  timelineStatusCancelled: {
    color: colors.error,
  },
  timelineLineCancelled: {
    backgroundColor: colors.error,
  },
});