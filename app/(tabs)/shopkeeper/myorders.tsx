import React, { useEffect, useState } from "react";
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
  ScrollView
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { 
  Order, 
  getOrders, 
  updateOrderStatus as updateOrderStatusBackend,
  subscribeToOrders 
} from '../../../lib/orders';
import { useAuth } from '../../../hooks/useAuth';

const { width } = Dimensions.get('window');

// Enhanced color constants matching your design system
const COLORS = {
  primary: 'rgba(15, 177, 234, 1)',
  primaryLight: 'rgba(15, 177, 234, 0.15)',
  primaryDark: 'rgba(12, 142, 187, 1)',
  secondary: 'rgba(9, 68, 89, 1)',
  secondaryLight: 'rgba(9, 68, 89, 0.7)',
  accent: 'rgba(247, 206, 38, 1)',
  accentLight: 'rgba(247, 206, 38, 0.15)',
  danger: 'rgba(255, 49, 49, 1)',
  dangerLight: 'rgba(255, 49, 49, 0.15)',
  success: 'rgba(76, 175, 80, 1)',
  background: '#FFFFFF',
  cardBackground: '#FFFFFF',
  border: '#E0E0E0',
  borderLight: '#F0F0F0',
  textPrimary: 'rgba(9, 68, 89, 1)',
  textSecondary: 'rgba(9, 68, 89, 0.7)',
  textMuted: '#999',
  inputBackground: '#F8F9FA',
  overlay: 'rgba(9, 68, 89, 0.08)'
};

