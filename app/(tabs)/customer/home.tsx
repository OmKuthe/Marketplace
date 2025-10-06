import { useAuth } from '@/hooks/useAuth';
import { conversationService } from '@/utils/conversationService';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useRouter } from "expo-router";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  orderBy, 
  query, 
  addDoc,
  updateDoc,
  where,
  limit,
  startAfter,
  Timestamp
} from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
  RefreshControl,
  ImageBackground
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { db, storage } from "../../../firebaseConfig";

const { width } = Dimensions.get('window');

// Updated color palette to match RamShop design
const colors = {
  background: '#f5f5f5',      // Light grey background
  surface: '#ffffff',          // White cards/sections
  textPrimary: '#1a1a1a',     // Dark charcoal for main text
  textSecondary: '#666666',   // Medium grey for secondary text
  accent: '#2e7d32',          // Green accent for interactive elements
  success: '#2e7d32',         // Green for prices/success
  border: '#e5e5e5',          // Light grey for borders/dividers
  darkButton: '#1a1a1a',      // Black for CTA buttons
  offerGradient: ['#2e7d32', '#4caf50'], // Green gradient for offers
  needCard: 'rgba(255, 107, 53, 0.1)',    // Soft orange for needs
  offerCard: 'rgba(46, 125, 50, 0.1)',    // Soft green for offers
  lightBackground: 'rgba(229, 229, 229, 0.3)', // Very light grey
};

// Define types (keep your existing types)
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
};

// Customer Post Types (keep your existing types)
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

interface PostFilter {
  type?: PostType;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  urgency?: string;
  status?: string;
  searchQuery?: string;
}

// Comprehensive categories with icons
const CATEGORIES = [
  { id: '1', name: 'All', icon: 'grid-outline', value: 'all' },
  { id: '2', name: 'Electronics', icon: 'phone-portrait-outline', value: 'electronics' },
  { id: '3', name: 'Clothing', icon: 'shirt-outline', value: 'clothing' },
  { id: '4', name: 'Food', icon: 'fast-food-outline', value: 'food' },
  { id: '5', name: 'Books', icon: 'book-outline', value: 'books' },
  { id: '6', name: 'Home', icon: 'home-outline', value: 'home' },
  { id: '7', name: 'Sports', icon: 'basketball-outline', value: 'sports' },
  { id: '8', name: 'Beauty', icon: 'sparkles-outline', value: 'beauty' },
  { id: '9', name: 'Toys', icon: 'game-controller-outline', value: 'toys' },
  { id: '10', name: 'Jewelry', icon: 'diamond-outline', value: 'jewelry' },
  { id: '11', name: 'Automotive', icon: 'car-outline', value: 'automotive' },
  { id: '12', name: 'Health', icon: 'fitness-outline', value: 'health' },
  { id: '13', name: 'Furniture', icon: 'bed-outline', value: 'furniture' },
  { id: '14', name: 'Shoes', icon: 'walk-outline', value: 'shoes' },
  { id: '15', name: 'Bags', icon: 'bag-outline', value: 'bags' },
  { id: '16', name: 'Other', icon: 'ellipsis-horizontal-outline', value: 'other' }
];

// Post API Functions (keep your existing functions)
const createCustomerPost = async (postData: Omit<CustomerPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const postWithTimestamps = {
      ...postData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      status: 'ACTIVE' as const
    };

    console.log('📤 Saving post to Firestore with imageUrl:', postWithTimestamps.imageUrl);
    
    const docRef = await addDoc(collection(db, "customerPosts"), postWithTimestamps);
    
    console.log('✅ Post saved with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating post:', error);
    throw new Error('Failed to create post');
  }
};

const uploadPostImage = async (imageUri: string): Promise<string | undefined> => {
  try {
    console.log('Starting ImgBB upload for post image:', imageUri);
    
    const IMGBB_API_KEY = '2e6117c9d92bf16f23690049db98971d';
    
    const formData = new FormData();
    
    // @ts-ignore - React Native FormData handling
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'post_image.jpg',
    });

    console.log('Sending request to ImgBB...');
    
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = await response.json();
    console.log('ImgBB response for post:', data);
    
    if (data.success) {
      console.log('✅ Post image uploaded to ImgBB:', data.data.url);
      return data.data.url;
    } else {
      console.error('❌ ImgBB upload failed for post:', data);
      return undefined;
    }
  } catch (error) {
    console.error('❌ Error uploading post image to ImgBB:', error);
    return undefined;
  }
};

