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

// Consistent color constants
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
  overlay: 'rgba(9, 68, 89, 0.08)',
  warning: 'rgba(255, 152, 0, 1)'
};

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

  // Customer Post Card Component
  const CustomerPostCard = ({ item }: { item: CustomerPost }) => (
    <View style={styles.customerPostCard}>
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <View style={[styles.avatar, { backgroundColor: COLORS.primary }]}>
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
          <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.textMuted} />
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
            <Ionicons name="image-outline" size={40} color={COLORS.textMuted} />
            <Text style={styles.noImageText}>No Image</Text>
          </View>
        )}

        <View style={styles.postDetails}>
          <View style={styles.detailsRow}>
            {item.price && (
              <Text style={styles.customerPostPrice}>💰 ₹{item.price}</Text>
            )}
            <View style={[styles.urgencyBadge, { 
              backgroundColor: item.urgency === 'HIGH' ? COLORS.danger : 
                              item.urgency === 'MEDIUM' ? COLORS.accent : COLORS.primary 
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
          <Text style={styles.contactButtonText}
            onPress={() => router.push('/(tabs)/chat/[id]')}>Contact Customer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Product Card Component 
  const ProductCard = ({ item }: { item: Product }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <View style={[styles.avatar, { backgroundColor: COLORS.primary }]}>
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
          <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.textMuted} />
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
            <Ionicons name="image" size={40} color={COLORS.textMuted} />
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}

        <View style={styles.postDetails}>
          <View style={styles.detailsRow}>
            <Text style={styles.productPrice}>₹{item.price}</Text>
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
          <Text style={styles.viewButtonText}
          onPress={() => router.push('/(tabs)/details/productdetails')}>View Details</Text>
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
        <Ionicons name="person" size={28} color={COLORS.secondary}/>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Shop Feed</Text>
      <TouchableOpacity style={styles.notificationButton}>
        <Ionicons name="notifications-outline" size={24} color={COLORS.secondary} />
      </TouchableOpacity>
    </View>
  );

  // Stats Section with background container
  const StatsSection = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statsBackground}>
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: COLORS.primaryLight }]}>
            <Ionicons name="cart" size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.statValue}>{stats.totalOrders}</Text>
          <Text style={styles.statLabel}>Orders</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: COLORS.dangerLight }]}>
            <Ionicons name="time" size={20} color={COLORS.danger} />
          </View>
          <Text style={styles.statValue}>{stats.pendingOrders}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: COLORS.accentLight }]}>
            <Ionicons name="cash" size={20} color={COLORS.accent} />
          </View>
          <Text style={styles.statValue}>${stats.totalRevenue}</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: COLORS.overlay }]}>
            <Ionicons name="cube" size={20} color={COLORS.secondary} />
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
          color={activeTab === "all" ? "#FFFFFF" : COLORS.secondaryLight} 
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
          color={activeTab === "need" ? "#FFFFFF" : COLORS.secondaryLight} 
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
          color={activeTab === "offer" ? "#FFFFFF" : COLORS.secondaryLight} 
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
            colors={[COLORS.primary]}
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
            <Ionicons name="document-text-outline" size={64} color={COLORS.textMuted} />
            <Text style={styles.emptyStateText}>
              {activeTab === "need" ? "No customer needs found" : "No products found"}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {activeTab === "need" ? "Customer needs will appear here" : "Products will appear here"}
            </Text>
          </View>
        }

        style={styles.postsList}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.inputBackground,
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
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
  },
  notificationButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  // Fixed Header Section
  fixedHeader: {
    marginTop: 100, // Space for main header
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
    backgroundColor: COLORS.inputBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    color: COLORS.secondary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.secondaryLight,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
    marginHorizontal: 8,
  },
  // Tab Styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.inputBackground,
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
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    color: COLORS.secondaryLight,
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
    backgroundColor: COLORS.cardBackground,
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
    backgroundColor: COLORS.cardBackground,
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
    borderLeftColor: COLORS.primary,
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
    color: COLORS.textPrimary,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  userLocation: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginRight: 8,
  },
  timeAgo: {
    fontSize: 12,
    color: COLORS.textMuted,
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
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  customerPostTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  customerPostDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
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
    backgroundColor: COLORS.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 12,
  },
  noImagePlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: COLORS.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 12,
  },
  placeholderText: {
    marginTop: 8,
    color: COLORS.textMuted,
    fontSize: 14,
  },
  noImageText: {
    marginTop: 8,
    color: COLORS.textMuted,
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
    color: COLORS.primary,
  },
  customerPostPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  productCategory: {
    fontSize: 12,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontWeight: '500',
  },
  customerPostCategory: {
    fontSize: 12,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontWeight: '500',
  },
  stockInfo: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  productType: {
    fontSize: 12,
    color: COLORS.danger,
    fontWeight: '500',
  },
  customerPostType: {
    fontSize: 12,
    color: COLORS.danger,
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
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 10,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  // Single Action Button Container
  singleActionButton: {
    padding: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
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
    backgroundColor: COLORS.accent,
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
    color: COLORS.textSecondary,
    marginTop: 16,
    fontWeight: '500',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
} as const);