export default function ShopkeeperOrdersScreen() {
  const { user, role, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidePanelVisible, setSidePanelVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const SHOP_ID = user?.uid;

  // Fetch orders with real-time updates
  useEffect(() => {
    if (!SHOP_ID) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    const unsubscribe = subscribeToOrders(SHOP_ID, (ordersData) => {
      setOrders(ordersData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [SHOP_ID]);

  // Apply filters
  useEffect(() => {
    let filtered = orders;
    
    if (activeFilter !== "all") {
      filtered = filtered.filter(order => order.status === activeFilter);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(order =>
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    setFilteredOrders(filtered);
  }, [activeFilter, searchQuery, orders]);

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return COLORS.accent;
      case 'confirmed': return COLORS.primary;
      case 'preparing': return '#5856D6';
      case 'ready': return COLORS.success;
      case 'completed': return '#4CD964';
      case 'cancelled': return COLORS.danger;
      default: return '#8E8E93';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'time-outline';
      case 'confirmed': return 'checkmark-circle-outline';
      case 'preparing': return 'restaurant-outline';
      case 'ready': return 'bag-check-outline';
      case 'completed': return 'checkmark-done-circle-outline';
      case 'cancelled': return 'close-circle-outline';
      default: return 'ellipse-outline';
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  // Update order status in Firebase
  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateOrderStatusBackend(orderId, newStatus);
      Alert.alert("Success", `Order status updated to ${getStatusText(newStatus)}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert("Error", "Failed to update order status. Please try again.");
    }
  };

  const showStatusUpdateOptions = (order: Order) => {
    const options = [];
    
    switch (order.status) {
      case 'pending':
        options.push(
          { text: 'Confirm Order', onPress: () => updateOrderStatus(order.id, 'confirmed') },
          { text: 'Cancel Order', onPress: () => updateOrderStatus(order.id, 'cancelled'), style: 'destructive' }
        );
        break;
      case 'confirmed':
        options.push(
          { text: 'Start Preparing', onPress: () => updateOrderStatus(order.id, 'preparing') },
          { text: 'Cancel Order', onPress: () => updateOrderStatus(order.id, 'cancelled'), style: 'destructive' }
        );
        break;
      case 'preparing':
        options.push(
          { text: 'Mark as Ready', onPress: () => updateOrderStatus(order.id, 'ready') }
        );
        break;
      case 'ready':
        options.push(
          { text: 'Mark as Completed', onPress: () => updateOrderStatus(order.id, 'completed') }
        );
        break;
    }
    
    if (options.length > 0) {
      Alert.alert(
        "Update Order Status",
        `Choose action for order ${order.id}:`,
        [...options, { text: 'Cancel', style: 'cancel' }]
      );
    }
  };

  // Enhanced Side Panel
  const SidePanel = () => (
    <View style={styles.sidePanel}>
      <View style={styles.sidePanelHeader}>
        <TouchableOpacity 
          style={styles.sidePanelClose} 
          onPress={() => setSidePanelVisible(false)}
        >
          <Ionicons name="close" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.sidePanelTitle}>Shop Menu</Text>
      </View>
      
      <View style={styles.menuItems}>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => {
            setSidePanelVisible(false);
            router.push("/shopkeeper/home");
          }}
        >
          <Ionicons name="home" size={22} color={COLORS.primary} />
          <Text style={styles.menuItemText}>Dashboard</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => {
            setSidePanelVisible(false);
            router.push("/shopkeeper/products");
          }}
        >
          <Ionicons name="cube" size={22} color={COLORS.primary} />
          <Text style={styles.menuItemText}>Products</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => {
            setSidePanelVisible(false);
            router.push("/shopkeeper/messages");
          }}
        >
          <Ionicons name="chatbubbles" size={22} color={COLORS.primary} />
          <Text style={styles.menuItemText}>Messages</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.menuItem, styles.activeMenuItem]}
          onPress={() => setSidePanelVisible(false)}
        >
          <Ionicons name="receipt" size={22} color={COLORS.primary} />
          <Text style={[styles.menuItemText, styles.activeMenuItemText]}>Orders</Text>
          <View style={styles.activeMenuItemDot} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => {
            setSidePanelVisible(false);
            router.push("/shopkeeper/profile");
          }}
        >
          <Ionicons name="person" size={22} color={COLORS.primary} />
          <Text style={styles.menuItemText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Enhanced Order Card
  const renderOrderItem = ({ item }: { item: Order }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.customerInfo}>
          <View style={styles.customerAvatar}>
            <Text style={styles.customerAvatarText}>
              {item.customerName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.customerDetails}>
            <Text style={styles.customerName}>{item.customerName}</Text>
            <Text style={styles.orderId}>Order #{item.id.substring(0, 8)}</Text>
            {item.customerPhone && (
              <View style={styles.phoneContainer}>
                <Ionicons name="call" size={12} color={COLORS.textSecondary} />
                <Text style={styles.customerPhone}>{item.customerPhone}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Ionicons 
            name={getStatusIcon(item.status)} 
            size={14} 
            color={getStatusColor(item.status)} 
            style={styles.statusIcon}
          />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <View style={styles.orderSummary}>
          <Text style={styles.itemsCount}>
            {item.items.length} item{item.items.length !== 1 ? 's' : ''}
          </Text>
          <Text style={styles.orderAmount}>{formatCurrency(item.totalAmount)}</Text>
        </View>
        
        <View style={styles.itemsList}>
          {item.items.slice(0, 2).map((product, index) => (
            <View key={index} style={styles.productItem}>
              <Text style={styles.productQuantity}>{product.quantity}x</Text>
              <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
            </View>
          ))}
          {item.items.length > 2 && (
            <Text style={styles.moreItemsText}>
              +{item.items.length - 2} more items
            </Text>
          )}
        </View>

        {item.deliveryAddress && (
          <View style={styles.addressContainer}>
            <Ionicons name="location" size={14} color={COLORS.textSecondary} />
            <Text style={styles.addressText} numberOfLines={1}>
              {item.deliveryAddress}
            </Text>
          </View>
        )}

        <View style={styles.orderMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="time" size={12} color={COLORS.textMuted} />
            <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="card" size={12} color={COLORS.textMuted} />
            <Text style={styles.paymentText}>
              {item.paymentMethod === 'cash' ? 'Cash on Delivery' : item.paymentMethod}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.orderActions}>
        <TouchableOpacity 
          style={styles.detailsButton}
          onPress={() => router.push(`../orders/${item.id}`)}
        >
          <Ionicons name="eye" size={16} color={COLORS.primary} />
          <Text style={styles.detailsButtonText}>View Details</Text>
        </TouchableOpacity>
        
        {item.status !== 'completed' && item.status !== 'cancelled' && (
          <TouchableOpacity 
            style={styles.updateButton}
            onPress={() => showStatusUpdateOptions(item)}
          >
            <Ionicons name="refresh" size={16} color="#fff" />
            <Text style={styles.updateButtonText}>Update Status</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (authLoading || !SHOP_ID) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => setSidePanelVisible(true)}
          >
            <Ionicons name="menu" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Customer Orders</Text>
          <View style={styles.headerPlaceholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>
            {authLoading ? "Loading..." : "No shop associated with your account"}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading && orders.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => setSidePanelVisible(true)}
          >
            <Ionicons name="menu" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Customer Orders</Text>
          <View style={styles.headerPlaceholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Enhanced Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => setSidePanelVisible(true)}
        >
          <Ionicons name="menu" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Customer Orders</Text>
          <Text style={styles.headerSubtitle}>
            {orders.length} total order{orders.length !== 1 ? 's' : ''}
          </Text>
        </View>
        
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Side Panel */}
      {sidePanelVisible && <SidePanel />}
      {sidePanelVisible && <View style={styles.overlay} />}

      {/* Enhanced Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders, customers, or items..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Enhanced Order Filters */}
      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.filterOptions}
        >
          {['all', 'pending', 'confirmed', 'preparing', 'ready', 'completed'].map((filter) => (
            <TouchableOpacity 
              key={filter}
              style={[
                styles.filterButton, 
                activeFilter === filter && styles.activeFilter
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[
                styles.filterText, 
                activeFilter === filter && styles.activeFilterText
              ]}>
                {filter === 'all' ? 'All Orders' : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Enhanced Orders Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{orders.filter(o => o.status === 'pending').length}</Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>
            {orders.filter(o => o.status === 'confirmed' || o.status === 'preparing').length}
          </Text>
          <Text style={styles.summaryLabel}>Active</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{orders.filter(o => o.status === 'ready').length}</Text>
          <Text style={styles.summaryLabel}>Ready</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{orders.filter(o => o.status === 'completed').length}</Text>
          <Text style={styles.summaryLabel}>Completed</Text>
        </View>
      </View>

      {/* Enhanced Orders List */}
      {filteredOrders.length > 0 ? (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIllustration}>
            <Ionicons name="receipt-outline" size={80} color={COLORS.textMuted} />
          </View>
          <Text style={styles.emptyStateText}>
            {searchQuery || activeFilter !== "all" ? "No orders found" : "No orders yet"}
          </Text>
          <Text style={styles.emptyStateSubText}>
            {searchQuery || activeFilter !== "all" 
              ? "Try adjusting your search or filter" 
              : "Customer orders will appear here when they place orders"
            }
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    marginTop: 27,
  },
  // Enhanced Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  menuButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  headerPlaceholder: {
    width: 40,
  },
  // Enhanced Side Panel
  sidePanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width * 0.75,
    height: '100%',
    backgroundColor: COLORS.background,
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 999,
  },
  sidePanelHeader: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sidePanelClose: {
    position: 'absolute',
    top: 60,
    right: 20,
    padding: 4,
  },
  sidePanelTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  menuItems: {
    padding: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  activeMenuItem: {
    backgroundColor: COLORS.primaryLight,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  activeMenuItemText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  activeMenuItemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: 'auto',
  },
  menuItemText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    marginLeft: 16,
    fontWeight: '500',
  },
  // Enhanced Search
  searchContainer: {
    padding: 16,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  // Enhanced Filters
  filterContainer: {
    padding: 16,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.inputBackground,
  },
  activeFilter: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#fff',
    fontWeight: '600',
  },
  // Enhanced Summary
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 6,
    fontWeight: '500',
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },
  // Enhanced Order Card
  listContainer: {
    padding: 16,
    gap: 16,
  },
  orderCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  customerAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  orderId: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerPhone: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusIcon: {
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderDetails: {
    marginBottom: 20,
  },
  orderSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemsCount: {
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  orderAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  itemsList: {
    marginBottom: 12,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  productQuantity: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
    marginRight: 8,
    minWidth: 20,
  },
  productName: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
  },
  moreItemsText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    marginTop: 4,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  addressText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: 6,
    flex: 1,
  },
  orderMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  paymentText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  detailsButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    paddingTop: 100,
  },
  emptyIllustration: {
    padding: 20,
    backgroundColor: COLORS.inputBackground,
    borderRadius: 40,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});