import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { getAuth } from 'firebase/auth';
import { 
  Order, 
  OrderStatus,
  subscribeToCustomerOrders 
} from '../../../lib/orders';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';

const { width } = Dimensions.get('window');

export default function MyOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidePanelVisible, setSidePanelVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [shopNames, setShopNames] = useState<{[key: string]: string}>({});
  const router = useRouter();
  const auth = getAuth();
  const user = auth.currentUser;

  // Function to fetch shop name
  const fetchShopName = async (shopId: string) => {
    try {
      if (!shopId) return 'Unknown Shop';
      
      const shopDoc = await getDoc(doc(db, 'shopkeepers', shopId));
      if (shopDoc.exists()) {
        const shopData = shopDoc.data();
        return shopData.shopName || shopData.name || `Shop ${shopId.substring(0, 6)}`;
      }
      return `Shop ${shopId.substring(0, 6)}`;
    } catch (error) {
      console.error('Error fetching shop name:', error);
      return `Shop ${shopId.substring(0, 6)}`;
    }
  };

  // Function to get shop name with caching
  const getShopName = (shopId: string | undefined) => {
    if (!shopId) return 'Unknown Shop';
    
    // Check if we already have the shop name
    if (shopNames[shopId]) {
      return shopNames[shopId];
    }
    
    // Check if the order itself has the shop name
    const orderWithShopName = orders.find(order => order.shopId === shopId && order.shopName);
    if (orderWithShopName?.shopName) {
      return orderWithShopName.shopName;
    }
    
    // Return temporary name until we fetch the actual one
    return `Shop ${shopId.substring(0, 6)}`;
  };

  // Fetch shop names when orders are loaded
  useEffect(() => {
    const fetchAllShopNames = async () => {
      if (orders.length === 0) return;
      
      const uniqueShopIds = [...new Set(orders.map(order => order.shopId).filter(Boolean))];
      const newShopNames: {[key: string]: string} = {};
      
      // Fetch names for all unique shop IDs
      for (const shopId of uniqueShopIds) {
        if (shopId && !shopNames[shopId]) {
          const name = await fetchShopName(shopId);
          newShopNames[shopId] = name;
        }
      }
      
      // Update state with all new shop names at once
      if (Object.keys(newShopNames).length > 0) {
        setShopNames(prev => ({...prev, ...newShopNames}));
      }
    };

    fetchAllShopNames();
  }, [orders]);

  const getShopAvatarColor = (shopId: string | undefined) => {
    const colors = ['#007AFF', '#34C759', '#FF9500', '#5856D6', '#FF3B30'];
    const defaultColor = '#8E8E93';
    
    if (!shopId) return defaultColor;
    
    const colorIndex = shopId.charCodeAt(0) % colors.length;
    return colors[colorIndex];
  };

  const getShopInitial = (shopId: string | undefined) => {
    return getShopName(shopId).charAt(0).toUpperCase();
  };

  // Fetch orders from Firebase for the current customer
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    const unsubscribe = subscribeToCustomerOrders(user.uid, (ordersData) => {
      // Filter out any orders that might be missing critical data
      const validOrders = ordersData.filter(order => 
        order.id && order.shopId && order.customerId
      );
      setOrders(validOrders);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

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
        getShopName(order.shopId).toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items.some(item => 
          item.name?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
    
    setFilteredOrders(filtered);
  }, [activeFilter, searchQuery, orders, shopNames]);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return '#FFA500';
      case 'confirmed': return '#007AFF';
      case 'preparing': return '#5856D6';
      case 'ready': return '#34C759';
      case 'completed': return '#4CD964';
      case 'cancelled': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const getStatusText = (status: OrderStatus) => {
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
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        const parts = dateString.split(' at ');
        return parts[0] || dateString;
      }
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount?.toFixed(2) || '0.00'}`;
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
        <Text style={styles.sidePanelTitle}>Menu</Text>
      </View>
      
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => {
          setSidePanelVisible(false);
          router.push("/customer/home");
        }}
      >
        <Ionicons name="home" size={20} color="#007AFF" />
        <Text style={styles.menuItemText}>Home</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => {
          setSidePanelVisible(false);
          router.push("/customer/search");
        }}
      >
        <Ionicons name="search" size={20} color="#007AFF" />
        <Text style={styles.menuItemText}>Search</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => {
          setSidePanelVisible(false);
          router.push("/customer/messages");
        }}
      >
        <Ionicons name="chatbubbles" size={20} color="#007AFF" />
        <Text style={styles.menuItemText}>Messages</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.menuItem, styles.activeMenuItem]}
        onPress={() => {
          setSidePanelVisible(false);
          router.push("/customer/myorders");
        }}
      >
        <Ionicons name="list" size={20} color="#007AFF" />
        <Text style={styles.menuItemText}>Orders</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => {
          setSidePanelVisible(false);
          router.push("/customer/profile");
        }}
      >
        <Ionicons name="person" size={20} color="#007AFF" />
        <Text style={styles.menuItemText}>Profile</Text>
      </TouchableOpacity>
    </View>
  );

  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity 
      style={styles.orderCard}
      onPress={() => router.push(`/customer/orders/${item.id}` as any)}
    >
      <View style={styles.orderHeader}>
        <View style={styles.shopInfo}>
          <View style={[styles.shopAvatar, { backgroundColor: getShopAvatarColor(item.shopId) }]}>
            <Text style={styles.shopAvatarText}>
              {getShopInitial(item.shopId)}
            </Text>
          </View>
          <View>
            <Text style={styles.shopName}>{getShopName(item.shopId)}</Text>
            <Text style={styles.orderId}>Order #{item.id?.substring(0, 8) || 'N/A'}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status as OrderStatus) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status as OrderStatus) }]}>
            {getStatusText(item.status as OrderStatus)}
          </Text>
        </View>
      </View>
  
      <View style={styles.orderDetails}>
        <Text style={styles.itemsText}>
          {item.items?.length || 0} item{(item.items?.length || 0) !== 1 ? 's' : ''} • {formatCurrency(item.totalAmount)}
        </Text>
        
        <View style={styles.itemsList}>
          {item.items?.slice(0, 2).map((product, index) => (
            <Text key={index} style={styles.productText} numberOfLines={1}>
              {product.quantity}x {product.name}
            </Text>
          ))}
          {(item.items?.length || 0) > 2 && (
            <Text style={styles.moreItemsText}>
              +{(item.items?.length || 0) - 2} more items
            </Text>
          )}
        </View>
  
        <Text style={styles.addressText} numberOfLines={1}>
          📍 {item.deliveryAddress || 'No address provided'}
        </Text>
  
        <Text style={styles.dateText}>
          Ordered on {formatDate(item.createdAt)}
        </Text>
        
        <Text style={styles.paymentText}>
          Payment: {item.paymentMethod === 'cash' ? 'Cash on Delivery' : item.paymentMethod || 'Unknown'}
        </Text>
      </View>
  
      <View style={styles.orderActions}>
        {item.status === 'ready' && (
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Pick Up</Text>
          </TouchableOpacity>
        )}
        {(item.status === 'preparing' || item.status === 'confirmed') && (
          <TouchableOpacity style={styles.actionButtonOutline}>
            <Text style={styles.actionButtonOutlineText}>Track Order</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.detailsButton}>
          <Text style={styles.detailsButtonText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSidePanelVisible(true)}>
            <Ionicons name="menu" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>📦 My Orders</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Please sign in to view your orders</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSidePanelVisible(true)}>
            <Ionicons name="menu" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>📦 My Orders</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading your orders...</Text>
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
        <Text style={styles.headerTitle}>📦 My Orders</Text>
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
            placeholder="Search orders, shops, or items..."
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
            <Text style={[styles.filterText, activeFilter === "all" && styles.activeFilterText]}>All</Text>
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
              : "You haven't placed any orders yet"
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
    backgroundColor: "#f9f9f9",
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
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
  shopInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  shopAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  shopName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  orderId: {
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
  paymentText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  actionButtonOutline: {
    borderWidth: 1,
    borderColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  actionButtonOutlineText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  detailsButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  detailsButtonText: {
    color: '#007AFF',
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