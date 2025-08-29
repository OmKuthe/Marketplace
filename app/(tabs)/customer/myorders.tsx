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
  ActivityIndicator
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { ScrollView } from "react-native";

const { width } = Dimensions.get('window');

// Define types for our orders
type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
};

type Order = {
  id: string;
  shopId: string;
  shopName: string;
  shopAvatar?: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  deliveryAddress?: string;
  paymentMethod: 'cash' | 'card' | 'upi';
};

export default function myorders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidePanelVisible, setSidePanelVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Mock data - replace with actual data from your backend
  useEffect(() => {
    const mockOrders: Order[] = [
      {
        id: "ORD-001",
        shopId: "2",
        shopName: "Organic Grocery Store",
        shopAvatar: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=150&h=150&fit=crop&crop=face",
        items: [
          { id: "1", name: "Organic Apples", price: 120, quantity: 2 },
          { id: "2", name: "Fresh Spinach", price: 40, quantity: 1 },
          { id: "3", name: "Carrots", price: 30, quantity: 3 }
        ],
        totalAmount: 120 * 2 + 40 + 30 * 3,
        status: "completed",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1), // 1 day ago
        deliveryAddress: "123 Main St, Apartment 4B",
        paymentMethod: "card"
      },
      {
        id: "ORD-002",
        shopId: "3",
        shopName: "Local Bakery",
        shopAvatar: "https://images.unsplash.com/photo-1608190003443-86a6a5c6fcdc?w=150&h=150&fit=crop&crop=face",
        items: [
          { id: "4", name: "Whole Wheat Bread", price: 80, quantity: 2 },
          { id: "5", name: "Croissant", price: 50, quantity: 4 }
        ],
        totalAmount: 80 * 2 + 50 * 4,
        status: "ready",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 1), // 1 hour ago
        deliveryAddress: "123 Main St, Apartment 4B",
        paymentMethod: "upi"
      },
      {
        id: "ORD-003",
        shopId: "4",
        shopName: "Dairy Farm",
        shopAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        items: [
          { id: "6", name: "Fresh Milk", price: 60, quantity: 2 },
          { id: "7", name: "Butter", price: 90, quantity: 1 }
        ],
        totalAmount: 60 * 2 + 90,
        status: "preparing",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        deliveryAddress: "123 Main St, Apartment 4B",
        paymentMethod: "cash"
      },
      {
        id: "ORD-004",
        shopId: "5",
        shopName: "Fruit Vendor",
        shopAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
        items: [
          { id: "8", name: "Bananas", price: 40, quantity: 6 },
          { id: "9", name: "Oranges", price: 70, quantity: 8 }
        ],
        totalAmount: 40 * 6 + 70 * 8,
        status: "confirmed",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        deliveryAddress: "123 Main St, Apartment 4B",
        paymentMethod: "upi"
      },
      {
        id: "ORD-005",
        shopId: "6",
        shopName: "Vegetable Market",
        shopAvatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=150&h=150&fit=crop&crop=face",
        items: [
          { id: "10", name: "Tomatoes", price: 35, quantity: 10 },
          { id: "11", name: "Potatoes", price: 25, quantity: 5 }
        ],
        totalAmount: 35 * 10 + 25 * 5,
        status: "pending",
        createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        updatedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        deliveryAddress: "123 Main St, Apartment 4B",
        paymentMethod: "card"
      }
    ];

    setTimeout(() => {
      setOrders(mockOrders);
      setFilteredOrders(mockOrders);
      setIsLoading(false);
    }, 1000); // Simulate loading
  }, []);

  useEffect(() => {
    let filtered = orders;
    
    // Apply status filter
    if (activeFilter !== "all") {
      filtered = filtered.filter(order => order.status === activeFilter);
    }
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(order =>
        order.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredOrders(filtered);
  }, [activeFilter, searchQuery, orders]);

  const getStatusColor = (status: Order['status']) => {
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

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'confirmed': return 'Confirmed';
      case 'preparing': return 'Preparing';
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
      onPress={() => router.push(`/customer/myorders/${item.id}`as any)}
    >
      <View style={styles.orderHeader}>
        <View style={styles.shopInfo}>
          <Image 
            source={{ uri: item.shopAvatar || 'https://via.placeholder.com/150' }} 
            style={styles.shopAvatar}
          />
          <View>
            <Text style={styles.shopName}>{item.shopName}</Text>
            <Text style={styles.orderId}>Order #{item.id}</Text>
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
        <Text style={styles.dateText}>
          Ordered on {formatDate(item.createdAt)}
        </Text>
      </View>

      <View style={styles.orderActions}>
        {item.status === 'ready' && (
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Pick Up</Text>
          </TouchableOpacity>
        )}
        {item.status === 'preparing' && (
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
            placeholder="Search orders or shops..."
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
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
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