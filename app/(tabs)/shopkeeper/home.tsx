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

export default function ShopkeeperHome() {
  const [posts, setPosts] = useState<Product[]>([]);
  const [customerPosts, setCustomerPosts] = useState<CustomerPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Product[]>([]);
  const [filteredCustomerPosts, setFilteredCustomerPosts] = useState<CustomerPost[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [sidePanelVisible, setSidePanelVisible] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 24,
    pendingOrders: 8,
    totalRevenue: 2840,
    totalProducts: 45
  });
  const [shopkeeperData, setShopkeeperData] = useState<{[key: string]: ShopkeeperData}>({});
  const [refreshing, setRefreshing] = useState(false);

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

  // Customer Post Card Component
  const CustomerPostCard = ({ item }: { item: CustomerPost }) => (
    <View style={styles.customerPostCard}>
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <View style={[styles.avatar, { backgroundColor: 'rgba(15, 177, 234, 1)' }]}>
            <Ionicons name="person" size={16} color="white" />
          </View>
          <View>
            <Text style={styles.username}>{item.customerName}</Text>
            <Text style={styles.userLocation}>📍 {item.location}</Text>
          </View>
        </View>
        <View style={[styles.urgencyBadge, { 
          backgroundColor: item.urgency === 'HIGH' ? 'rgba(255, 49, 49, 1)' : 
                          item.urgency === 'MEDIUM' ? 'rgba(247, 206, 38, 1)' : 'rgba(15, 177, 234, 1)' 
        }]}>
          <Text style={styles.urgencyText}>{item.urgency}</Text>
        </View>
      </View>

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

        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {item.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.contactButton}>
          <Ionicons name="chatbubble-ellipses" size={16} color="white" />
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
        <Ionicons name="close" size={24} color="rgba(9, 68, 89, 1)" />
      </TouchableOpacity>
      
      <View style={styles.sidePanelHeader}>
        <View style={[styles.avatar, { backgroundColor: 'rgba(15, 177, 234, 1)', marginBottom: 15 }]}>
          <Ionicons name="business" size={24} color="white" />
        </View>
        <Text style={styles.sidePanelTitle}>My Shop</Text>
        <Text style={styles.sidePanelSubtitle}>Manage your business</Text>
      </View>
      
      {[
        { icon: "home", name: "Dashboard", route: "/shopkeeper/home" },
        { icon: "cube", name: "Products", route: "/shopkeeper/products" },
        { icon: "list", name: "Orders", route: "/shopkeeper/myorders" },
        { icon: "stats-chart", name: "Analytics", route: "/shopkeeper/analytics" },
        { icon: "person", name: "Shop Profile", route: "/shopkeeper/profile" }
      ].map((item, index) => (
        <TouchableOpacity 
          key={index}
          style={styles.menuItem}
          onPress={() => {
            setSidePanelVisible(false);
            router.push(item.route as any);
          }}
        >
          <Ionicons name={item.icon as any} size={20} color="rgba(15, 177, 234, 1)" />
          <Text style={styles.menuItemText}>{item.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const ProductCard = ({ item }: { item: Product }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <View style={[styles.avatar, { backgroundColor: 'rgba(15, 177, 234, 1)' }]}>
            <Ionicons name="business" size={16} color="white" />
          </View>
          <View>
            <Text style={styles.username}>{getShopkeeperName(item)}</Text>
            <Text style={styles.userLocation}>📍 {getShopkeeperLocation(item)}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
        </TouchableOpacity>
      </View>

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
  );

  // Header Component
  const Header = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.menuButton}
        onPress={() => setSidePanelVisible(true)}
      >
        <Ionicons name="menu" size={28} color="rgba(9, 68, 89, 1)" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>🏪 Shop Dashboard</Text>
      <TouchableOpacity style={styles.notificationButton}>
        <Ionicons name="notifications-outline" size={24} color="rgba(9, 68, 89, 1)" />
      </TouchableOpacity>
    </View>
  );

  // Stats Section Component
  const StatsSection = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statRow}>
        <View style={[styles.statCard, { backgroundColor: 'rgba(15, 177, 234, 0.1)' }]}>
          <Ionicons name="cart" size={24} color="rgba(15, 177, 234, 1)" />
          <Text style={styles.statValue}>{stats.totalOrders}</Text>
          <Text style={styles.statLabel}>Total Orders</Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: 'rgba(255, 49, 49, 0.1)' }]}>
          <Ionicons name="time" size={24} color="rgba(255, 49, 49, 1)" />
          <Text style={styles.statValue}>{stats.pendingOrders}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>
      
      <View style={styles.statRow}>
        <View style={[styles.statCard, { backgroundColor: 'rgba(247, 206, 38, 0.1)' }]}>
          <Ionicons name="cash" size={24} color="rgba(247, 206, 38, 1)" />
          <Text style={styles.statValue}>${stats.totalRevenue}</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: 'rgba(9, 68, 89, 0.1)' }]}>
          <Ionicons name="cube" size={24} color="rgba(9, 68, 89, 1)" />
          <Text style={styles.statValue}>{stats.totalProducts}</Text>
          <Text style={styles.statLabel}>Products</Text>
        </View>
      </View>
    </View>
  );

  // Quick Actions Component
  const QuickActionsSection = () => (
    <View style={styles.quickActions}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionButton}>
          <View style={[styles.actionIcon, { backgroundColor: 'rgba(15, 177, 234, 0.1)' }]}>
            <Ionicons name="add-circle" size={24} color="rgba(15, 177, 234, 1)" />
          </View>
          <Text style={styles.actionText}>Add Product</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <View style={[styles.actionIcon, { backgroundColor: 'rgba(247, 206, 38, 0.1)' }]}>
            <Ionicons name="pricetag" size={24} color="rgba(247, 206, 38, 1)" />
          </View>
          <Text style={styles.actionText}>Manage Offers</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <View style={[styles.actionIcon, { backgroundColor: 'rgba(255, 49, 49, 0.1)' }]}>
            <Ionicons name="analytics" size={24} color="rgba(255, 49, 49, 1)" />
          </View>
          <Text style={styles.actionText}>View Stats</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Tabs Component
  const TabsSection = () => (
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
        <Text style={[styles.tabText, activeTab === "offer" && styles.activeTabText]}>My Offers</Text>
      </TouchableOpacity>
    </View>
  );

  // List Header Component (contains stats, actions, and tabs)
  const ListHeader = () => (
    <View style={styles.listHeader}>
      <StatsSection />
      <QuickActionsSection />
      <TabsSection />
    </View>
  );

  // Render item for the main FlatList
  const renderItem = ({ item }: { item: any }) => {
    if (item.type === 'customerPost') {
      return <CustomerPostCard item={item.data} />;
    } else if (item.type === 'product') {
      return <ProductCard item={item.data} />;
    }
    return null;
  };

  // Prepare data for the main FlatList
  const getListData = () => {
    const headerItem = { id: 'header', type: 'header' };
    
    if (activeTab === "need") {
      const customerPostItems = filteredCustomerPosts.map(post => ({
        id: post.id,
        type: 'customerPost',
        data: post
      }));
      return [headerItem, ...customerPostItems];
    } else {
      const productItems = filteredPosts.map(product => ({
        id: product.id,
        type: 'product',
        data: product
      }));
      return [headerItem, ...productItems];
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header - Fixed at top */}
      <Header />

      {sidePanelVisible && <SidePanel />}

      {/* Main Content with Single FlatList */}
      <FlatList
        data={getListData()}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return <ListHeader />;
          } else if (item.type === 'customerPost') {
            return <CustomerPostCard item={item.data} />;
          } else if (item.type === 'product') {
            return <ProductCard item={item.data} />;
          }
          return null;
        }}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['rgba(15, 177, 234, 1)']}
          />
        }
        showsVerticalScrollIndicator={false}
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
        stickyHeaderIndices={[0]} // Make header sticky
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  menuButton: {
    padding: 8,
    borderRadius: 10,
  },
  notificationButton: {
    padding: 8,
    borderRadius: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: 'center',
    flex: 1,
    color: 'rgba(9, 68, 89, 1)',
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
    shadowOffset: { width: 2, height: 0 },
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
    borderBottomColor: '#E5E5E5',
    paddingBottom: 20,
    marginBottom: 10,
    alignItems: 'center',
  },
  sidePanelTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'rgba(9, 68, 89, 1)',
    marginBottom: 5,
  },
  sidePanelSubtitle: {
    fontSize: 14,
    color: 'rgba(9, 68, 89, 0.7)',
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
    color: 'rgba(9, 68, 89, 1)',
    fontWeight: '500',
  },
  // List Header (contains stats, actions, tabs)
  listHeader: {
    backgroundColor: '#FFFFFF',
  },
  // Fixed Stats Container
  statsContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'rgba(9, 68, 89, 1)',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(9, 68, 89, 0.7)',
    marginTop: 4,
    fontWeight: '500',
  },
  // Quick Actions
  quickActions: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'rgba(9, 68, 89, 1)',
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 6,
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: 'rgba(9, 68, 89, 1)',
    fontWeight: '500',
    textAlign: 'center',
  },
  // Tab Styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  activeTab: {
    backgroundColor: 'rgba(15, 177, 234, 1)',
  },
  tabText: {
    fontSize: 14,
    color: 'rgba(9, 68, 89, 0.7)',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // List Content with proper spacing
  listContent: {
    paddingBottom: 100,
  },
  // Product Card with better spacing
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
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
  userLocation: {
    fontSize: 12,
    color: 'rgba(9, 68, 89, 0.7)',
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
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 8,
    color: '#999',
    fontSize: 14,
  },
  cardContent: {
    padding: 16,
    paddingTop: 12,
  },
  productName: {
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
  productCategory: {
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
  postDate: {
    fontSize: 12,
    color: '#999',
  },
  // Customer Post Card Styles with better spacing
  customerPostCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderLeftWidth: 4,
    borderLeftColor: 'rgba(15, 177, 234, 1)',
  },
  customerPostContent: {
    padding: 16,
    paddingTop: 12,
  },
  customerPostTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'rgba(9, 68, 89, 1)',
    marginBottom: 8,
  },
  customerPostDescription: {
    fontSize: 14,
    color: 'rgba(9, 68, 89, 0.7)',
    marginBottom: 12,
    lineHeight: 20,
  },
  customerPostPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'rgba(15, 177, 234, 1)',
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
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 177, 234, 1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    justifyContent: 'center',
  },
  contactButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
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
  customerPostImage: {
    width: '100%',
    height: 200,
  },
  noImagePlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
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
  // Empty State Improvements
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
} as const);