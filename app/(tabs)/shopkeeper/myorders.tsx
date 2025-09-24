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

const { width } = Dimensions.get('window');

export default function ShopkeeperOrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidePanelVisible, setSidePanelVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Replace with your actual shop ID
  const SHOP_ID = "shop-001";

  // Fetch orders with real-time updates
  useEffect(() => {
    setIsLoading(true);
    
    // Set up real-time listener
    const unsubscribe = subscribeToOrders(SHOP_ID, (ordersData) => {
      setOrders(ordersData);
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Apply filters whenever orders, activeFilter, or searchQuery change
  useEffect(() => {
    let filtered = orders;
    
    // Apply status filter
    if (activeFilter !== "all") {
      filtered = filtered.filter(order => order.status === activeFilter);
    }
    
    // Apply search filter
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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  // Update order status in Firebase
  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateOrderStatusBackend(orderId, newStatus);
      // No need to manually update local state - real-time listener will handle it
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
          { text: 'Cancel Order', onPress: () => updateOrderStatus(order.id, 'cancelled') }
        );
        break;
      case 'confirmed':
        options.push(
          { text: 'Start Preparing', onPress: () => updateOrderStatus(order.id, 'preparing') },
          { text: 'Cancel Order', onPress: () => updateOrderStatus(order.id, 'cancelled') }
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

  const SidePanel = () => (
    <View style={styles.sidePanel}>
      <TouchableOpacity 
        style={styles.sidePanelClose} 
        onPress={() => setSidePanelVisible(false)}
      >
        <Ionicons name="close" size={24} color="#333" />
      </TouchableOpacity>
      
      <View style={styles.sidePanelHeader}>
        <Text style={styles.sidePanelTitle}>Shop Menu</Text>
      </View>
      
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => {
          setSidePanelVisible(false);
          router.push("/shopkeeper/home");
        }}
      >
        <Ionicons name="home" size={20} color="#007AFF" />
        <Text style={styles.menuItemText}>Dashboard</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => {
          setSidePanelVisible(false);
          router.push("/shopkeeper/products");
        }}
      >
        <Ionicons name="cube" size={20} color="#007AFF" />
        <Text style={styles.menuItemText}>Products</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => {
          setSidePanelVisible(false);
          router.push("/shopkeeper/messages");
        }}
      >
        <Ionicons name="chatbubbles" size={20} color="#007AFF" />
        <Text style={styles.menuItemText}>Messages</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.menuItem, styles.activeMenuItem]}
        onPress={() => setSidePanelVisible(false)}
      >
        <Ionicons name="list" size={20} color="#007AFF" />
        <Text style={styles.menuItemText}>Orders</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => {
          setSidePanelVisible(false);
          router.push("/shopkeeper/profile");
        }}
      >
        <Ionicons name="person" size={20} color="#007AFF" />
        <Text style={styles.menuItemText}>Profile</Text>
      </TouchableOpacity>
    </View>
  );

  const renderOrderItem = ({ item }: { item: Order }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.customerInfo}>
          <Image 
            source={{ uri: item.customerAvatar || 'https://via.placeholder.com/150' }} 
            style={styles.customerAvatar}
          />
          <View>
            <Text style={styles.customerName}>{item.customerName}</Text>
            <Text style={styles.orderId}>Order #{item.id}</Text>
            {item.customerPhone && (
              <Text style={styles.customerPhone}>{item.customerPhone}</Text>
            )}
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <Text style={styles.itemsText}>
          {item.items.length} item{item.items.length !== 1 ? 's' : ''} • {formatCurrency(item.totalAmount)}
        </Text>
        
        <View style={styles.itemsList}>
          {item.items.slice(0, 3).map((product, index) => (
            <Text key={index} style={styles.productText} numberOfLines={1}>
              {product.quantity}x {product.name}
            </Text>
          ))}
          {item.items.length > 3 && (
            <Text style={styles.moreItemsText}>
              +{item.items.length - 3} more items
            </Text>
          )}
        </View>

        {item.deliveryAddress && (
          <Text style={styles.addressText} numberOfLines={1}>
            📍 {item.deliveryAddress}
          </Text>
        )}

        {item.specialInstructions && (
          <Text style={styles.instructionsText} numberOfLines={2}>
            📝 {item.specialInstructions}
          </Text>
        )}

        <Text style={styles.dateText}>
          Ordered on {formatDate(item.createdAt)}
        </Text>
      </View>

      <View style={styles.orderActions}>
        <TouchableOpacity 
          style={styles.detailsButton}
          onPress={() => router.push(`../orders/${item.id}`)}
        >
          <Text style={styles.detailsButtonText}>View Details</Text>
        </TouchableOpacity>
        
        {item.status !== 'completed' && item.status !== 'cancelled' && (
          <TouchableOpacity 
            style={styles.updateButton}
            onPress={() => showStatusUpdateOptions(item)}
          >
            <Text style={styles.updateButtonText}>Update Status</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (isLoading && orders.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSidePanelVisible(true)}>
            <Ionicons name="menu" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>📋 Customer Orders</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with menu button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSidePanelVisible(true)}>
          <Ionicons name="menu" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📋 Customer Orders</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Side Panel */}
      {sidePanelVisible && <SidePanel />}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#777" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders, customers, or items..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Order Filters */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterOptions}>
          <TouchableOpacity 
            style={[styles.filterButton, activeFilter === "all" && styles.activeFilter]}
            onPress={() => setActiveFilter("all")}
          >
            <Text style={[styles.filterText, activeFilter === "all" && styles.activeFilterText]}>All Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, activeFilter === "pending" && styles.activeFilter]}
            onPress={() => setActiveFilter("pending")}
          >
            <Text style={[styles.filterText, activeFilter === "pending" && styles.activeFilterText]}>Pending</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, activeFilter === "confirmed" && styles.activeFilter]}
            onPress={() => setActiveFilter("confirmed")}
          >
            <Text style={[styles.filterText, activeFilter === "confirmed" && styles.activeFilterText]}>Confirmed</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, activeFilter === "preparing" && styles.activeFilter]}
            onPress={() => setActiveFilter("preparing")}
          >
            <Text style={[styles.filterText, activeFilter === "preparing" && styles.activeFilterText]}>Preparing</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, activeFilter === "ready" && styles.activeFilter]}
            onPress={() => setActiveFilter("ready")}
          >
            <Text style={[styles.filterText, activeFilter === "ready" && styles.activeFilterText]}>Ready</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, activeFilter === "completed" && styles.activeFilter]}
            onPress={() => setActiveFilter("completed")}
          >
            <Text style={[styles.filterText, activeFilter === "completed" && styles.activeFilterText]}>Completed</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Orders Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{orders.filter(o => o.status === 'pending').length}</Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{orders.filter(o => o.status === 'confirmed' || o.status === 'preparing').length}</Text>
          <Text style={styles.summaryLabel}>Active</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{orders.filter(o => o.status === 'ready').length}</Text>
          <Text style={styles.summaryLabel}>Ready</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{orders.filter(o => o.status === 'completed').length}</Text>
          <Text style={styles.summaryLabel}>Completed</Text>
        </View>
      </View>

      {/* Orders List */}
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
          <Ionicons name="receipt-outline" size={64} color="#ccc" />
          <Text style={styles.emptyStateText}>No orders found</Text>
          <Text style={styles.emptyStateSubText}>
            {searchQuery || activeFilter !== "all" 
              ? "Try adjusting your search or filter" 
              : "You haven't received any orders yet"
            }
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

// Keep all your existing styles the same...
const styles = StyleSheet.create({
  // ... (all your existing styles remain exactly the same)
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
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
    fontSize: 20,
    fontWeight: "bold",
  },
  sidePanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width * 0.7,
    height: '100%',
    backgroundColor: '#fff',
    zIndex: 100,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sidePanelClose: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  sidePanelHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 15,
    marginBottom: 20,
  },
  sidePanelTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activeMenuItem: {
    backgroundColor: '#f0f7ff',
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 15,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
  },
  filterContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  activeFilter: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterText: {
    color: 'white',
    fontWeight: '500',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  orderId: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  customerPhone: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  orderDetails: {
    marginBottom: 16,
  },
  itemsText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  itemsList: {
    marginBottom: 8,
  },
  productText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  moreItemsText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  addressText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  instructionsText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
    backgroundColor: '#fff9c4',
    padding: 6,
    borderRadius: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  detailsButton: {
    borderWidth: 1,
    borderColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  detailsButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  updateButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});