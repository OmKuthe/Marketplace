import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { collection, getDocs, orderBy, query, doc, getDoc, where } from "firebase/firestore";
import { getAuth } from 'firebase/auth'; // Add this import
import React, { useEffect, useState , useCallback} from "react";
import { conversationService } from '@/utils/conversationService'; // Add this import

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
  Animated,
  ActivityIndicator
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

interface Order {
  id: string;
  shopId: string;
  status: 'pending' | 'completed' | 'cancelled' | 'shipped' | 'delivered';
  customerId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }>;
  paymentMethod: string;
  shopName: string;
  createdAt: any;
  totalAmount?: number;
}

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
  imageUrl?: string | null;
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

type Offer = {
  id: string;
  shopkeeperId: string;
  shopkeeperName: string;
  shopName: string;
  title: string;
  description: string;
  originalPrice?: number;
  discountPrice: number;
  category: string;
  terms?: string;
  imageUrl?: string | null;
  expiryDate: any;
  status: 'ACTIVE' | 'EXPIRED';
  createdAt: any;
  updatedAt: any;
  isExpired: boolean;
  location?: string;
  tags?: string[];
};

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  type: string;
  imageUrl?: string | null;
  createdAt?: any;
  shopkeeperId?: string;
  shopId?: string;
  shopkeeper?: string;
  originalPrice?: number;
  discountPrice?: number;
  expiryDate?: any;
  terms?: string;
  isExpired?: boolean;
  status?: 'ACTIVE' | 'EXPIRED';
};

