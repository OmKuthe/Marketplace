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
  View,
  Animated
} from "react-native";
import { db } from "../../../firebaseConfig";

const { width, height } = Dimensions.get('window');

// Types remain the same...
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

// Union type for all post types
type FeedItem = 
  | { id: string; type: 'customerPost'; data: CustomerPost }
  | { id: string; type: 'product'; data: Product };

export default function ShopkeeperHome() {
  const [posts, setPosts] = useState<Product[]>([]);
  const [customerPosts, setCustomerPosts] = useState<CustomerPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Product[]>([]);
  const [filteredCustomerPosts, setFilteredCustomerPosts] = useState<CustomerPost[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [stats, setStats] = useState({
    totalOrders: 24,
    pendingOrders: 8,
    totalRevenue: 2840,
    totalProducts: 45
  });
  const [shopkeeperData, setShopkeeperData] = useState<{[key: string]: ShopkeeperData}>({});
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = new Animated.Value(0);

  const router = useRouter();

  // Fetch functions remain the same...
  const fetchCustomerPosts = async () => {
    try {
      const q = query(
        collection(db, "customerPosts"), 
        where('type', '==', 'NEED'),
        where('status', '==', 'ACTIVE'),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
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
      console.error('Error fetching customer posts:', error);
    }
  };

  const fetchProductsAndShopkeepers = async () => {
    try {
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
    fetchCustomerPosts();
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

  const getShopkeeperName = (product: Product) => {
    const shopkeeperId = product.shopkeeperId || product.shopId || product.shopkeeper;
    if (shopkeeperId && shopkeeperData[shopkeeperId]) {
      return shopkeeperData[shopkeeperId].shopName || shopkeeperData[shopkeeperId].ownerName || "Unknown Shop";
    }
    return "Unknown Shop";
  };

  const getShopkeeperLocation = (product: Product) => {
    const shopkeeperId = product.shopkeeperId || product.shopId || product.shopkeeper;
    if (shopkeeperId && shopkeeperData[shopkeeperId]) {
      return shopkeeperData[shopkeeperId].location || "Unknown Location";
    }
    return "Unknown Location";
  };

  // Helper function to get time ago
  const getTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  // Customer Post Card Component - Removed social media buttons
  const CustomerPostCard = ({ item }: { item: CustomerPost }) => (
    <View style={styles.customerPostCard}>
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <View style={[styles.avatar, { backgroundColor: 'rgba(15, 177, 234, 1)' }]}>
            <Ionicons name="person" size={16} color="white" />
          </View>
          <View style={styles.userInfoText}>
            <Text style={styles.username}>{item.customerName}</Text>
            <View style={styles.metaInfo}>
              <Text style={styles.userLocation}>📍 {item.location}</Text>
              <Text style={styles.timeAgo}>
                {item.createdAt ? 
                  getTimeAgo(item.createdAt.seconds * 1000) : 
                  'Recently'
                }
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.postContent}>
        <Text style={styles.customerPostTitle}>{item.title}</Text>
        <Text style={styles.customerPostDescription}>{item.description}</Text>
        
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

        <View style={styles.postDetails}>
          <View style={styles.detailsRow}>
            {item.price && (
              <Text style={styles.customerPostPrice}>💰 ₹{item.price}</Text>
            )}
            <View style={[styles.urgencyBadge, { 
              backgroundColor: item.urgency === 'HIGH' ? 'rgba(255, 49, 49, 1)' : 
                              item.urgency === 'MEDIUM' ? 'rgba(247, 206, 38, 1)' : 'rgba(15, 177, 234, 1)' 
            }]}>
              <Text style={styles.urgencyText}>{item.urgency} URGENCY</Text>
            </View>
          </View>
          
          <View style={styles.detailsRow}>
            <Text style={styles.customerPostCategory}>#{item.category}</Text>
            <Text style={styles.customerPostType}>Looking for: {item.type}</Text>
          </View>

          {item.tags && item.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {item.tags.slice(0, 3).map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Single Contact Button */}
      <View style={styles.singleActionButton}>
        <TouchableOpacity style={styles.contactButton}>
          <Ionicons name="chatbubble-ellipses" size={16} color="white" />
          <Text style={styles.contactButtonText}>Contact Customer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Product Card Component - Removed social media buttons
  const ProductCard = ({ item }: { item: Product }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <View style={[styles.avatar, { backgroundColor: 'rgba(15, 177, 234, 1)' }]}>
            <Ionicons name="business" size={16} color="white" />
          </View>
          <View style={styles.userInfoText}>
            <Text style={styles.username}>{getShopkeeperName(item)}</Text>
            <View style={styles.metaInfo}>
              <Text style={styles.userLocation}>📍 {getShopkeeperLocation(item)}</Text>
              <Text style={styles.timeAgo}>
                {item.createdAt ? 
                  getTimeAgo(item.createdAt.seconds * 1000) : 
                  'Recently'
                }
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.postContent}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productDescription}>{item.description}</Text>
        
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

        <View style={styles.postDetails}>
          <View style={styles.detailsRow}>
            <Text style={styles.productPrice}>${item.price}</Text>
            <Text style={styles.stockInfo}>{item.stock || 0} in stock</Text>
          </View>
          
          <View style={styles.detailsRow}>
            <Text style={styles.productCategory}>#{item.category || 'General'}</Text>
            <Text style={styles.productType}>{item.type || 'Product'}</Text>
          </View>
        </View>
      </View>

      {/* Single Action Button for Products */}
      <View style={styles.singleActionButton}>
        <TouchableOpacity style={styles.viewButton}>
          <Ionicons name="eye" size={16} color="white" />
          <Text style={styles.viewButtonText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Animated header background
  const headerBackgroundOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // Header Component
  const Header = () => (
    <View style={styles.header}>
      <Animated.View style={[styles.headerBackground, { opacity: headerBackgroundOpacity }]} />
      <TouchableOpacity 
        style={styles.menuButton}
        onPress={() => router.push('/shopkeeper/profile')}
      >
        <Ionicons name="person" size={28} color="rgba(9, 68, 89, 1)" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>🏪 Shop Feed</Text>
      <TouchableOpacity style={styles.notificationButton}>
        <Ionicons name="notifications-outline" size={24} color="rgba(9, 68, 89, 1)" />
      </TouchableOpacity>
    </View>
  );

  // Stats Section with background container
  const StatsSection = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statsBackground}>
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(15, 177, 234, 0.1)' }]}>
            <Ionicons name="cart" size={20} color="rgba(15, 177, 234, 1)" />
          </View>
          <Text style={styles.statValue}>{stats.totalOrders}</Text>
          <Text style={styles.statLabel}>Orders</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(255, 49, 49, 0.1)' }]}>
            <Ionicons name="time" size={20} color="rgba(255, 49, 49, 1)" />
          </View>
          <Text style={styles.statValue}>{stats.pendingOrders}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(247, 206, 38, 0.1)' }]}>
            <Ionicons name="cash" size={20} color="rgba(247, 206, 38, 1)" />
          </View>
          <Text style={styles.statValue}>${stats.totalRevenue}</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(9, 68, 89, 0.1)' }]}>
            <Ionicons name="cube" size={20} color="rgba(9, 68, 89, 1)" />
          </View>
          <Text style={styles.statValue}>{stats.totalProducts}</Text>
          <Text style={styles.statLabel}>Products</Text>
        </View>
      </View>
    </View>
  );

  // Tabs Section - Static (won't scroll)
  const TabsSection = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity 
        style={[styles.tab, activeTab === "all" && styles.activeTab]}
        onPress={() => setActiveTab("all")}
      >
        <Ionicons 
          name="grid" 
          size={16} 
          color={activeTab === "all" ? "#FFFFFF" : "rgba(9, 68, 89, 0.7)"} 
        />
        <Text style={[styles.tabText, activeTab === "all" && styles.activeTabText]}>All</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.tab, activeTab === "need" && styles.activeTab]}
        onPress={() => setActiveTab("need")}
      >
        <Ionicons 
          name="people" 
          size={16} 
          color={activeTab === "need" ? "#FFFFFF" : "rgba(9, 68, 89, 0.7)"} 
        />
        <Text style={[styles.tabText, activeTab === "need" && styles.activeTabText]}>Needs</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.tab, activeTab === "offer" && styles.activeTab]}
        onPress={() => setActiveTab("offer")}
      >
        <Ionicons 
          name="storefront" 
          size={16} 
          color={activeTab === "offer" ? "#FFFFFF" : "rgba(9, 68, 89, 0.7)"} 
        />
        <Text style={[styles.tabText, activeTab === "offer" && styles.activeTabText]}>My Offers</Text>
      </TouchableOpacity>
    </View>
  );

  // Fixed Header Section (Stats + Tabs)
  const FixedHeaderSection = () => (
    <View style={styles.fixedHeader}>
      <StatsSection />
      <TabsSection />
    </View>
  );

  // Prepare data for the main FlatList (only posts, no header)
  const getListData = (): FeedItem[] => {
    if (activeTab === "need") {
      return filteredCustomerPosts.map(post => ({
        id: post.id,
        type: 'customerPost' as const,
        data: post
      }));
    } else {
      return filteredPosts.map(product => ({
        id: product.id,
        type: 'product' as const,
        data: product
      }));
    }
  };

  // Render item function that properly handles both types
  const renderItem = ({ item }: { item: FeedItem }) => {
    if (item.type === 'customerPost') {
      return <CustomerPostCard item={item.data} />;
    } else if (item.type === 'product') {
      return <ProductCard item={item.data} />;
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Main Header - Fixed at top */}
      <Header />

      {/* Fixed Header Section (Stats + Tabs) */}
      <FixedHeaderSection />

      {/* Main Content with FlatList for posts only */}
      <FlatList
        data={getListData()}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['rgba(15, 177, 234, 1)']}
          />
        }
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>
              {activeTab === "need" ? "No customer needs found" : "No products found"}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {activeTab === "need" ? "Customer needs will appear here" : "Products will appear here"}
            </Text>
          </View>
        }
        // Add margin top to account for fixed header
        style={styles.postsList}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: 50,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  menuButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  notificationButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: 'rgba(9, 68, 89, 1)',
  },
  // Fixed Header Section
  fixedHeader: {
    marginTop: 100, // Space for main header
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    paddingBottom: 8,
  },
  // Stats Section with Background Container
  statsContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  statsBackground: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 249, 250, 1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'rgba(9, 68, 89, 1)',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(9, 68, 89, 0.7)',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E5E5',
    marginHorizontal: 8,
  },
  // Tab Styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  activeTab: {
    backgroundColor: 'rgba(15, 177, 234, 1)',
  },
  tabText: {
    fontSize: 14,
    color: 'rgba(9, 68, 89, 0.7)',
    fontWeight: '500',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Posts List
  postsList: {
    flex: 1,
    marginTop: 0,
  },
  listContent: {
    paddingBottom: 20,
    paddingTop: 8,
  },
  // Card Styles
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  customerPostCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
    borderLeftWidth: 4,
    borderLeftColor: 'rgba(15, 177, 234, 1)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userInfoText: {
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(9, 68, 89, 1)',
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  userLocation: {
    fontSize: 12,
    color: 'rgba(9, 68, 89, 0.7)',
    marginRight: 8,
  },
  timeAgo: {
    fontSize: 12,
    color: '#999',
  },
  moreButton: {
    padding: 4,
  },
  // Post Content
  postContent: {
    paddingHorizontal: 16,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'rgba(9, 68, 89, 1)',
    marginBottom: 8,
  },
  customerPostTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'rgba(9, 68, 89, 1)',
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 14,
    color: 'rgba(9, 68, 89, 0.7)',
    marginBottom: 12,
    lineHeight: 20,
  },
  customerPostDescription: {
    fontSize: 14,
    color: 'rgba(9, 68, 89, 0.7)',
    marginBottom: 12,
    lineHeight: 20,
  },
  productImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  customerPostImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  imagePlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 12,
  },
  noImagePlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 12,
  },
  placeholderText: {
    marginTop: 8,
    color: '#999',
    fontSize: 14,
  },
  noImageText: {
    marginTop: 8,
    color: '#999',
    fontSize: 14,
  },
  // Post Details
  postDetails: {
    marginBottom: 12,
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
    color: 'rgba(15, 177, 234, 1)',
  },
  customerPostPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'rgba(15, 177, 234, 1)',
  },
  productCategory: {
    fontSize: 12,
    color: 'rgba(9, 68, 89, 0.7)',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontWeight: '500',
  },
  customerPostCategory: {
    fontSize: 12,
    color: 'rgba(9, 68, 89, 0.7)',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontWeight: '500',
  },
  stockInfo: {
    fontSize: 12,
    color: 'rgba(9, 68, 89, 0.7)',
    fontWeight: '500',
  },
  productType: {
    fontSize: 12,
    color: 'rgba(255, 49, 49, 1)',
    fontWeight: '500',
  },
  customerPostType: {
    fontSize: 12,
    color: 'rgba(255, 49, 49, 1)',
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
  // Tags
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    backgroundColor: 'rgba(247, 206, 38, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 10,
    color: 'rgba(9, 68, 89, 0.8)',
    fontWeight: '500',
  },
  // Single Action Button Container
  singleActionButton: {
    padding: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 177, 234, 1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
  },
  contactButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(247, 206, 38, 1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
  },
  viewButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    marginHorizontal: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: 'rgba(9, 68, 89, 0.7)',
    marginTop: 16,
    fontWeight: '500',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
} as const);