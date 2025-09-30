import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { collection, getDocs, orderBy, query, doc, getDoc, where } from "firebase/firestore";
import React, { useEffect, useState , useCallback} from "react";
import {
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  RefreshControl,
  View
} from "react-native";
import { db } from "../../../firebaseConfig";

const { width } = Dimensions.get('window');

// Add these types with your existing types
type PostType = 'NEED' | 'OFFER';
type PostStatus = 'ACTIVE' | 'FULFILLED' | 'EXPIRED';
type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH';

interface CustomerPost {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  title: string;
  description: string;
  price?: number;
  category: string;
  type: PostType;
  imageUrl?: string;
  location: string;
  status: PostStatus;
  createdAt: any;
  updatedAt: any;
  tags: string[];
  contactInfo: {
    phone?: string;
    email: string;
    preferredContact: 'phone' | 'email' | 'message';
  };
  urgency: UrgencyLevel;
}

type ShopkeeperData = {
  uid: string;
  email: string;
  shopName: string;
  ownerName: string;
  location: string;
  phone: string;
  createdAt: any;
};

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  type: string;
  imageUrl?: string;
  createdAt?: any;
  shopkeeperId?: string;
  shopId?: string;
  shopkeeper?: string;
};

export default function ShopkeeperHome() {
  const [posts, setPosts] = useState<Product[]>([]);
  const [customerPosts, setCustomerPosts] = useState<CustomerPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Product[]>([]);
  const [filteredCustomerPosts, setFilteredCustomerPosts] = useState<CustomerPost[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [sidePanelVisible, setSidePanelVisible] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0
  });
  const [shopkeeperData, setShopkeeperData] = useState<{[key: string]: ShopkeeperData}>({});
  const [refreshing, setRefreshing] = useState(false);

  const router = useRouter();
  
  
  // Function to fetch customer posts
  const fetchCustomerPosts = async () => {
    try {
      console.log('🔍 Fetching customer posts for shopkeeper...');
      const q = query(
        collection(db, "customerPosts"), 
        where('type', '==', 'NEED'),
        where('status', '==', 'ACTIVE'),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      console.log('✅ Customer posts found:', snapshot.size);

      const posts: CustomerPost[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        posts.push({
          id: doc.id,
          customerId: data.customerId || '',
          customerName: data.customerName || 'Anonymous Customer',
          customerEmail: data.customerEmail || '',
          title: data.title || '',
          description: data.description || '',
          price: data.price,
          category: data.category || 'General',
          type: data.type || 'NEED',
          imageUrl: data.imageUrl,
          location: data.location || 'Unknown Location',
          status: data.status || 'ACTIVE',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          tags: data.tags || [],
          contactInfo: data.contactInfo || { email: data.customerEmail || '', preferredContact: 'message' },
          urgency: data.urgency || 'MEDIUM'
        } as CustomerPost);
      });

      setCustomerPosts(posts);
      setFilteredCustomerPosts(posts);
    } catch (error) {
      console.error('❌ Error fetching customer posts:', error);
    }
  };

  const fetchProductsAndShopkeepers = async () => {
    try {
      // Fetch products
      const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];
      
      setPosts(data);
      setFilteredPosts(data);
      
      const shopkeeperMap: {[key: string]: ShopkeeperData} = {};
      const shopkeeperIds = new Set<string>();
      for (const product of data) {
        const shopkeeperId = product.shopkeeperId || product.shopId || product.shopkeeper;
        if (shopkeeperId) {
          shopkeeperIds.add(shopkeeperId);
        }
      }

      // Fetch all shopkeeper data
      for (const shopkeeperId of Array.from(shopkeeperIds)) {
        try {
          const shopkeeperDoc = await getDoc(doc(db, "shopkeepers", shopkeeperId));
          if (shopkeeperDoc.exists()) {
            shopkeeperMap[shopkeeperId] = shopkeeperDoc.data() as ShopkeeperData;
          }
        } catch (error) {
          console.error("Error fetching shopkeeper:", error);
        }
      }
      
      setShopkeeperData(shopkeeperMap);
    } catch (err) {
      console.log("Error fetching products:", err);
    }
  };

  useEffect(() => {


    fetchProductsAndShopkeepers();
    fetchCustomerPosts(); // Fetch customer posts when component mounts
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (activeTab === "need") {
        await fetchCustomerPosts();
      } else {
        await fetchProductsAndShopkeepers();
      }
    } catch (error) {
      console.error('Error during refresh:', error);
    } finally {
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "all") {
      setFilteredPosts(posts);
      setFilteredCustomerPosts([]);
    } else if (activeTab === "need") {
      setFilteredPosts([]);
      setFilteredCustomerPosts(customerPosts);
    } else if (activeTab === "offer") {
      setFilteredPosts(posts.filter(post => post.type === 'OFFER'));
      setFilteredCustomerPosts([]);
    }
  }, [activeTab, posts, customerPosts]);

  // Function to get shopkeeper name for a product
  const getShopkeeperName = (product: Product) => {
    const shopkeeperId = product.shopkeeperId || product.shopId || product.shopkeeper;
    if (shopkeeperId && shopkeeperData[shopkeeperId]) {
      return shopkeeperData[shopkeeperId].shopName || shopkeeperData[shopkeeperId].ownerName || "Unknown Shop";
    }
    return "Unknown Shop";
  };

  // Function to get shopkeeper location for a product
  const getShopkeeperLocation = (product: Product) => {
    const shopkeeperId = product.shopkeeperId || product.shopId || product.shopkeeper;
    if (shopkeeperId && shopkeeperData[shopkeeperId]) {
      return shopkeeperData[shopkeeperId].location || "Unknown Location";
    }
    return "Unknown Location";
  };