type FeedItem = 
  | { id: string; type: 'customerPost'; data: CustomerPost }
  | { id: string; type: 'product'; data: Product }
  | { id: string; type: 'offer'; data: Offer };

  export default function ShopkeeperHome() {
    const [posts, setPosts] = useState<Product[]>([]);
    const [customerPosts, setCustomerPosts] = useState<CustomerPost[]>([]);
    const [offers, setOffers] = useState<Offer[]>([]);
    const [filteredPosts, setFilteredPosts] = useState<Product[]>([]);
    const [filteredCustomerPosts, setFilteredCustomerPosts] = useState<CustomerPost[]>([]);
    const [filteredOffers, setFilteredOffers] = useState<Offer[]>([]);
    const [activeTab, setActiveTab] = useState("all");
    const [stats, setStats] = useState({
      totalOrders: 0,
      pendingOrders: 0,
      completedOrders: 0,
      totalProducts: 0
    });
    const [shopkeeperData, setShopkeeperData] = useState<{[key: string]: ShopkeeperData}>({});
    const [refreshing, setRefreshing] = useState(false);
    const [loadingStats, setLoadingStats] = useState(true);
    const scrollY = new Animated.Value(0);
  
    const router = useRouter();
    const auth = getAuth();
    const user = auth.currentUser;
  
    // Fetch shopkeeper stats from Firestore
    const fetchShopkeeperStats = async () => {
      if (!user) return;
      
      try {
        setLoadingStats(true);
        console.log('Fetching stats for shopkeeper:', user.uid);
    
        // Fetch orders for this shopkeeper
        const ordersQuery = query(
          collection(db, "orders"),
          where('shopId', '==', user.uid)
        );
        
        const ordersSnapshot = await getDocs(ordersQuery);
        const orders = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Order[];
    
        // Calculate order stats
        const totalOrders = orders.length;
        const pendingOrders = orders.filter(order => 
          order.status === 'pending' 
        ).length;
        const completedOrders = orders.filter(order => 
          order.status === 'completed'  || order.status === 'delivered'
        ).length;
    
        // Fetch products for this shopkeeper - try multiple field names
        let totalProducts = 0;
        try {
          // Try shopkeeperId first
          const productsQuery1 = query(
            collection(db, "products"),
            where('shopkeeperId', '==', user.uid)
          );
          const productsSnapshot1 = await getDocs(productsQuery1);
          totalProducts = productsSnapshot1.size;
          
          // If no products found, try shopId
          if (totalProducts === 0) {
            const productsQuery2 = query(
              collection(db, "products"),
              where('shopId', '==', user.uid)
            );
            const productsSnapshot2 = await getDocs(productsQuery2);
            totalProducts = productsSnapshot2.size;
          }
          
          // If still no products, try shopkeeper field
          if (totalProducts === 0) {
            const productsQuery3 = query(
              collection(db, "products"),
              where('shopkeeper', '==', user.uid)
            );
            const productsSnapshot3 = await getDocs(productsQuery3);
            totalProducts = productsSnapshot3.size;
          }
          
          // If still no products, fetch all and filter client-side
          if (totalProducts === 0) {
            const allProductsQuery = query(collection(db, "products"));
            const allProductsSnapshot = await getDocs(allProductsQuery);
            const allProducts = allProductsSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Product[];
            
            totalProducts = allProducts.filter(product => 
              product.shopkeeperId === user.uid || 
              product.shopId === user.uid || 
              product.shopkeeper === user.uid
            ).length;
          }
        } catch (productError) {
          console.error('Error fetching products:', productError);
          // Fallback: count all products (for debugging)
          const allProductsQuery = query(collection(db, "products"));
          const allProductsSnapshot = await getDocs(allProductsQuery);
          totalProducts = allProductsSnapshot.size;
        }
    
        // Update stats
        setStats({
          totalOrders,
          pendingOrders,
          completedOrders,
          totalProducts
        });
    
        console.log('Stats updated:', {
          totalOrders,
          pendingOrders,
          completedOrders,
          totalProducts,
          userId: user.uid
        });
    
      } catch (error) {
        console.error('Error fetching shopkeeper stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };
  
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
  
    const fetchOffers = async () => {
      try {
        if (!user) return;
  
        const q = query(
          collection(db, "offers"),
          where('shopkeeperId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
  
        const snapshot = await getDocs(q);
        const offersData: Offer[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          offersData.push({
            id: doc.id,
            shopkeeperId: data.shopkeeperId,
            shopkeeperName: data.shopkeeperName,
            shopName: data.shopName,
            title: data.title,
            description: data.description,
            originalPrice: data.originalPrice,
            discountPrice: data.discountPrice,
            category: data.category,
            terms: data.terms,
            imageUrl: data.imageUrl,
            expiryDate: data.expiryDate,
            status: data.status,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            isExpired: data.isExpired,
            location: data.location,
            tags: data.tags || [],
          } as Offer);
        });
  
        setOffers(offersData);
        setFilteredOffers(offersData);
      } catch (error) {
        console.error('Error fetching offers:', error);
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
      fetchOffers();
      fetchShopkeeperStats();
    }, []);
  
    const onRefresh = useCallback(async () => {
      setRefreshing(true);
      try {
        await fetchShopkeeperStats();
        
        if (activeTab === "need") {
          await fetchCustomerPosts();
        } else if (activeTab === "offer") {
          await fetchOffers();
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
      setFilteredOffers([]);
    } else if (activeTab === "need") {
      setFilteredPosts([]);
      setFilteredCustomerPosts(customerPosts);
      setFilteredOffers([]);
    } else if (activeTab === "offer") {
      setFilteredPosts([]);
      setFilteredCustomerPosts([]);
      setFilteredOffers(offers);
    }
  }, [activeTab, posts, customerPosts, offers]);

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

  // Offer Card Component
  const OfferCard = ({ item }: { item: Offer }) => {
    const isExpired = item.isExpired || (item.expiryDate && item.expiryDate.toDate() < new Date());
    const discountPercent = item.originalPrice 
      ? Math.round(((item.originalPrice - item.discountPrice) / item.originalPrice) * 100)
      : 0;

    return (
      <View style={[styles.card, styles.offerCard]}>
        {/* Offer Badge */}
        <View style={styles.offerBadge}>
          <Ionicons name="flash" size={12} color="white" />
          <Text style={styles.offerBadgeText}>SPECIAL OFFER</Text>
          {discountPercent > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discountPercent}% OFF</Text>
            </View>
          )}
        </View>
        
        {isExpired && (
          <View style={styles.expiredOverlay}>
            <Text style={styles.expiredText}>EXPIRED</Text>
          </View>
        )}

        <View style={styles.cardHeader}>
          <View style={styles.userInfo}>
            <View style={[styles.avatar, { backgroundColor: COLORS.accent }]}>
              <Ionicons name="flash" size={16} color={COLORS.secondary} />
            </View>
            <View style={styles.userInfoText}>
              <Text style={styles.username}>{item.shopName}</Text>
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
          <Text style={styles.offerTitle}>{item.title}</Text>
          <Text style={styles.offerDescription}>{item.description}</Text>
          
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
            {/* Price Section */}
            <View style={styles.offerPriceSection}>
              <View style={styles.priceRow}>
                {item.originalPrice && (
                  <Text style={styles.originalPrice}>₹{item.originalPrice}</Text>
                )}
                <Text style={styles.discountPrice}>₹{item.discountPrice}</Text>
              </View>
              {item.expiryDate && (
                <View style={styles.expiryRow}>
                  <Ionicons 
                    name="time" 
                    size={14} 
                    color={isExpired ? COLORS.danger : COLORS.textMuted} 
                  />
                  <Text style={[
                    styles.expiryText,
                    isExpired && styles.expiredDateText
                  ]}>
                    {isExpired ? 'Expired' : 'Expires'}: {item.expiryDate.toDate().toLocaleDateString()}
                  </Text>
                </View>
              )}
            </View>
            
            <View style={styles.detailsRow}>
              <Text style={styles.productCategory}>#{item.category}</Text>
              <Text style={styles.offerType}>Special Offer</Text>
            </View>

            {item.terms && (
              <Text style={styles.termsText}>Terms: {item.terms}</Text>
            )}

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
      </View>
    );
  };

// Enhanced Customer Post Card Component with Messaging
const CustomerPostCard = ({ item }: { item: CustomerPost }) => {
  const [messaging, setMessaging] = useState(false);
  const auth = getAuth();
  const user = auth.currentUser;

  const handleMessageCustomer = async () => {
    if (!user) {
      alert('Please log in to send messages');
      return;
    }

    if (!item.customerId) {
      alert('Unable to identify the customer');
      return;
    }

    try {
      setMessaging(true);
      
      // Create conversation between shopkeeper and customer
      const conversationId = await conversationService.findOrCreateConversation(user.uid, item.customerId);
      
      // Send initial message about the customer's need
      await conversationService.sendInitialMessageAboutNeed(conversationId, user.uid, item);
      
      // Navigate to chat
      router.push(`/chat/${conversationId}`);
      
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert('Failed to start conversation. Please try again.');
    } finally {
      setMessaging(false);
    }
  };

  return (
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

      {/* Enhanced Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity 
          style={[styles.contactButton, messaging && styles.disabledButton]}
          onPress={handleMessageCustomer}
          disabled={messaging}
        >
          {messaging ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="chatbubble-ellipses" size={16} color="white" />
              <Text style={styles.contactButtonText}>Message Customer</Text>
            </>
          )}
        </TouchableOpacity>
        
        {/* Additional contact options */}
        <View style={styles.quickContactButtons}>
          {item.contactInfo?.phone && (
            <TouchableOpacity style={styles.quickContactButton}>
              <Ionicons name="call" size={14} color={COLORS.primary} />
            </TouchableOpacity>
          )}
          {item.contactInfo?.email && (
            <TouchableOpacity style={styles.quickContactButton}>
              <Ionicons name="mail" size={14} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

  // Product Card Component 
  const ProductCard = ({ item }: { item: Product }) => {
    const isOffer = item.type === 'OFFER';
    const isExpired = item.isExpired || (item.expiryDate && item.expiryDate.toDate() < new Date());
    
    return (
      <View style={[styles.card, isOffer && styles.offerCard]}>
        {isOffer && (
          <View style={styles.offerBadge}>
            <Ionicons name="flash" size={12} color="white" />
            <Text style={styles.offerBadgeText}>SPECIAL OFFER</Text>
          </View>
        )}
        
        {isExpired && (
          <View style={styles.expiredOverlay}>
            <Text style={styles.expiredText}>EXPIRED</Text>
          </View>
        )}
  
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
            {/* Price Section - Different for offers */}
            {isOffer ? (
              <View style={styles.offerPriceSection}>
                <View style={styles.priceRow}>
                  {item.originalPrice && (
                    <Text style={styles.originalPrice}>₹{item.originalPrice}</Text>
                  )}
                  <Text style={styles.discountPrice}>₹{item.discountPrice}</Text>
                </View>
                {item.expiryDate && (
                  <View style={styles.expiryRow}>
                    <Ionicons name="time" size={14} color={COLORS.textMuted} />
                    <Text style={styles.expiryText}>
                      Expires: {item.expiryDate.toDate().toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.detailsRow}>
                <Text style={styles.productPrice}>₹{item.price}</Text>
                <Text style={styles.stockInfo}>{item.stock || 0} in stock</Text>
              </View>
            )}
            
            <View style={styles.detailsRow}>
              <Text style={styles.productCategory}>#{item.category || 'General'}</Text>
              <Text style={styles.productType}>{item.type || 'Product'}</Text>
            </View>
  
            {isOffer && item.terms && (
              <Text style={styles.termsText}>Terms: {item.terms}</Text>
            )}
          </View>
        </View>
  
        {/* Single Action Button for Products */}
            <View style={styles.singleActionButton}>
              <TouchableOpacity 
                style={[
                  styles.viewButton, 
                  isExpired && styles.disabledButton
                ]}
                disabled={isExpired}
                onPress={() => {
                  // Pass product data to the details page
                  router.push({
                    pathname: '/(tabs)/details/shop-prod-details',
                    params: { 
                      product: JSON.stringify({
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        imageUrl: item.imageUrl || '',
                        description: item.description,
                        shopName: getShopkeeperName(item),
                        shopId: item.shopkeeperId || item.shopId || item.shopkeeper,
                        stock: item.stock,
                        category: item.category,
                        type: item.type,
                        location: getShopkeeperLocation(item),
                    })
                  }});
                }}
              >
                <Ionicons name="eye" size={16} color="white" />
                <Text style={styles.viewButtonText}>
                  {isExpired ? 'Offer Expired' : 'View Details'}
                </Text>
              </TouchableOpacity>
            </View>
      </View>
    );
  };

  // Helper functions for shopkeeper info
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

  // Prepare data for the main FlatList
  const getListData = (): FeedItem[] => {
    if (activeTab === "need") {
      return filteredCustomerPosts.map(post => ({
        id: post.id,
        type: 'customerPost' as const,
        data: post
      }));
    } else if (activeTab === "offer") {
      return filteredOffers.map(offer => ({
        id: offer.id,
        type: 'offer' as const,
        data: offer
      }));
    } else {
      return filteredPosts.map(product => ({
        id: product.id,
        type: 'product' as const,
        data: product
      }));
    }
  };

  // Render item function
  const renderItem = ({ item }: { item: FeedItem }) => {
    if (item.type === 'customerPost') {
      return <CustomerPostCard item={item.data} />;
    } else if (item.type === 'product') {
      return <ProductCard item={item.data} />;
    } else if (item.type === 'offer') {
      return <OfferCard item={item.data} />;
    }
    return null;
  };

  // Header Component
  const Header = () => (
    <View style={styles.header}>
      <Animated.View style={[styles.headerBackground]} />
      <TouchableOpacity 
        style={styles.menuButton}
        onPress={() => router.push('/shopkeeper/profile')}
      >
        <Ionicons name="person" size={28} color={COLORS.secondary}/>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Shop Feed</Text>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => router.push('/(tabs)/offers/add-offers')}
      >
        <Ionicons name="add" size={24} color={COLORS.background} />
      </TouchableOpacity>
    </View>
  );

// Stats Section with consistent icons and proper alignment
// Stats Section with proper icons
const StatsSection = () => (
  <View style={styles.statsContainer}>
    <View style={styles.statsBackground}>
      {loadingStats ? (
        <View style={styles.loadingStats}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingStatsText}>Loading stats...</Text>
        </View>
      ) : (
        <>
          {/* Total Orders */}
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: COLORS.primaryLight }]}>
              <Ionicons name="cart-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.statValue}>{stats.totalOrders}</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          {/* Pending Orders */}
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: COLORS.warning + '20' }]}>
              <Ionicons name="time-outline" size={20} color={COLORS.secondary} />
            </View>
            <Text style={styles.statValue}>{stats.pendingOrders}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          {/* Completed Orders */}
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: COLORS.success + '20' }]}>
              <Ionicons name="checkmark-done-outline" size={20} color={COLORS.secondary} />
            </View>
            <Text style={styles.statValue}>{stats.completedOrders}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          {/* Total Products */}
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: COLORS.accentLight }]}>
              <Ionicons name="cube-outline" size={20} color={COLORS.accent} />
            </View>
            <Text style={styles.statValue}>{stats.totalProducts}</Text>
            <Text style={styles.statLabel}>Products</Text>
          </View>
        </>
      )}
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
              {activeTab === "need" ? "No customer needs found" : 
               activeTab === "offer" ? "No offers found" : "No products found"}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {activeTab === "need" ? "Customer needs will appear here" : 
               activeTab === "offer" ? "Create your first special offer" : "Products will appear here"}
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
// Update these styles in your stylesheet
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
  justifyContent: 'center',
},
statIcon: {
  width: 44,
  height: 44,
  borderRadius: 22,
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 8,
},
statValue: {
  fontSize: 16,
  fontWeight: 'bold',
  color: COLORS.secondary,
  marginBottom: 2,
  textAlign: 'center',
},
statLabel: {
  fontSize: 11,
  color: COLORS.secondaryLight,
  fontWeight: '500',
  textAlign: 'center',
},
statDivider: {
  width: 1,
  height: 35,
  backgroundColor: COLORS.border,
  marginHorizontal: 4,
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
  addButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  offerCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
  },
  offerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    margin: 12,
    marginBottom: 0,
    borderRadius: 6,
    gap: 4,
  },
  offerBadgeText: {
    color: COLORS.secondary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  expiredOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderRadius: 16,
  },
  expiredText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    transform: [{ rotate: '-15deg' }],
  },
  offerPriceSection: {
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  originalPrice: {
    fontSize: 14,
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  discountPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.danger,
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expiryText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  termsText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  disabledButton: {
    backgroundColor: COLORS.textMuted,
  },
  // Add to your styles
offerTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  color: COLORS.textPrimary,
  marginBottom: 8,
},
offerDescription: {
  fontSize: 14,
  color: COLORS.textSecondary,
  marginBottom: 12,
  lineHeight: 20,
},
offerType: {
  fontSize: 12,
  color: COLORS.accent,
  fontWeight: 'bold',
},
discountBadge: {
  backgroundColor: COLORS.danger,
  paddingHorizontal: 6,
  paddingVertical: 2,
  borderRadius: 4,
  marginLeft: 4,
},
discountText: {
  color: 'white',
  fontSize: 10,
  fontWeight: 'bold',
},
expiredDateText: {
  color: COLORS.danger,
  fontWeight: '600',
},
// Add to your styles object
actionButtonsContainer: {
  padding: 16,
  paddingTop: 8,
  borderTopWidth: 1,
  borderTopColor: COLORS.borderLight,
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},
quickContactButtons: {
  flexDirection: 'row',
  gap: 8,
},
quickContactButton: {
  padding: 8,
  borderRadius: 8,
  backgroundColor: COLORS.primaryLight,
  borderWidth: 1,
  borderColor: COLORS.primary,
},
loadingStats: {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 20,
},
loadingStatsText: {
  marginTop: 8,
  fontSize: 12,
  color: COLORS.textMuted,
},
} as const);