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

// Use the SAME color palette from search page
const colors = {
  background: '#f8fafc',
  surface: '#ffffff',
  textPrimary: '#1e293b',
  textSecondary: '#64748b',
  accent: '#3b82f6',
  accentLight: '#60a5fa',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  border: '#e2e8f0',
  darkButton: '#1e293b',
  needColor: '#f97316',
  offerColor: '#10b981',
  gradientPrimary: ['#667eea', '#764ba2'],
  gradientSecondary: ['#f093fb', '#f5576c'],
  gradientSuccess: ['#10b981', '#34d399'],
  gradientWarning: ['#f59e0b', '#fbbf24'],
  needCard: 'rgba(249, 115, 22, 0.08)',
  offerCard: 'rgba(16, 185, 129, 0.08)',
  lightBackground: 'rgba(226, 232, 240, 0.4)',
  electricPurple: '#8b5cf6',
  deepBlue: '#1e40af',
};

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
    const avatarColors = [colors.accent, colors.success, colors.warning, colors.electricPurple, colors.error];
    const defaultColor = colors.textSecondary;
    
    if (!shopId) return defaultColor;
    
    const colorIndex = shopId.charCodeAt(0) % avatarColors.length;
    return avatarColors[colorIndex];
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
      case 'pending': return colors.warning;
      case 'confirmed': return colors.accent;
      case 'preparing': return colors.electricPurple;
      case 'ready': return colors.success;
      case 'completed': return colors.success;
      case 'cancelled': return colors.error;
      default: return colors.textSecondary;
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

  // Enhanced Side Panel with Consistent Styling
  const SidePanel = () => (
    <View style={styles.sidePanel}>
      <TouchableOpacity 
        style={styles.sidePanelClose} 
        onPress={() => setSidePanelVisible(false)}
      >
        <Ionicons name="close" size={24} color={colors.textPrimary} />
      </TouchableOpacity>
      
      <View style={styles.sidePanelHeader}>
        <Text style={styles.sidePanelTitle}>TownMart</Text>
        <Text style={styles.sidePanelSubtitle}>Discover • Connect • Shop</Text>
      </View>
      
      {[
        { name: "Home", icon: "home-outline", route: "/customer/home" },
        { name: "Search", icon: "search", route: "/customer/search" },
        { name: "Messages", icon: "chatbubble-outline", route: "/customer/messages" },
        { name: "Orders", icon: "list-outline", route: "/customer/myorders" },
        { name: "Profile", icon: "person-outline", route: "/customer/profile" },
      ].map((item, index) => (
        <TouchableOpacity 
          key={index}
          style={[styles.menuItem, item.name === "Orders" && styles.activeMenuItem]}
          onPress={() => {
            setSidePanelVisible(false);
            if (item.route) {
              router.push(item.route as any);
            }
          }}
        >
          <Ionicons name={item.icon as any} size={20} color={colors.accent} />
          <Text style={styles.menuItemText}>{item.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity 
      style={styles.orderCard}
      onPress={() => router.push(`../orders/order_details?id=${item.id}` as any)}
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
    </TouchableOpacity>
  );

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        {/* CONSISTENT Header with TownMart */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => setSidePanelVisible(true)}
            style={styles.headerButton}
          >
            <Ionicons name="menu" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>TownMart</Text>
            <Text style={styles.headerSubtitle}>My Orders</Text>
          </View>
          
          <View style={styles.headerButton} />
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
        {/* CONSISTENT Header with TownMart */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => setSidePanelVisible(true)}
            style={styles.headerButton}
          >
            <Ionicons name="menu" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>TownMart</Text>
            <Text style={styles.headerSubtitle}>My Orders</Text>
          </View>
          
          <View style={styles.headerButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Loading your orders...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* CONSISTENT Header with TownMart */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => setSidePanelVisible(true)}
          style={styles.headerButton}
        >
          <Ionicons name="menu" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>TownMart</Text>
          <Text style={styles.headerSubtitle}>My Orders</Text>
        </View>
        
        <View style={styles.headerButton} />
      </View>

      {/* Side Panel */}
      {sidePanelVisible && <SidePanel />}

      {/* Enhanced Search Bar with Consistent Styling */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={colors.accent} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders, shops, or items..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.textSecondary}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Enhanced Order Filters with Consistent Styling */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterOptions}>
          {[
            { value: "all", label: "All" },
            { value: "pending", label: "Pending" },
            { value: "confirmed", label: "Confirmed" },
            { value: "preparing", label: "Preparing" },
            { value: "ready", label: "Ready" },
            { value: "completed", label: "Completed" }
          ].map((filter) => (
            <TouchableOpacity 
              key={filter.value}
              style={[styles.filterButton, activeFilter === filter.value && styles.activeFilter]}
              onPress={() => setActiveFilter(filter.value)}
            >
              <Text style={[styles.filterText, activeFilter === filter.value && styles.activeFilterText]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
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
          <Ionicons name="receipt-outline" size={64} color={colors.textSecondary} />
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
    backgroundColor: colors.background,
  },
  // CONSISTENT Header with TownMart
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 19,
    paddingBottom: 12,
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.lightBackground,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.deepBlue,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '500',
    marginTop: 2,
  },
  searchContainer: {
    padding: 20,
    paddingBottom: 12,
    backgroundColor: colors.surface,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    padding: 0,
    fontWeight: '500',
  },
  clearButton: {
    padding: 4,
  },
  filterContainer: {
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  activeFilter: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  filterText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  activeFilterText: {
    color: colors.surface,
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
  shopName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  orderId: {
    fontSize: 12,
    color: colors.textSecondary,
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
    color: colors.textPrimary,
    marginBottom: 8,
    fontWeight: '500',
  },
  itemsList: {
    marginBottom: 8,
  },
  productText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  moreItemsText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  addressText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  paymentText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  dateText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: colors.background,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Consistent Side Panel Styles
  sidePanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '80%',
    backgroundColor: colors.surface,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 16,
  },
  sidePanelClose: {
    padding: 16,
    alignSelf: 'flex-end',
  },
  sidePanelHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  sidePanelTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  sidePanelSubtitle: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '500',
    marginTop: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingLeft: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  activeMenuItem: {
    backgroundColor: colors.lightBackground,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  menuItemText: {
    marginLeft: 16,
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
});