// Customer Post Card Component with Image Support
const CustomerPostCard = ({ item }: { item: CustomerPost }) => (
  <View style={styles.customerPostCard}>
    {/* Customer Info Header */}
    <View style={styles.cardHeader}>
      <View style={styles.userInfo}>
        <View style={[styles.avatar, { backgroundColor: '#FF6B35' }]}>
          <Ionicons name="person" size={16} color="white" />
        </View>
        <View>
          <Text style={styles.username}>{item.customerName}</Text>
          <Text style={styles.userLocation}>📍 {item.location}</Text>
        </View>
      </View>
      <View style={[styles.urgencyBadge, { 
        backgroundColor: item.urgency === 'HIGH' ? '#FF6B6B' : 
                        item.urgency === 'MEDIUM' ? '#FFD93D' : '#6BCF7F' 
      }]}>
        <Text style={styles.urgencyText}>{item.urgency}</Text>
      </View>
    </View>

    {/* Post Image */}
    {item.imageUrl ? (
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.customerPostImage}
        resizeMode="cover"
      />
    ) : (
      <View style={styles.noImagePlaceholder}>
        <Ionicons name="image-outline" size={40} color="#ccc" />
        <Text style={styles.noImageText}>No Image</Text>
      </View>
    )}

    {/* Post Content */}
    <View style={styles.customerPostContent}>
      <Text style={styles.customerPostTitle}>{item.title}</Text>
      <Text style={styles.customerPostDescription}>{item.description}</Text>
      
      <View style={styles.detailsRow}>
        {item.price && (
          <Text style={styles.customerPostPrice}>💰 ₹{item.price}</Text>
        )}
        <Text style={styles.customerPostCategory}>#{item.category}</Text>
      </View>
      
      <View style={styles.detailsRow}>
        <Text style={styles.customerPostType}>Looking for: {item.type}</Text>
        <Text style={styles.postDate}>
          {item.createdAt ? 
            new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 
            'Recent'
          }
        </Text>
      </View>

      {/* Tags */}
      {item.tags && item.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {item.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Contact Button */}
      <TouchableOpacity style={styles.contactButton}>
        <Ionicons name="chatbubble-ellipses" size={16} color="#2874F0" />
        <Text style={styles.contactButtonText}>Contact Customer</Text>
      </TouchableOpacity>
    </View>
  </View>
);

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
        <Ionicons name="home" size={20} color="#2874F0" />
        <Text style={styles.menuItemText}>Dashboard</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => {
          setSidePanelVisible(false);
          router.push("/shopkeeper/products");
        }}
      >
        <Ionicons name="cube" size={20} color="#2874F0" />
        <Text style={styles.menuItemText}>Products</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => {
          setSidePanelVisible(false);
          router.push("/shopkeeper/myorders");
        }}
      >
        <Ionicons name="list" size={20} color="#2874F0" />
        <Text style={styles.menuItemText}>Orders</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => {
          setSidePanelVisible(false);
          router.push("/shopkeeper/analytics");
        }}
      >
        <Ionicons name="stats-chart" size={20} color="#2874F0" />
        <Text style={styles.menuItemText}>Analytics</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => {
          setSidePanelVisible(false);
          router.push("/shopkeeper/profile");
        }}
      >
        <Ionicons name="person" size={20} color="#2874F0" />
        <Text style={styles.menuItemText}>Shop Profile</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with menu button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSidePanelVisible(true)}>
          <Ionicons name="menu" size={28} color="#172337" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🏪 Shop Dashboard</Text>
        <View style={{ width: 28 }} /> {/* Spacer for balance */}
      </View>

      {/* Side Panel */}
      {sidePanelVisible && <SidePanel />}

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalOrders}</Text>
          <Text style={styles.statLabel}>Total Orders</Text>
        </View>
        <View style={[styles.statCard, styles.statCardHighlight]}>
          <Text style={[styles.statValue, styles.statValueHighlight]}>{stats.pendingOrders}</Text>
          <Text style={[styles.statLabel, styles.statLabelHighlight]}>Pending Orders</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>${stats.totalRevenue}</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
      </View>

      {/* Post Type Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "all" && styles.activeTab]}
          onPress={() => setActiveTab("all")}
        >
          <Text style={[styles.tabText, activeTab === "all" && styles.activeTabText]}>All Posts</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "need" && styles.activeTab]}
          onPress={() => setActiveTab("need")}
        >
          <Text style={[styles.tabText, activeTab === "need" && styles.activeTabText]}>Customer Needs</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "offer" && styles.activeTab]}
          onPress={() => setActiveTab("offer")}
        >
          <Text style={[styles.tabText, activeTab === "offer" && styles.activeTabText]}>Offers</Text>
        </TouchableOpacity>
      </View>

{/* Posts List */}
{activeTab === "need" ? (
  // Customer Posts List with Refresh
  <FlatList
    data={filteredCustomerPosts}
    keyExtractor={(item) => item.id}
    renderItem={({ item }) => (
      <CustomerPostCard item={item} />
    )}
    contentContainerStyle={styles.listContent}
    refreshControl={
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        colors={['#2874F0']}
      />
    }
    ListEmptyComponent={
      <View style={styles.emptyState}>
        <Ionicons name="document-text-outline" size={64} color="#ccc" />
        <Text style={styles.emptyStateText}>No customer needs found</Text>
        <Text style={styles.emptyStateSubtext}>Customer needs will appear here</Text>
      </View>
    }
  />
) : (
  // Products List
  <FlatList
    data={filteredPosts}
    keyExtractor={(item) => item.id}
    renderItem={({ item }) => (
      <View style={styles.card}>
        {/* User Info Header */}
        <View style={styles.cardHeader}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}></View>
            <View>
              <Text style={styles.username}>
                {getShopkeeperName(item)}
              </Text>
              <Text style={styles.userLocation}>
                {getShopkeeperLocation(item)}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Product Image */}
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image" size={40} color="#ccc" />
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}

        {/* Product Details */}
        <View style={styles.cardContent}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productDescription}>{item.description}</Text>
          
          <View style={styles.detailsRow}>
            <Text style={styles.productPrice}>${item.price}</Text>
            <Text style={styles.productCategory}>#{item.category || 'General'}</Text>
          </View>
          
          <View style={styles.detailsRow}>
            <Text style={styles.stockInfo}>{item.stock || 0} in stock</Text>
            <Text style={styles.postDate}>
              {item.createdAt ? 
                new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 
                'Unknown date'
              }
            </Text>
          </View>
        </View>
      </View>
    )}
    contentContainerStyle={styles.listContent}
    refreshControl={
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        colors={['#2874F0']}
      />
    }
    ListEmptyComponent={
      <View style={styles.emptyState}>
        <Ionicons name="document-text-outline" size={64} color="#ccc" />
        <Text style={styles.emptyStateText}>No products found</Text>
      </View>
    }
  />
)}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 3
  },
  // Header Styles - Modern Marketplace Design
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: 'center',
    flex: 1,
    color: '#172337',
  },
  // Side Panel Styles
  sidePanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width * 0.8,
    height: '100%',
    backgroundColor: '#FFFFFF',
    zIndex: 100,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  sidePanelClose: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  sidePanelHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 15,
    marginBottom: 20,
  },
  sidePanelTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#172337',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 15,
    color: '#212121',
  },
  // Stats Container - Modern Card Design
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  statCardHighlight: {
    backgroundColor: '#2874F0',
    shadowColor: "#2874F0",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
  },
  statValueHighlight: {
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  statLabelHighlight: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  // Tab Styles - Modern Marketplace Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  activeTab: {
    backgroundColor: '#2874F0',
  },
  tabText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // List Content
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  // Product Card - Modern Marketplace Design
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  userLocation: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  moreButton: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  productImage: {
    width: '100%',
    height: 200,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 8,
    color: '#999999',
    fontSize: 14,
  },
  cardContent: {
    padding: 16,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 6,
  },
  productDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
    lineHeight: 20,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2874F0',
  },
  productCategory: {
    fontSize: 12,
    color: '#666666',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontWeight: '500',
  },
  stockInfo: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  postDate: {
    fontSize: 12,
    color: '#999999',
  },
  // Customer Post Card Styles
  customerPostCard: {
    backgroundColor: '#FFF8F5',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
  },
  customerPostContent: {
    padding: 16,
  },
  customerPostTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8,
  },
  customerPostDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
    lineHeight: 20,
  },
  customerPostPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2874F0',
  },
  customerPostCategory: {
    fontSize: 12,
    color: '#666666',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontWeight: '500',
  },
  customerPostType: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '500',
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F7FF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    justifyContent: 'center',
  },
  contactButtonText: {
    color: '#2874F0',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  customerPostImage: {
    width: '100%',
    height: 200,
  },
  noImagePlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  noImageText: {
    marginTop: 8,
    color: '#999',
    fontSize: 14,
  },

  // Tags Styles
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 10,
    color: '#1976D2',
    fontWeight: '500',
  },

  // Empty State Improvements
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },

  // Avatar with icon
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2874F0',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#2874F0",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
} as const);