const getCustomerPosts = async (
  filters: PostFilter = {}
): Promise<{ posts: CustomerPost[]; lastVisible: any }> => {
  try {
    console.log('🔍 Fetching customer posts with filters:', filters);
    
    let q = query(collection(db, "customerPosts"), orderBy('createdAt', 'desc'));

    console.log('📝 Query created, executing...');

    const snapshot = await getDocs(q);
    console.log('✅ Query executed, found documents:', snapshot.size);

    const posts: CustomerPost[] = [];
    
    for (const postDoc of snapshot.docs) {
      const data = postDoc.data();
      
      console.log('📄 Processing post:', postDoc.id, 'Customer ID:', data.customerId);
      console.log('📄 Current customerName from post:', data.customerName);
      
      let customerName = data.customerName;
      let customerEmail = data.customerEmail;
      
      if (data.customerId) {
        try {
          console.log('👤 Fetching customer data from customers collection for customerId:', data.customerId);
          const customerDocRef = doc(db, "customers", data.customerId);
          const customerDoc = await getDoc(customerDocRef);
          
          if (customerDoc.exists()) {
            const customerData = customerDoc.data();
            console.log('✅ Customer data found:', customerData);
            
            customerName = customerData.fullName || 
                          customerData.name || 
                          customerData.displayName || 
                          customerData.username || 
                          customerData.firstName || 
                          data.customerName || 
                          'Anonymous Customer';
            
            customerEmail = customerData.email || data.customerEmail || '';
            
            console.log('👤 Final customerName from customers collection:', customerName);
            console.log('📧 Final customerEmail:', customerEmail);
          } else {
            console.log('❌ Customer document not found in customers collection for customerId:', data.customerId);
            customerName = data.customerName || 'Anonymous Customer';
          }
        } catch (customerError) {
          console.log('⚠️ Could not fetch customer data for post:', postDoc.id, customerError);
          customerName = data.customerName || 'Anonymous Customer';
        }
      } else {
        console.log('❌ No customerId found in post data');
        customerName = data.customerName || 'Anonymous Customer';
      }
      
      const post: CustomerPost = {
        id: postDoc.id,
        customerId: data.customerId || '',
        customerName: customerName,
        customerEmail: customerEmail,
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
        contactInfo: data.contactInfo || { 
          email: customerEmail, 
          preferredContact: 'message' as const 
        },
        urgency: data.urgency || 'MEDIUM'
      };

      posts.push(post);
      console.log('✅ Added post to array. Customer:', post.customerName);
    }

    console.log('📦 Final posts array length:', posts.length);
    console.log('👥 Customer names in posts:', posts.map(p => p.customerName));
    
    return { posts, lastVisible: null };
  } catch (error) {
    console.error('❌ Error fetching posts:', error);
    return { posts: [], lastVisible: null };
  }
};

const updateCustomerPost = async (postId: string, updates: Partial<CustomerPost>): Promise<void> => {
  try {
    const postRef = doc(db, "customerPosts", postId);
    await updateDoc(postRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating post:', error);
    throw new Error('Failed to update post');
  }
};

// Animated Offer Banner Component
const OfferBanner = () => {
  const [currentOffer, setCurrentOffer] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const offers = ['75% OFF', 'Free Shipping', 'Buy 2 Get 1 Free'];

  useEffect(() => {
    const offerInterval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      
      setCurrentOffer((prev) => (prev + 1) % offers.length);
    }, 4000);

    return () => clearInterval(offerInterval);
  }, []);

  return (
    <View style={styles.offerBanner}>
      <LinearGradient
        colors={colors.offerGradient}
        style={styles.offerGradient}
      >
        <Animated.Text style={[styles.offerText, { opacity: fadeAnim }]}>
          {offers[currentOffer]}
        </Animated.Text>
      </LinearGradient>
    </View>
  );
};

