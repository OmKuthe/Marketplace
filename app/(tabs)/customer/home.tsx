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
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
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
  ActivityIndicator
} from "react-native";
import { db, storage } from "../../../firebaseConfig";

const { width } = Dimensions.get('window');

// New color palette
const colors = {
  primary: '#405DE6',    // Instagram blue
  secondary: '#E1306C',  // Instagram pink
  background: '#FAFAFA', // Light background
  surface: '#FFFFFF',    // White
  textPrimary: '#262626',// Dark gray
  textSecondary: '#8e8e8e', // Medium gray
  border: '#dbdbdb',     // Light border
  needCard: '#FFECE6',   // Soft orange for needs
  offerCard: '#E6F3FF',  // Soft blue for offers
  success: '#4CAF50',    // Green for success actions
};

// Define types
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

// Customer Post Types
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

// Post API Functions
const createCustomerPost = async (postData: Omit<CustomerPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const postWithTimestamps = {
      ...postData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      status: 'ACTIVE' as const
    };

    const docRef = await addDoc(collection(db, "customerPosts"), postWithTimestamps);
    return docRef.id;
  } catch (error) {
    console.error('Error creating post:', error);
    throw new Error('Failed to create post');
  }
};

const uploadPostImage = async (imageUri: string, postId: string): Promise<string> => {
  try {
    // Check if it's a local file URI (starts with file://)
    let uri = imageUri;
    if (imageUri.startsWith('file://')) {
      // For React Native, we can use the file URI directly with fetch
      uri = imageUri;
    }

    // Ensure the URI is valid
    if (!uri) {
      throw new Error('Invalid image URI');
    }

    const response = await fetch(uri);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    const blob = await response.blob();
    
    // Create a more unique filename
    const timestamp = Date.now();
    const imageRef = ref(storage, `post-images/${postId}/image_${timestamp}`);
    
    const snapshot = await uploadBytes(imageRef, blob);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    
    return downloadUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    
    // More specific error handling
    if (error instanceof Error) {
      if (error.message.includes('storage/unknown')) {
        throw new Error('Network error or invalid image file');
      } else if (error.message.includes('storage/unauthorized')) {
        throw new Error('Permission denied for storage');
      } else {
        throw new Error(`Failed to upload image: ${error.message}`);
      }
    } else {
      throw new Error('Failed to upload image: Unknown error');
    }
  }
};

const getCustomerPosts = async (
  filters: PostFilter = {}, 
  lastVisible: any = null,
  pageSize: number = 10
): Promise<{ posts: CustomerPost[]; lastVisible: any }> => {
  try {
    let q = query(collection(db, "customerPosts"), orderBy('createdAt', 'desc'));

    if (filters.type) {
      q = query(q, where('type', '==', filters.type));
    }
    
    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }

    if (lastVisible) {
      q = query(q, startAfter(lastVisible), limit(pageSize));
    } else {
      q = query(q, limit(pageSize));
    }

    const snapshot = await getDocs(q);
    const posts: CustomerPost[] = [];
    
    snapshot.forEach((doc) => {
      posts.push({
        id: doc.id,
        ...doc.data()
      } as CustomerPost);
    });

    const newLastVisible = snapshot.docs[snapshot.docs.length - 1] || null;
    
    return { posts, lastVisible: newLastVisible };
  } catch (error) {
    console.error('Error fetching posts:', error);
    // Return empty array if no posts found
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

// Animated Product Card Component
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
        styles.instagramCard,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <Image 
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }} 
            style={styles.avatar}
          />
          <View>
            <Text style={styles.username}>
              {shopkeeperData?.shopName || 'Unknown Shop'}
            </Text>
            <Text style={styles.userLocation}>
              {shopkeeperData?.location || 'Unknown Location'}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleSave}>
          <Ionicons 
            name={saved ? "bookmark" : "bookmark-outline"} 
            size={24} 
            color={saved ? colors.primary : colors.textPrimary} 
          />
        </TouchableOpacity>
      </View>
      
      <Image 
        source={{ uri: item.imageUrl || 'https://via.placeholder.com/400x300' }} 
        style={styles.productImage}
        resizeMode="cover"
      />
      
      <View style={styles.cardFooter}>
        <View style={styles.actionButtons}> 
          <TouchableOpacity 
            style={styles.orderButton}
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
            <Ionicons name="cart" size={20} color="white" />
            <Text style={styles.orderButtonText}>Order Now</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.messageButton}
            onPress={() => onMessagePress(item)}
          >
            <Ionicons name="chatbubble-ellipses" size={20} color={colors.primary} />
            <Text style={styles.messageButtonText}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-social" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.productDetails}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productDescription} numberOfLines={2}>
            {item.description}
          </Text>
          <View style={styles.priceStockContainer}>
            <Text style={styles.productPrice}>💰 ${item.price}</Text>
            <Text style={styles.productStock}>📦 {item.stock} in stock</Text>
          </View>
          <Text style={styles.productCategory}>#{item.category}</Text>
        </View>
        
        {item.createdAt?.seconds && (
          <Text style={styles.timestamp}>
            {new Date(item.createdAt.seconds * 1000).toLocaleDateString()}
          </Text>
        )}
      </View>
    </Animated.View>
  );
};