// Category Item Component
const CategoryItem = ({ item, isSelected, onPress }: { item: any; isSelected: boolean; onPress: () => void }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={[
        styles.categoryItem, 
        { transform: [{ scale: scaleAnim }] },
        isSelected && styles.categoryItemSelected
      ]}>
        <View style={[
          styles.categoryIcon,
          isSelected && styles.categoryIconSelected
        ]}>
          <Ionicons 
            name={item.icon} 
            size={24} 
            color={isSelected ? colors.surface : colors.accent} 
          />
        </View>
        <Text style={[
          styles.categoryName,
          isSelected && styles.categoryNameSelected
        ]}>{item.name}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Updated Product Card Component with RamShop design
const AnimatedProductCard = ({ 
  item, 
  index, 
  shopkeeperData,
  onMessagePress 
}: { 
  item: Product; 
  index: number; 
  shopkeeperData: ShopkeeperData | null;
  onMessagePress: (product: Product) => void;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const [saved, setSaved] = useState(false);
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 40,
        delay: index * 100,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handleSave = () => {
    setSaved(!saved);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this product: ${item.name} - ${item.description}`,
        title: item.name,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <Animated.View 
      style={[
        styles.productCard,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      <View style={styles.productImageContainer}>
        <Image 
          source={{ uri: item.imageUrl || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400' }} 
          style={styles.productImage}
          resizeMode="cover"
        />
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Ionicons 
            name={saved ? "heart" : "heart-outline"} 
            size={24} 
            color={saved ? '#ff6b6b' : colors.textPrimary} 
          />
        </TouchableOpacity>
        {item.stock < 10 && item.stock > 0 && (
          <View style={styles.lowStockBadge}>
            <Text style={styles.lowStockText}>Low Stock</Text>
          </View>
        )}
        {item.stock === 0 && (
          <View style={styles.outOfStockBadge}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}
      </View>
      
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productDescription} numberOfLines={2}>
          {item.description}
        </Text>
        
        <View style={styles.productMeta}>
          <View style={styles.shopInfo}>
            <Ionicons name="storefront-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.shopName}>{shopkeeperData?.shopName || 'Local Store'}</Text>
          </View>
          <Text style={styles.productCategory}>#{item.category}</Text>
        </View>
        
        <View style={styles.productFooter}>
          <Text style={styles.productPrice}>${item.price}</Text>
          <View style={styles.productActions}>
            <TouchableOpacity 
              style={styles.cartButton}
              onPress={() => {
                const shopkeeperId = (item as any).shopId || (item as any).shopkeeperID || (item as any).shopkeeper;
                router.push({
                  pathname: '../orders/order-now',
                  params: { 
                    product: JSON.stringify({
                      id: item.id,
                      name: item.name,
                      price: item.price,
                      imageUrl: item.imageUrl,
                      shopName: shopkeeperData?.shopName || 'Local Store',
                      shopId: shopkeeperId || 'shop-001',
                      description: item.description,
                      stock: item.stock
                    })
                  }
                });
              }}
            >
              <Ionicons name="cart-outline" size={18} color={colors.surface} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.messageButton}
              onPress={() => onMessagePress(item)}
            >
              <Ionicons name="chatbubble-outline" size={18} color={colors.accent} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

// Updated Customer Post Card Component
const CustomerPostCard = ({ 
  item, 
  index,
  onContactPress
}: { 
  item: CustomerPost; 
  index: number;
  onContactPress: (post: CustomerPost) => void;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 40,
        delay: index * 100,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const getTypeColor = () => {
    return item.type === 'NEED' ? '#FF6B35' : colors.accent;
  };

  const handleSave = () => {
    setSaved(!saved);
  };

  return (
    <Animated.View 
      style={[
        styles.postCard,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          borderLeftColor: getTypeColor(),
        }
      ]}
    >
      <View style={styles.postHeader}>
        <View style={styles.postUserInfo}>
          <View style={[styles.postAvatar, { backgroundColor: getTypeColor() }]}>
            <Ionicons 
              name={item.type === 'NEED' ? "help-circle" : "gift"} 
              size={16} 
              color="white" 
            />
          </View>
          <View style={styles.postUserDetails}>
            <Text style={styles.postUsername}>{item.customerName}</Text>
            <Text style={[styles.postType, { color: getTypeColor() }]}>
              {item.type} • {item.category}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleSave}>
          <Ionicons 
            name={saved ? "bookmark" : "bookmark-outline"} 
            size={20} 
            color={saved ? colors.accent : colors.textSecondary} 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.postContent}>
        <Text style={styles.postTitle}>{item.title}</Text>
        <Text style={styles.postDescription}>{item.description}</Text>
        
        <View style={styles.postDetails}>
          {item.price && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Price:</Text>
              <Text style={styles.postPrice}>${item.price}</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location:</Text>
            <Text style={styles.postLocation}>📍 {item.location}</Text>
          </View>
        </View>
      </View>

      <View style={styles.postFooter}>
        <TouchableOpacity 
          style={styles.contactButton}
          onPress={() => onContactPress(item)}
        >
          <Ionicons 
            name="chatbubble-ellipses" 
            size={16} 
            color={colors.accent} 
          />
          <Text style={styles.contactButtonText}>Contact</Text>
        </TouchableOpacity>
        
        <View style={styles.postMeta}>
          <Text style={styles.postDate}>
            {new Date(item.createdAt?.seconds * 1000).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

// Main CustomerHome Component with RamShop UI
export default function CustomerHome() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customerPosts, setCustomerPosts] = useState<CustomerPost[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [shopkeeperData, setShopkeeperData] = useState<{[key: string]: ShopkeeperData}>({});
  const [activeTab, setActiveTab] = useState<"all" | "need" | "offer">("all");
  const [createPostModalVisible, setCreatePostModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const router = useRouter();
  const { user } = useAuth();
  
  const [newPost, setNewPost] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    type: "NEED" as PostType,
    image: null as string | null,
    location: "",
    urgency: "MEDIUM" as UrgencyLevel,
  });
  
  const [activeFilter, setActiveFilter] = useState<PostFilter>({});
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [creatingPost, setCreatingPost] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch functions
  const fetchProductsAndShopkeepers = async () => {
    try {
      console.log('🔄 Refreshing products...');
      const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];
      
      setProducts(data);
      setFilteredProducts(data);

      const shopkeeperMap: {[key: string]: ShopkeeperData} = {};
      for (const product of data) {
        const shopkeeperId = (product as any).shopId || (product as any).shopkeeperID || (product as any).shopkeeper;
        if (shopkeeperId && !shopkeeperMap[shopkeeperId]) {
          try {
            const shopkeeperDoc = await getDoc(doc(db, "shopkeepers", shopkeeperId));
            if (shopkeeperDoc.exists()) {
              shopkeeperMap[shopkeeperId] = {
                uid: shopkeeperId,
                ...shopkeeperDoc.data()
              } as ShopkeeperData;
            }
          } catch (error) {
            console.error("Error fetching shopkeeper:", error);
          }
        }
      }
      setShopkeeperData(shopkeeperMap);
      
      console.log('✅ Products refreshed successfully');
    } catch (err) {
      console.log("Error refreshing products:", err);
    }
  };

  const fetchCustomerPosts = async (filters: PostFilter = {}) => {
    try {
      console.log('🚀 Starting to fetch customer posts...');
      setLoadingPosts(true);
      const result = await getCustomerPosts(filters);
      
      console.log('📊 Fetch result:', result);
      
      setCustomerPosts(result.posts);
      
      console.log('✅ Posts set to state, count:', result.posts.length);
    } catch (error) {
      console.error('❌ Error in fetchCustomerPosts:', error);
      Alert.alert('Error', 'Failed to load posts');
    } finally {
      setLoadingPosts(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCustomerPosts(activeFilter);
    await fetchProductsAndShopkeepers();
    setRefreshing(false);
  };

  // Filter products by category
  const filterProductsByCategory = (category: string) => {
    setSelectedCategory(category);
    if (category === 'all') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product => 
        product.category.toLowerCase() === category.toLowerCase()
      );
      setFilteredProducts(filtered);
    }
  };

  // Other functions remain the same
  const handleCreatePost = async () => {
    if (!user) {
      Alert.alert('Error', 'Please log in to create a post');
      return;
    }
  
    if (!newPost.title.trim() || !newPost.description.trim()) {
      Alert.alert('Error', 'Please fill in title and description');
      return;
    }
  
    try {
      setCreatingPost(true);
      
      let customerName = 'Anonymous Customer';
      let customerEmail = user.email || '';
  
      try {
        console.log('👤 Fetching customer data for:', user.uid);
        const customerDocRef = doc(db, "customers", user.uid);
        const customerDoc = await getDoc(customerDocRef);
        
        if (customerDoc.exists()) {
          const customerData = customerDoc.data();
          console.log('✅ Customer data found:', customerData);
          
          customerName = customerData.fullName || 
                        customerData.customerName || 
                        user.displayName || 
                        'Anonymous Customer';
          
          customerEmail = customerData.email || user.email || '';
        } else {
          customerName = user.displayName || 'Anonymous Customer';
        }
      } catch (customerError) {
        console.log('⚠️ Could not fetch customer data:', customerError);
        customerName = user.displayName || 'Anonymous Customer';
      }
  
      let imageUrl: string | undefined = undefined;

      if (newPost.image) {
        try {
          const uploadedUrl = await uploadPostImage(newPost.image);
          if (uploadedUrl) {
            imageUrl = uploadedUrl;
          }
        } catch (imageError) {
          console.warn('⚠️ Image upload failed:', imageError);
        }
      }

      const postData = {
        customerId: user.uid,
        customerName: customerName,
        customerEmail: customerEmail,
        title: newPost.title,
        description: newPost.description,
        price: newPost.price ? parseFloat(newPost.price) : undefined,
        category: newPost.category || 'General',
        type: newPost.type,
        imageUrl: imageUrl,
        location: newPost.location || 'Unknown Location',
        urgency: newPost.urgency,
        status: 'ACTIVE' as PostStatus,
        contactInfo: {
          email: customerEmail,
          preferredContact: 'message' as const
        },
        tags: newPost.category ? [newPost.category.toLowerCase()] : ['general'],
      };
  
      const postId = await createCustomerPost(postData);
      console.log('✅ Post created with ID:', postId);
  
      Alert.alert('Success', 'Post created successfully!');
      
      setCreatePostModalVisible(false);
      setNewPost({
        title: "",
        description: "",
        price: "",
        category: "",
        type: "NEED",
        image: null,
        location: "",
        urgency: "MEDIUM",
      });
      
      fetchCustomerPosts(activeFilter);
      
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setCreatingPost(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setNewPost({...newPost, image: result.assets[0].uri});
    }
  };

  const handleContactPost = (post: CustomerPost) => {
    if (!user) {
      Alert.alert('Error', 'Please log in to contact the poster');
      return;
    }

    Alert.alert(
      'Contact Poster',
      `Would you like to contact ${post.customerName} about their ${post.type.toLowerCase()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Message', 
          onPress: () => {
            Alert.alert('Contact', `Email: ${post.contactInfo.email}\nPreferred contact: ${post.contactInfo.preferredContact}`);
          }
        }
      ]
    );
  };

  const handleMessageButton = async (product: Product) => {
    if (!user) {
      alert('Please log in to send messages');
      return;
    }

    try {
      const shopkeeperId = (product as any).shopId || (product as any).shopkeeperID || (product as any).shopkeeper;
      
      if (!shopkeeperId) {
        alert('Unable to identify the shopkeeper');
        return;
      }

      const conversationId = await conversationService.findOrCreateConversation(user.uid, shopkeeperId);
      await conversationService.sendInitialMessage(conversationId, user.uid, product);
      router.push(`/chat/${conversationId}`);
      
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert('Failed to start conversation. Please try again.');
    }
  };

  useEffect(() => {
    fetchProductsAndShopkeepers();
    fetchCustomerPosts();
  }, []);

  useEffect(() => {
    if (activeTab === "all") {
      setFilteredProducts(products);
    }
  }, [activeTab, products]);

  const applyFilter = (filter: PostFilter) => {
    const newFilter = { ...activeFilter, ...filter };
    setActiveFilter(newFilter);
    fetchCustomerPosts(newFilter);
  };

  const FilterBar = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
      <TouchableOpacity 
        style={[styles.filterButton, activeFilter.type === undefined && styles.activeFilterButton]}
        onPress={() => applyFilter({ type: undefined })}
      >
        <Text style={[styles.filterButtonText, activeFilter.type === undefined && styles.activeFilterButtonText]}>All Posts</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.filterButton, activeFilter.type === 'NEED' && styles.activeFilterButton]}
        onPress={() => applyFilter({ type: 'NEED' })}
      >
        <Text style={[styles.filterButtonText, activeFilter.type === 'NEED' && styles.activeFilterButtonText]}>Needs</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.filterButton, activeFilter.type === 'OFFER' && styles.activeFilterButton]}
        onPress={() => applyFilter({ type: 'OFFER' })}
      >
        <Text style={[styles.filterButtonText, activeFilter.type === 'OFFER' && styles.activeFilterButtonText]}>Offers</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderContent = () => {
    const handleRefresh = async () => {
      setRefreshing(true);
      
      if (activeTab === "need" || activeTab === "offer") {
        await fetchCustomerPosts(activeFilter);
      } else {
        await fetchProductsAndShopkeepers();
      }
      
      setRefreshing(false);
    };

    if (activeTab === "need") {
      const needPosts = customerPosts.filter(post => post.type === 'NEED');
      
      return (
        <FlatList
          data={needPosts}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.accent]}
            />
          }
          renderItem={({ item, index }) => (
            <CustomerPostCard 
              item={item} 
              index={index} 
              onContactPress={handleContactPost}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyStateText}>No needs posted yet</Text>
              <Text style={styles.emptyStateSubtext}>Be the first to post what you need!</Text>
              <TouchableOpacity 
                style={styles.createFirstPostButton}
                onPress={() => setCreatePostModalVisible(true)}
              >
                <Text style={styles.createFirstPostText}>Post Your Need</Text>
              </TouchableOpacity>
            </View>
          }
        />
      );
    }

    if (activeTab === "offer") {
      const offerPosts = customerPosts.filter(post => post.type === 'OFFER');
      
      return (
        <FlatList
          data={offerPosts}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.accent]}
            />
          }
          renderItem={({ item, index }) => (
            <CustomerPostCard 
              item={item} 
              index={index} 
              onContactPress={handleContactPost}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="gift-outline" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyStateText}>No offers posted yet</Text>
              <Text style={styles.emptyStateSubtext}>Be the first to offer something!</Text>
              <TouchableOpacity 
                style={styles.createFirstPostButton}
                onPress={() => {
                  setNewPost(prev => ({ ...prev, type: "OFFER" }));
                  setCreatePostModalVisible(true);
                }}
              >
                <Text style={styles.createFirstPostText}>Post Your Offer</Text>
              </TouchableOpacity>
            </View>
          }
        />
      );
    }

    return (
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.accent]}
          />
        }
      >
        {/* Offer Banner */}
        <OfferBanner />

        {/* Categories Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shop by Category</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.categoriesList}
            contentContainerStyle={styles.categoriesContent}
          >
            {CATEGORIES.map((category) => (
              <CategoryItem 
                key={category.id} 
                item={category} 
                isSelected={selectedCategory === category.value}
                onPress={() => filterProductsByCategory(category.value)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Category Filter Info */}
        {selectedCategory !== 'all' && (
          <View style={styles.categoryFilterInfo}>
            <Text style={styles.categoryFilterText}>
              Showing {filteredProducts.length} products in {CATEGORIES.find(cat => cat.value === selectedCategory)?.name}
            </Text>
            <TouchableOpacity onPress={() => filterProductsByCategory('all')}>
              <Text style={styles.clearFilterText}>Clear filter</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Recommended Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory === 'all' ? 'Recommended for you' : `Top ${CATEGORIES.find(cat => cat.value === selectedCategory)?.name}`}
            </Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          {filteredProducts.length > 0 ? (
            <FlatList
              data={filteredProducts.slice(0, 5)}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item, index }) => {
                const shopkeeperId = (item as any).shopId || (item as any).shopkeeperID || (item as any).shopkeeper;
                const shopkeeper = shopkeeperId ? shopkeeperData[shopkeeperId] : null;
                
                return (
                  <AnimatedProductCard 
                    item={item} 
                    index={index} 
                    shopkeeperData={shopkeeper}
                    onMessagePress={handleMessageButton}
                  />
                );
              }}
              contentContainerStyle={styles.productsList}
            />
          ) : (
            <View style={styles.noProducts}>
              <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.noProductsText}>No products found</Text>
              <Text style={styles.noProductsSubtext}>Try selecting a different category</Text>
            </View>
          )}
        </View>

        {/* All Products Grid */}
        {filteredProducts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {selectedCategory === 'all' ? 'All Products' : `All ${CATEGORIES.find(cat => cat.value === selectedCategory)?.name}`}
            </Text>
            <View style={styles.productsGrid}>
              {filteredProducts.map((item, index) => {
                const shopkeeperId = (item as any).shopId || (item as any).shopkeeperID || (item as any).shopkeeper;
                const shopkeeper = shopkeeperId ? shopkeeperData[shopkeeperId] : null;
                
                return (
                  <AnimatedProductCard 
                    key={item.id}
                    item={item} 
                    index={index} 
                    shopkeeperData={shopkeeper}
                    onMessagePress={handleMessageButton}
                  />
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.time}>{new Date().getHours()}:{new Date().getMinutes().toString().padStart(2, '0')}</Text>
        </View>
        <Text style={styles.headerTitle}>RAMSHOP</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton} onPress={() => setCreatePostModalVisible(true)}>
            <Ionicons name="add-circle" size={24} color={colors.accent} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="cart-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "all" && styles.activeTab]}
          onPress={() => setActiveTab("all")}
        >
          <Text style={[styles.tabText, activeTab === "all" && styles.activeTabText]}>Products</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "need" && styles.activeTab]}
          onPress={() => setActiveTab("need")}
        >
          <Text style={[styles.tabText, activeTab === "need" && styles.activeTabText]}>Needs</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "offer" && styles.activeTab]}
          onPress={() => setActiveTab("offer")}
        >
          <Text style={[styles.tabText, activeTab === "offer" && styles.activeTabText]}>Offers</Text>
        </TouchableOpacity>
      </View>

      {(activeTab === "need" || activeTab === "offer") && <FilterBar />}

      {renderContent()}

      {/* Create Post Modal */}
      <Modal visible={createPostModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create New Post</Text>
                <TouchableOpacity onPress={() => setCreatePostModalVisible(false)}>
                  <Ionicons name="close" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.postTypeSelector}>
                <TouchableOpacity 
                  style={[styles.typeButton, newPost.type === "NEED" && styles.activeTypeButton]}
                  onPress={() => setNewPost({...newPost, type: "NEED"})}
                >
                  <Text style={[styles.typeButtonText, newPost.type === "NEED" && styles.activeTypeButtonText]}>I Need</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.typeButton, newPost.type === "OFFER" && styles.activeTypeButton]}
                  onPress={() => setNewPost({...newPost, type: "OFFER"})}
                >
                  <Text style={[styles.typeButtonText, newPost.type === "OFFER" && styles.activeTypeButtonText]}>I Offer</Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity style={styles.imageUploadSection} onPress={pickImage}>
                {newPost.image ? (
                  <Image source={{ uri: newPost.image }} style={styles.selectedImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="image-outline" size={40} color={colors.textSecondary} />
                    <Text style={styles.imagePlaceholderText}>Add Image</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              <TextInput
                style={styles.formInput}
                placeholder="Post Title *"
                placeholderTextColor={colors.textSecondary}
                value={newPost.title}
                onChangeText={(text) => setNewPost({...newPost, title: text})}
              />
              
              <TextInput
                style={[styles.formInput, styles.textArea]}
                multiline
                placeholder="Description *"
                placeholderTextColor={colors.textSecondary}
                value={newPost.description}
                onChangeText={(text) => setNewPost({...newPost, description: text})}
              />
              
              <View style={styles.rowInputs}>
                <TextInput
                  style={[styles.formInput, styles.halfInput]}
                  placeholder="Price ($)"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  value={newPost.price}
                  onChangeText={(text) => setNewPost({...newPost, price: text})}
                />
                <TextInput
                  style={[styles.formInput, styles.halfInput]}
                  placeholder="Category"
                  placeholderTextColor={colors.textSecondary}
                  value={newPost.category}
                  onChangeText={(text) => setNewPost({...newPost, category: text})}
                />
              </View>
              
              <TextInput
                style={styles.formInput}
                placeholder="Location"
                placeholderTextColor={colors.textSecondary}
                value={newPost.location}
                onChangeText={(text) => setNewPost({...newPost, location: text})}
              />
              
              <View style={styles.urgencySelector}>
                <Text style={styles.urgencyLabel}>Urgency:</Text>
                {(['LOW', 'MEDIUM', 'HIGH'] as UrgencyLevel[]).map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[styles.urgencyOption, newPost.urgency === level && styles.activeUrgencyOption]}
                    onPress={() => setNewPost({...newPost, urgency: level})}
                  >
                    <Text style={[styles.urgencyOptionText, newPost.urgency === level && styles.activeUrgencyOptionText]}>
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setCreatePostModalVisible(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.submitButton, creatingPost && styles.disabledButton]}
                  onPress={handleCreatePost}
                  disabled={creatingPost}
                >
                  {creatingPost ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.submitButtonText}>Create Post</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 15,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flex: 1,
  },
  time: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  headerRight: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  headerButton: {
    marginLeft: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
  },
  tabText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.accent,
    fontWeight: '600',
  },
  offerBanner: {
    marginHorizontal: 20,
    marginVertical: 15,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  offerGradient: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  offerText: {
    color: colors.surface,
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  seeAllText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  categoriesList: {
    paddingHorizontal: 15,
  },
  categoriesContent: {
    paddingRight: 15,
  },
  categoryItem: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  categoryItemSelected: {
    // Selected state styling
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryIconSelected: {
    backgroundColor: colors.accent,
  },
  categoryName: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  categoryNameSelected: {
    color: colors.accent,
    fontWeight: '600',
  },
  categoryFilterInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
    paddingVertical: 10,
    backgroundColor: colors.lightBackground,
    marginHorizontal: 20,
    borderRadius: 8,
  },
  categoryFilterText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  clearFilterText: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '600',
  },
  productsList: {
    paddingHorizontal: 15,
  },
  productsGrid: {
    paddingHorizontal: 15,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 15,
    width: (width - 45) / 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImageContainer: {
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  saveButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 6,
  },
  lowStockBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FFD93D',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  lowStockText: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: '600',
  },
  outOfStockBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  outOfStockText: {
    color: colors.surface,
    fontSize: 10,
    fontWeight: '600',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 16,
  },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  shopInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shopName: {
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  productCategory: {
    fontSize: 11,
    color: colors.textSecondary,
    backgroundColor: colors.lightBackground,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.success,
  },
  productActions: {
    flexDirection: 'row',
  },
  cartButton: {
    backgroundColor: colors.darkButton,
    padding: 8,
    borderRadius: 8,
    marginLeft: 6,
  },
  messageButton: {
    backgroundColor: colors.lightBackground,
    padding: 8,
    borderRadius: 8,
    marginLeft: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  // Post Card Styles
  postCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  postUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  postUserDetails: {
    flex: 1,
  },
  postUsername: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  postType: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  postContent: {
    marginBottom: 12,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  postDescription: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
    marginBottom: 12,
  },
  postDetails: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: 8,
    fontWeight: '500',
  },
  postPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.success,
  },
  postLocation: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  postDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.lightBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.accent,
    marginLeft: 6,
  },
  // Filter Bar
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.lightBackground,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeFilterButton: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  filterButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: colors.surface,
  },
  listContent: {
    paddingBottom: 25,
    paddingTop: 8,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  noProducts: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noProductsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  noProductsSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  createFirstPostButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createFirstPostText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '500',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  postTypeSelector: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: colors.lightBackground,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTypeButton: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  activeTypeButtonText: {
    color: colors.accent,
    fontWeight: '600',
  },
  imageUploadSection: {
    height: 120,
    backgroundColor: colors.lightBackground,
    borderRadius: 12,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  imagePlaceholder: {
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  formInput: {
    backgroundColor: colors.lightBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  urgencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  urgencyLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    marginRight: 12,
  },
  urgencyOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.lightBackground,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeUrgencyOption: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  urgencyOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  activeUrgencyOptionText: {
    color: colors.surface,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: colors.lightBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  submitButton: {
    backgroundColor: colors.accent,
  },
  disabledButton: {
    opacity: 0.6,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.surface,
  },
});