// Customer Post Card Component
const CustomerPostCard = ({ 
  item, 
  index 
}: { 
  item: CustomerPost; 
  index: number; 
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

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

  const getPostColor = () => {
    return item.type === 'NEED' ? colors.needCard : colors.offerCard;
  };

  const getTypeIcon = () => {
    return item.type === 'NEED' ? 'help-circle' : 'gift';
  };

  return (
    <Animated.View 
      style={[
        styles.postCard,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          backgroundColor: getPostColor()
        }
      ]}
    >
      <View style={styles.postHeader}>
        <View style={styles.postUserInfo}>
          <View style={styles.postAvatar}>
            <Ionicons name="person" size={20} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.postUsername}>{item.customerName}</Text>
            <Text style={styles.postType}>
              <Ionicons name={getTypeIcon()} size={12} /> {item.type}
            </Text>
          </View>
        </View>
        <View style={[styles.urgencyBadge, { backgroundColor: item.urgency === 'HIGH' ? '#FF6B6B' : item.urgency === 'MEDIUM' ? '#FFD93D' : '#6BCF7F' }]}>
          <Text style={styles.urgencyText}>{item.urgency}</Text>
        </View>
      </View>

      {item.imageUrl && (
        <Image 
          source={{ uri: item.imageUrl }} 
          style={styles.postImage}
          resizeMode="cover"
        />
      )}

      <View style={styles.postContent}>
        <Text style={styles.postTitle}>{item.title}</Text>
        <Text style={styles.postDescription}>{item.description}</Text>
        
        <View style={styles.postDetails}>
          {item.price && (
            <Text style={styles.postPrice}>💰 ₹{item.price}</Text>
          )}
          <Text style={styles.postCategory}>#{item.category}</Text>
        </View>
        
        <View style={styles.postMeta}>
          <Text style={styles.postLocation}>📍 {item.location}</Text>
          <Text style={styles.postDate}>
            {item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'Recent'}
          </Text>
        </View>
      </View>

      <View style={styles.postActions}>
        <TouchableOpacity style={styles.contactButton}>
          <Ionicons name="chatbubble-ellipses" size={16} color={colors.primary} />
          <Text style={styles.contactButtonText}>Contact</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton}>
          <Ionicons name="bookmark-outline" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export default function CustomerHome() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customerPosts, setCustomerPosts] = useState<CustomerPost[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [shopkeeperData, setShopkeeperData] = useState<{[key: string]: ShopkeeperData}>({});
  const [activeTab, setActiveTab] = useState("all");
  const [sidePanelVisible, setSidePanelVisible] = useState(false);
  const [createPostModalVisible, setCreatePostModalVisible] = useState(false);
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
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [creatingPost, setCreatingPost] = useState(false);

  // Fetch customer posts
  const fetchCustomerPosts = async (filters: PostFilter = {}, reset: boolean = false) => {
    try {
      setLoadingPosts(true);
      const result = await getCustomerPosts(filters, reset ? null : lastVisible);
      
      if (reset) {
        setCustomerPosts(result.posts);
      } else {
        setCustomerPosts(prev => [...prev, ...result.posts]);
      }
      
      setLastVisible(result.lastVisible);
    } catch (error) {
      console.error('Error fetching customer posts:', error);
    } finally {
      setLoadingPosts(false);
    }
  };

  // Enhanced create post function
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
      
      const postData = {
        customerId: user.uid,
        customerName: user.displayName || 'Anonymous Customer',
        customerEmail: user.email || '',
        title: newPost.title,
        description: newPost.description,
        price: newPost.price ? parseFloat(newPost.price) : undefined,
        category: newPost.category || 'General',
        type: newPost.type,
        location: newPost.location || 'Unknown Location',
        urgency: newPost.urgency,
        status: 'ACTIVE' as PostStatus,
        contactInfo: {
          email: user.email || '',
          preferredContact: 'message' as const
        },
        tags: newPost.category ? [newPost.category.toLowerCase()] : ['general'],
      };
  
      const postId = await createCustomerPost(postData);
  
      // Upload image if it exists, but don't fail the entire post if image upload fails
      if (newPost.image) {
        try {
          const imageUrl = await uploadPostImage(newPost.image, postId);
          await updateCustomerPost(postId, { imageUrl });
        } catch (imageError) {
          console.warn('Image upload failed, but post was created:', imageError);
          // Continue without the image - the post is already created
        }
      }
  
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
      
      fetchCustomerPosts(activeFilter, true);
      
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

      alert('Starting conversation...');
      const conversationId = await conversationService.findOrCreateConversation(user.uid, shopkeeperId);
      await conversationService.sendInitialMessage(conversationId, user.uid, product);
      router.push(`/chat/${conversationId}`);
      
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert('Failed to start conversation. Please try again.');
    }
  };

  // Fetch products and shopkeepers
  useEffect(() => {
    const fetchProductsAndShopkeepers = async () => {
      try {
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
      } catch (err) {
        console.log("Error fetching products:", err);
      }
    };

    fetchProductsAndShopkeepers();
    fetchCustomerPosts(); // Load customer posts on mount
  }, []);

  useEffect(() => {
    if (activeTab === "all") {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter(product => product.type === activeTab.toUpperCase()));
    }
  }, [activeTab, products]);

  const applyFilter = (filter: PostFilter) => {
    const newFilter = { ...activeFilter, ...filter };
    setActiveFilter(newFilter);
    fetchCustomerPosts(newFilter, true);
  };

  const FilterBar = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
      <TouchableOpacity 
        style={[styles.filterButton, activeFilter.type === undefined && styles.activeFilterButton]}
        onPress={() => applyFilter({ type: undefined })}
      >
        <Text style={styles.filterButtonText}>All Posts</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.filterButton, activeFilter.type === 'NEED' && styles.activeFilterButton]}
        onPress={() => applyFilter({ type: 'NEED' })}
      >
        <Text style={styles.filterButtonText}>Needs</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.filterButton, activeFilter.type === 'OFFER' && styles.activeFilterButton]}
        onPress={() => applyFilter({ type: 'OFFER' })}
      >
        <Text style={styles.filterButtonText}>Offers</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const SidePanel = () => (
    <View style={styles.sidePanel}>
      <TouchableOpacity style={styles.sidePanelClose} onPress={() => setSidePanelVisible(false)}>
        <Ionicons name="close" size={24} color={colors.textPrimary} />
      </TouchableOpacity>
      
      <View style={styles.sidePanelHeader}>
        <Text style={styles.sidePanelTitle}>Menu</Text>
      </View>
      
      {['Home', 'Search', 'Messages', 'Orders', 'Profile'].map((item) => (
        <TouchableOpacity key={item} style={styles.menuItem} onPress={() => setSidePanelVisible(false)}>
          <Ionicons name={
            item === 'Home' ? 'home' : 
            item === 'Search' ? 'search' : 
            item === 'Messages' ? 'chatbubbles' : 
            item === 'Orders' ? 'list' : 'person'
          } size={22} color={colors.primary} />
          <Text style={styles.menuItemText}>{item}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderContent = () => {
    if (activeTab === 'customer-posts') {
      return (
        <FlatList
          data={customerPosts}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 25 }}
          renderItem={({ item, index }) => (
            <CustomerPostCard item={item} index={index} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyStateText}>No posts yet</Text>
              <Text style={styles.emptyStateSubtext}>Be the first to create a post!</Text>
            </View>
          }
        />
      );
    }

    return (
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 25 }}
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
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSidePanelVisible(true)}>
          <Ionicons name="menu" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🛒 Customer Dashboard</Text>
        <TouchableOpacity style={styles.createButton} onPress={() => setCreatePostModalVisible(true)}>
          <Ionicons name="add-circle" size={26} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {sidePanelVisible && <SidePanel />}

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "all" && styles.activeTab]}
          onPress={() => setActiveTab("all")}
        >
          <Text style={[styles.tabText, activeTab === "all" && styles.activeTabText]}>All Products</Text>
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

      {activeTab === "customer-posts" && <FilterBar />}

      {renderContent()}

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
                value={newPost.title}
                onChangeText={(text) => setNewPost({...newPost, title: text})}
              />
              
              <TextInput
                style={[styles.formInput, styles.textArea]}
                multiline
                placeholder="Description *"
                value={newPost.description}
                onChangeText={(text) => setNewPost({...newPost, description: text})}
              />
              
              <View style={styles.rowInputs}>
                <TextInput
                  style={[styles.formInput, styles.halfInput]}
                  placeholder="Price (₹)"
                  keyboardType="numeric"
                  value={newPost.price}
                  onChangeText={(text) => setNewPost({...newPost, price: text})}
                />
                <TextInput
                  style={[styles.formInput, styles.halfInput]}
                  placeholder="Category"
                  value={newPost.category}
                  onChangeText={(text) => setNewPost({...newPost, category: text})}
                />
              </View>
              
              <TextInput
                style={styles.formInput}
                placeholder="Location"
                value={newPost.location}
                onChangeText={(text) => setNewPost({...newPost, location: text})}
              />
              
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
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  createButton: {
    padding: 6,
  },
  sidePanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width * 0.75,
    height: '100%',
    backgroundColor: colors.surface,
    zIndex: 100,
    paddingVertical: 40,
    paddingHorizontal: 20,
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
    marginBottom: 30,
  },
  sidePanelHeader: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 20,
    marginBottom: 25,
  },
  sidePanelTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 15,
    color: colors.textPrimary,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: 'white',
  },
  instagramCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginHorizontal: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
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
    borderWidth: 1,
    borderColor: colors.border,
  },
  username: {
    fontWeight: '600',
    color: colors.textPrimary,
    fontSize: 14,
  },
  userLocation: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  productImage: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  cardFooter: {
    padding: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 2,
    marginRight: 10,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  orderButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 14,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 2,
    marginRight: 10,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  messageButtonText: {
    color: colors.textPrimary,
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 14,
  },
  shareButton: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  productDetails: {
    marginBottom: 12,
  },
  productName: {
    fontWeight: '700',
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  productDescription: {
    color: colors.textPrimary,
    marginBottom: 10,
    lineHeight: 20,
    fontSize: 14,
  },
  priceStockContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  productPrice: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 15,
  },
  productStock: {
    color: colors.textPrimary,
    fontSize: 14,
  },
  productCategory: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  modalContent: {
    width: width * 0.9,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalCloseButton: {
    padding: 4,
  },
  postTypeSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTypeButton: {
    backgroundColor: colors.primary,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeTypeButtonText: {
    color: 'white',
  },
  imageUploadSection: {
    height: 200,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    marginBottom: 20,
    overflow: 'hidden',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  imagePlaceholderText: {
    marginTop: 10,
    color: colors.textSecondary,
  },
  formInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 14,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  submitButton: {
    backgroundColor: colors.primary,
  },
  cancelButtonText: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  postCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginHorizontal: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  postUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  postUsername: {
    fontWeight: '600',
    color: colors.textPrimary,
    fontSize: 14,
  },
  postType: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgencyText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  postImage: {
    width: '100%',
    height: 200,
  },
  postContent: {
    padding: 16,
    paddingTop: 12,
  },
  postTitle: {
    fontWeight: '700',
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  postDescription: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  postDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  postPrice: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
  postCategory: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  postMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postLocation: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  postDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flex: 1,
    marginRight: 10,
    justifyContent: 'center',
  },
  contactButtonText: {
    color: colors.primary,
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 14,
  },
  saveButton: {
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
  },
  
  // Filter Bar Styles
  filterBar: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeFilterButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  activeFilterButtonText: {
    color: 'white',
  },
  
  // Empty State Styles
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  
  // Modal Styles
  disabledButton: {
    opacity: 0.6,
  },
  
});