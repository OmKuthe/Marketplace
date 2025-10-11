import { useAuth } from '@/hooks/useAuth';
import { conversationService } from '@/utils/conversationService';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useRouter } from 'expo-router';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  deleteDoc,
  where,
  limit
} from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { db } from "../../../firebaseConfig";

const { width, height } = Dimensions.get('window');

// ENHANCED MODERN COLOR SCHEME
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
  needColor: '#8b5cf6',
  offerColor: '#06b6d4',
  gradientPrimary: ['#667eea', '#764ba2'] as const,
  gradientSecondary: ['#f093fb', '#f5576c'] as const,
  gradientSuccess: ['#10b981', '#34d399'] as const,
  gradientWarning: ['#f59e0b', '#fbbf24'] as const,
  gradientNeed: ['#8b5cf6', '#a78bfa'] as const,
  gradientOffer: ['#06b6d4', '#22d3ee'] as const,
  needCard: 'rgba(139, 92, 246, 0.08)',
  offerCard: 'rgba(6, 182, 212, 0.08)',
  lightBackground: 'rgba(226, 232, 240, 0.4)',
  electricPurple: '#8b5cf6',
  deepBlue: '#1e40af',
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
  image?: string;
  createdAt?: any;
  shopkeeperId?: string;
  shopId?: string;
  shopName?: string;
  ownerName?: string;
  location?: string;
  phone?: string;
  email?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  reviewCount?: number;
};

type Shop = {
  id: string;
  shopName: string;
  ownerName: string;
  email: string;
  phone: string;
  latitude: number;
  longitude: number;
  location: string;
  shopLogo: string;
  createdAt: any;
  updatedAt: any;
  uid: string;
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

// Enhanced categories with modern icons
const CATEGORIES = [
  { id: '1', name: 'All', icon: 'grid', value: 'all' },
  { id: '2', name: 'Electronics', icon: 'phone-portrait', value: 'electronics' },
  { id: '3', name: 'Fashion', icon: 'shirt', value: 'clothing' },
  { id: '4', name: 'Food', icon: 'fast-food', value: 'food' },
  { id: '5', name: 'Books', icon: 'book', value: 'books' },
  { id: '6', name: 'Home', icon: 'home', value: 'home' },
  { id: '7', name: 'Sports', icon: 'basketball', value: 'sports' },
  { id: '8', name: 'Beauty', icon: 'sparkles', value: 'beauty' },
  { id: '9', name: 'Toys', icon: 'game-controller', value: 'toys' },
  { id: '10', name: 'Jewelry', icon: 'diamond', value: 'jewelry' },
];

// API Functions
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

const updateCustomerPost = async (postId: string, postData: Partial<CustomerPost>): Promise<void> => {
  try {
    const postWithTimestamps = {
      ...postData,
      updatedAt: Timestamp.now(),
    };

    await updateDoc(doc(db, "customerPosts", postId), postWithTimestamps);
  } catch (error) {
    console.error('Error updating post:', error);
    throw new Error('Failed to update post');
  }
};

const deleteCustomerPost = async (postId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "customerPosts", postId));
  } catch (error) {
    console.error('Error deleting post:', error);
    throw new Error('Failed to delete post');
  }
};

const uploadPostImage = async (imageUri: string): Promise<string | undefined> => {
  try {
    const IMGBB_API_KEY = '2e6117c9d92bf16f23690049db98971d';
    const formData = new FormData();
    
    // @ts-ignore
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'post_image.jpg',
    });

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = await response.json();
    if (data.success) {
      return data.data.url;
    } else {
      console.error('ImgBB upload failed:', data);
      return undefined;
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    return undefined;
  }
};

const getCustomerPosts = async (filters: PostFilter = {}): Promise<{ posts: CustomerPost[]; lastVisible: any }> => {
  try {
    let q = query(collection(db, "customerPosts"), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    const posts: CustomerPost[] = [];
    
    for (const postDoc of snapshot.docs) {
      const data = postDoc.data();
      
      let customerName = data.customerName;
      let customerEmail = data.customerEmail;
      
      if (data.customerId) {
        try {
          const customerDocRef = doc(db, "customers", data.customerId);
          const customerDoc = await getDoc(customerDocRef);
          
          if (customerDoc.exists()) {
            const customerData = customerDoc.data();
            customerName = customerData.fullName || customerData.name || data.customerName || 'Anonymous Customer';
            customerEmail = customerData.email || data.customerEmail || '';
          }
        } catch (customerError) {
          customerName = data.customerName || 'Anonymous Customer';
        }
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
    }

    return { posts, lastVisible: null };
  } catch (error) {
    console.error('Error fetching posts:', error);
    return { posts: [], lastVisible: null };
  }
};

// Function to get random products for ads
const getRandomProductsForAds = async (count: number = 1): Promise<Product[]> => {
  try {
    const q = query(collection(db, "products"), limit(20));
    const snapshot = await getDocs(q);
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];
    
    // Shuffle and take required count
    const shuffled = products.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  } catch (error) {
    console.error('Error fetching ads products:', error);
    return [];
  }
};

// Function to get shop details
const getShopDetails = async (shopId: string): Promise<Shop | null> => {
  try {
    const shopDoc = await getDoc(doc(db, "shopkeepers", shopId));
    if (shopDoc.exists()) {
      return {
        id: shopDoc.id,
        ...shopDoc.data()
      } as Shop;
    }
    return null;
  } catch (error) {
    console.error('Error fetching shop details:', error);
    return null;
  }
};

// SMOOTH ANIMATION COMPONENTS
const FadeInView = ({ children, delay = 0, duration = 500, style = {} }: any) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[{ opacity: fadeAnim }, style]}>
      {children}
    </Animated.View>
  );
};

const SlideInView = ({ children, direction = 'up', delay = 0, duration = 600, style = {} }: any) => {
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 50,
      friction: 8,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[{ transform: [{ translateY: slideAnim }] }, style]}>
      {children}
    </Animated.View>
  );
};

// Star Rating Component with fixed decimal places
const StarRating = ({ rating, size = 14 }: { rating: number; size?: number }) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  for (let i = 1; i <= 5; i++) {
    if (i <= fullStars) {
      stars.push(<Ionicons key={i} name="star" size={size} color="#FFD700" />);
    } else if (i === fullStars + 1 && hasHalfStar) {
      stars.push(<Ionicons key={i} name="star-half" size={size} color="#FFD700" />);
    } else {
      stars.push(<Ionicons key={i} name="star-outline" size={size} color="#FFD700" />);
    }
  }

  return <View style={styles.starsContainer}>{stars}</View>;
};

// Ads Component
const AdsCard = ({ product, shop }: { product: Product; shop?: Shop }) => {
  const discountPercentage = Math.floor(Math.random() * 50) + 10;
  const originalPrice = Math.round(product.price * (1 + discountPercentage / 100));
  const rating = product.rating ? parseFloat(product.rating.toFixed(1)) : 4.5;
  const reviewCount = product.reviewCount || Math.floor(Math.random() * 100) + 1;

  return (
    <View style={styles.adsCard}>
      <View style={styles.adsHeader}>
        <Text style={styles.adsBadge}>AD</Text>
        <Text style={styles.adsTitle}>Top picks!</Text>
      </View>
      
      <TouchableOpacity 
        style={styles.adsContent}
        onPress={() => {
          router.push({
            pathname: "/(tabs)/details/productdetails",
            params: { product: JSON.stringify(product) }
          });
        }}
      >
        <Image 
          source={{ uri: product.imageUrl || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400' }}
          style={styles.adsImage}
          resizeMode="cover"
        />
        
        <View style={styles.adsInfo}>
          <Text style={styles.adsProductName} numberOfLines={2}>{product.name}</Text>
          
          <View style={styles.adsRatingContainer}>
            <StarRating rating={rating} size={12} />
            <Text style={styles.adsRatingText}>({rating.toFixed(1)})</Text>
            <Text style={styles.adsReviewCount}>({reviewCount})</Text>
          </View>
          
          <View style={styles.adsPricing}>
            <Text style={styles.adsOriginalPrice}>${originalPrice}</Text>
            <Text style={styles.adsDiscountedPrice}>${product.price}</Text>
            <View style={styles.adsDiscountBadge}>
              <Text style={styles.adsDiscountText}>✔ {discountPercentage}% OFF</Text>
            </View>
          </View>
          
          {/* <Text style={styles.adsDelivery}>Delivery by 15th Oct</Text> */}
        </View>
      </TouchableOpacity>
      
      {shop && (
        <TouchableOpacity 
          style={styles.adsShopSection}
          onPress={() => {
            router.push("/(tabs)/details/shop");
          }}
        >
          <Text style={styles.adsShopText}>Shop: {shop.shopName}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
      
      {/* <TouchableOpacity style={styles.adsShopNowButton}>
        <Text style={styles.adsShopNowText}>Shop now →</Text>
      </TouchableOpacity> */}
    </View>
  );
};

// Enhanced Offer Banner Component with shop redirect
const OfferBanner = () => {
  const [currentOffer, setCurrentOffer] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const offers = [
    { 
      text: 'Buy 2 Get 1 Free', 
      subtext: 'On selected items',
      buttonText: 'Shop Now →',
      gradient: colors.gradientSecondary,
      shopName: 'Fashion Hub'
    },
    { 
      text: '75% OFF', 
      subtext: 'Limited Time Offer',
      buttonText: 'Explore →',
      gradient: colors.gradientPrimary,
      shopName: 'Electro World'
    },
    { 
      text: 'Free Shipping', 
      subtext: 'On orders over $50',
      buttonText: 'See Details →',
      gradient: colors.gradientSuccess,
      shopName: 'Home Essentials'
    }
  ];

  useEffect(() => {
    const offerInterval = setInterval(() => {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: -50,
            duration: 300,
            useNativeDriver: true,
          })
        ]),
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          })
        ])
      ]).start();
      
      setCurrentOffer((prev) => (prev + 1) % offers.length);
    }, 5000);

    return () => clearInterval(offerInterval);
  }, []);

  return (
    <FadeInView delay={200}>
      <TouchableOpacity 
        style={styles.offerBanner}
        onPress={() => {
          router.push("/(tabs)/details/shop");
        }}
      >
        <LinearGradient
          colors={offers[currentOffer].gradient}
          style={styles.offerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Animated.View style={[
            styles.offerContent,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}>
            <View style={styles.offerTextContainer}>
              <Text style={styles.offerMainText}>{offers[currentOffer].text}</Text>
              <Text style={styles.offerSubtext}>{offers[currentOffer].subtext}</Text>
              <Text style={styles.offerShopText}>at {offers[currentOffer].shopName}</Text>
            </View>
            <TouchableOpacity style={styles.offerButton}>
              <Text style={styles.offerButtonText}>{offers[currentOffer].buttonText}</Text>
            </TouchableOpacity>
          </Animated.View>
        </LinearGradient>
      </TouchableOpacity>
    </FadeInView>
  );
};

// ENHANCED Category Item Component
const CategoryItem = ({ item, isSelected, onPress }: { item: any; isSelected: boolean; onPress: () => void }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }),
      Animated.spring(rotateAnim, {
        toValue: 1,
        useNativeDriver: true,
      })
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.spring(rotateAnim, {
        toValue: 0,
        useNativeDriver: true,
      })
    ]).start();
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '10deg']
  });

  return (
    <SlideInView delay={100 * parseInt(item.id)} direction="up">
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <Animated.View style={[
          styles.categoryItem, 
          { 
            transform: [
              { scale: scaleAnim },
              { rotate: rotate }
            ]
          },
          isSelected && styles.categoryItemSelected
        ]}>
          <LinearGradient
            colors={isSelected ? colors.gradientPrimary : ['#f1f5f9', '#e2e8f0']}
            style={styles.categoryIcon}
          >
            <Ionicons 
              name={item.icon} 
              size={22} 
              color={isSelected ? colors.surface : colors.accent} 
            />
          </LinearGradient>
          <Text style={[
            styles.categoryName,
            isSelected && styles.categoryNameSelected
          ]}>{item.name}</Text>
        </Animated.View>
      </TouchableOpacity>
    </SlideInView>
  );
};

// UPDATED: Enhanced Product Card with proper navigation
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
  const slideAnim = useRef(new Animated.Value(20)).current;
  const [saved, setSaved] = useState(false);
  const saveScale = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        delay: index * 150,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 7,
        delay: index * 150,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 60,
        friction: 7,
        delay: index * 150,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handleSave = () => {
    Animated.sequence([
      Animated.spring(saveScale, {
        toValue: 1.3,
        useNativeDriver: true,
      }),
      Animated.spring(saveScale, {
        toValue: 1,
        useNativeDriver: true,
      })
    ]).start();
    setSaved(!saved);
  };

  const discountPercentage = Math.floor(Math.random() * 50) + 10;
  const originalPrice = Math.round(item.price * (1 + discountPercentage / 100));
  const rating = item.rating ? parseFloat(item.rating.toFixed(1)) : 4.5;
  const reviewCount = item.reviewCount || Math.floor(Math.random() * 100) + 1;

  return (
    <TouchableOpacity 
      onPress={() => {
        console.log('🔄 Navigating to product details with:', item.id, item.name);
        router.push({
          pathname: "/(tabs)/details/productdetails",
          params: { 
            product: JSON.stringify({
              id: item.id,
              name: item.name,
              description: item.description,
              price: item.price,
              stock: item.stock,
              category: item.category,
              type: item.type,
              imageUrl: item.imageUrl,
              image: item.image,
              shopkeeperId: item.shopkeeperId,
              shopId: item.shopId,
              shopName: shopkeeperData?.shopName,
              ownerName: shopkeeperData?.ownerName,
              location: shopkeeperData?.location,
              phone: shopkeeperData?.phone,
              email: shopkeeperData?.email,
              createdAt: item.createdAt
            })
          }
        });
      }}
      activeOpacity={0.9}
    >
      <Animated.View 
        style={[
          styles.productCard,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: slideAnim }
            ]
          }
        ]}
      >
        <View style={styles.productImageContainer}>
          <Image 
            source={{ 
              uri: item.imageUrl || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400' 
            }} 
            style={styles.productImage}
            resizeMode="cover"
          />
          
          {/* TOP BADGES CONTAINER */}
          <View style={styles.topBadgesContainer}>
            {/* Discount Badge */}
            <FadeInView delay={300 + index * 50}>
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>✔ {discountPercentage}% OFF</Text>
              </View>
            </FadeInView>

            {/* Stock Badge */}
            {item.stock < 10 && item.stock > 0 && (
              <FadeInView delay={400 + index * 50}>
                <View style={styles.lowStockBadge}>
                  <Text style={styles.lowStockText}>Low Stock</Text>
                </View>
              </FadeInView>
            )}
            {item.stock === 0 && (
              <FadeInView delay={400 + index * 50}>
                <View style={styles.outOfStockBadge}>
                  <Text style={styles.outOfStockText}>Out of Stock</Text>
                </View>
              </FadeInView>
            )}
          </View>
          
          {/* Favorite Button */}
          <Animated.View style={[styles.saveButtonContainer, { transform: [{ scale: saveScale }] }]}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Ionicons 
                name={saved ? "heart" : "heart-outline"} 
                size={20} 
                color={saved ? colors.error : colors.surface} 
              />
            </TouchableOpacity>
          </Animated.View>
        </View>
        
        <View style={styles.productInfo}>
          {/* Product Name */}
          <FadeInView delay={550 + index * 50}>
            <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          </FadeInView>

          {/* Rating Section */}
          <FadeInView delay={600 + index * 50}>
            <View style={styles.ratingContainer}>
              <StarRating rating={rating} />
              <Text style={styles.ratingText}>({rating.toFixed(1)})</Text>
              <Text style={styles.reviewCount}>({reviewCount})</Text>
            </View>
          </FadeInView>

          {/* Description */}
          <FadeInView delay={650 + index * 50}>
            <Text style={styles.productDescription} numberOfLines={2}>
              {item.description || 'A stylish, versatile piece with premium finish.'}
            </Text>
          </FadeInView>
          
          {/* Pricing Row */}
          <FadeInView delay={700 + index * 50}>
            <View style={styles.pricingContainer}>
              <View style={styles.originalPriceContainer}>
                <Text style={styles.originalPrice}>${originalPrice}</Text>
                <Text style={styles.discountedPrice}>${item.price}</Text>
              </View>
            </View>
          </FadeInView>
          
          {/* Action Buttons */}
          <FadeInView delay={750 + index * 50}>
            <View style={styles.productActions}>
              <TouchableOpacity 
                style={[
                  styles.cartButton,
                  item.stock === 0 && styles.disabledButton
                ]}
                onPress={(e) => {
                  e.stopPropagation();
                  if (item.stock > 0) {
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
                  }
                }}
                disabled={item.stock === 0}
              >
                <Ionicons name="cart" size={16} color={colors.surface} />
                <Text style={styles.cartButtonText}>
                  {item.stock > 0 ? 'Buy Now' : 'Out of Stock'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.messageButton}
                onPress={(e) => {
                  e.stopPropagation();
                  onMessagePress(item);
                }}
              >
                <Ionicons name="chatbubble" size={16} color={colors.accent} />
              </TouchableOpacity>
            </View>
          </FadeInView>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

// ENHANCED: Completely Restructured Customer Post Card Component
const CustomerPostCard = ({ 
  item, 
  index,
  onContactPress,
  onEditPress,
  onDeletePress,
  currentUserId
}: { 
  item: CustomerPost; 
  index: number;
  onContactPress: (post: CustomerPost) => void;
  onEditPress: (post: CustomerPost) => void;
  onDeletePress: (postId: string) => void;
  currentUserId?: string;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [saved, setSaved] = useState(false);
  const saveScale = useRef(new Animated.Value(1)).current;
  const [showActions, setShowActions] = useState(false);

  const isOwnPost = currentUserId === item.customerId;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        delay: index * 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 7,
        delay: index * 200,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 60,
        friction: 7,
        delay: index * 200,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const getTypeColor = () => {
    return item.type === 'NEED' ? colors.needColor : colors.offerColor;
  };

  const getTypeGradient = () => {
    return item.type === 'NEED' 
      ? colors.gradientNeed 
      : colors.gradientOffer;
  };

  const getTypeIcon = () => {
    return item.type === 'NEED' ? "help-circle" : "gift";
  };

  const getUrgencyColor = () => {
    switch (item.urgency) {
      case 'HIGH': return colors.error;
      case 'MEDIUM': return colors.warning;
      case 'LOW': return colors.success;
      default: return colors.textSecondary;
    }
  };

  const handleSave = () => {
    Animated.sequence([
      Animated.spring(saveScale, {
        toValue: 1.3,
        useNativeDriver: true,
      }),
      Animated.spring(saveScale, {
        toValue: 1,
        useNativeDriver: true,
      })
    ]).start();
    setSaved(!saved);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => onDeletePress(item.id)
        }
      ]
    );
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Recently';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (error) {
      return 'Recently';
    }
  };

  return (
    <Animated.View 
      style={[
        styles.postCard,
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: slideAnim }
          ],
        }
      ]}
    >
      {/* Enhanced Post Header */}
      <View style={styles.postHeader}>
        <View style={styles.postUserInfo}>
          <LinearGradient
            colors={getTypeGradient() as [string, string]}
            style={styles.postAvatar}
          >
            <Ionicons name={getTypeIcon()} size={20} color="white" />
          </LinearGradient>
          <View style={styles.postUserDetails}>
            <Text style={styles.postUsername}>{item.customerName}</Text>
            <View style={styles.postMetaRow}>
              <View style={[styles.postTypeBadge, { backgroundColor: getTypeColor() + '20' }]}>
                <Ionicons name={getTypeIcon()} size={12} color={getTypeColor()} />
                <Text style={[styles.postTypeText, { color: getTypeColor() }]}>
                  {item.type}
                </Text>
              </View>
              <Text style={styles.postDate}>{formatDate(item.createdAt)}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.postHeaderActions}>
          {isOwnPost && (
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={() => setShowActions(!showActions)}
            >
              <Ionicons name="ellipsis-vertical" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
          
          <Animated.View style={{ transform: [{ scale: saveScale }] }}>
            <TouchableOpacity onPress={handleSave} style={styles.bookmarkButton}>
              <Ionicons
                name={saved ? "bookmark" : "bookmark-outline"}
                size={20}
                color={saved ? getTypeColor() : colors.textSecondary}
              />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>

      {/* Action Menu for Own Posts */}
      {showActions && isOwnPost && (
        <View style={styles.actionMenu}>
          <TouchableOpacity 
            style={styles.actionMenuItem}
            onPress={() => {
              setShowActions(false);
              onEditPress(item);
            }}
          >
            <Ionicons name="create" size={16} color={colors.textPrimary} />
            <Text style={styles.actionMenuText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionMenuItem, styles.deleteAction]}
            onPress={handleDelete}
          >
            <Ionicons name="trash" size={16} color={colors.error} />
            <Text style={[styles.actionMenuText, styles.deleteActionText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Enhanced Post Content */}
      <View style={styles.postContent}>
        {item.imageUrl ? (
          <View style={styles.postImageContainer}>
            <Image 
              source={{ uri: item.imageUrl }}
              style={styles.postImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.1)']}
              style={styles.imageOverlay}
            />
          </View>
        ) : (
          <View style={[styles.postImageContainer, styles.noImageContainer]}>
            <LinearGradient
              colors={getTypeGradient() as [string, string]}
              style={styles.noImageGradient}
            >
              <Ionicons 
                name={getTypeIcon()} 
                size={48} 
                color="white" 
              />
              <Text style={styles.noImageText}>
                {item.type}
              </Text>
            </LinearGradient>
          </View>
        )}
        
        <View style={styles.postTextContent}>
          <Text style={styles.postTitle}>{item.title}</Text>
          <Text style={styles.postDescription}>{item.description}</Text>
        </View>
        
        {/* Enhanced Post Details Grid */}
        <View style={styles.postDetailsGrid}>
          {item.price && (
            <View style={styles.detailChip}>
              <Ionicons name="pricetag" size={14} color={getTypeColor()} />
              <Text style={[styles.detailChipText, { color: getTypeColor() }]}>
                ${item.price}
              </Text>
            </View>
          )}
          
          <View style={styles.detailChip}>
            <Ionicons name="location" size={14} color={colors.textSecondary} />
            <Text style={styles.detailChipText}>{item.location}</Text>
          </View>
          
          <View style={[styles.detailChip, { backgroundColor: getUrgencyColor() + '20' }]}>
            <Ionicons name="time" size={14} color={getUrgencyColor()} />
            <Text style={[styles.detailChipText, { color: getUrgencyColor() }]}>
              {item.urgency}
            </Text>
          </View>
          
          <View style={styles.detailChip}>
            <Ionicons name="grid" size={14} color={colors.textSecondary} />
            <Text style={styles.detailChipText}>{item.category}</Text>
          </View>
        </View>
      </View>

      {/* Enhanced Post Footer */}
      <View style={styles.postFooter}>
        <TouchableOpacity 
          style={[
            styles.contactButton,
            { 
              backgroundColor: getTypeColor(),
            }
          ]}
          onPress={() => onContactPress(item)}
        >
          <Ionicons 
            name="chatbubble-ellipses" 
            size={16} 
            color="white" 
          />
          <Text style={styles.contactButtonText}>Contact Poster</Text>
        </TouchableOpacity>
        
        {isOwnPost && (
          <View style={[styles.ownPostBadge, { backgroundColor: getTypeColor() + '20' }]}>
            <Ionicons name="person" size={12} color={getTypeColor()} />
            <Text style={[styles.ownPostText, { color: getTypeColor() }]}>Your Post</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

// Main CustomerHome Component
export default function CustomerHome() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customerPosts, setCustomerPosts] = useState<CustomerPost[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [shopkeeperData, setShopkeeperData] = useState<{[key: string]: ShopkeeperData}>({});
  const [activeTab, setActiveTab] = useState<"all" | "need" | "offer">("all");
  const [createPostModalVisible, setCreatePostModalVisible] = useState(false);
  const [editPostModalVisible, setEditPostModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [adsProducts, setAdsProducts] = useState<Product[]>([]);
  const [shops, setShops] = useState<{[key: string]: Shop}>({});
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

  const [editingPost, setEditingPost] = useState<CustomerPost | null>(null);
  
  const [activeFilter, setActiveFilter] = useState<PostFilter>({});
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [creatingPost, setCreatingPost] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const tabSlideAnim = useRef(new Animated.Value(0)).current;

  // Animate tab change
  useEffect(() => {
    Animated.spring(tabSlideAnim, {
      toValue: 1,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [activeTab]);

  // Fetch functions
  const fetchProductsAndShopkeepers = async () => {
    try {
      const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];
      
      // Add mock ratings for demonstration with fixed decimal
      const productsWithRatings = data.map(product => ({
        ...product,
        rating: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
        reviewCount: Math.floor(Math.random() * 100) + 1
      }));
      
      setProducts(productsWithRatings);
      setFilteredProducts(productsWithRatings);

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
      console.log("Error refreshing products:", err);
    }
  };

  // Fetch ads products
  const fetchAdsProducts = async () => {
    try {
      const ads = await getRandomProductsForAds(3);
      setAdsProducts(ads);
      
      // Fetch shop details for ads products
      const shopsMap: {[key: string]: Shop} = {};
      for (const product of ads) {
        const shopkeeperId = (product as any).shopId || (product as any).shopkeeperID || (product as any).shopkeeper;
        if (shopkeeperId && !shopsMap[shopkeeperId]) {
          const shopDetails = await getShopDetails(shopkeeperId);
          if (shopDetails) {
            shopsMap[shopkeeperId] = shopDetails;
          }
        }
      }
      setShops(shopsMap);
    } catch (error) {
      console.error('Error fetching ads products:', error);
    }
  };

  const fetchCustomerPosts = async (filters: PostFilter = {}) => {
    try {
      setLoadingPosts(true);
      const result = await getCustomerPosts(filters);
      setCustomerPosts(result.posts);
    } catch (error) {
      console.error('Error in fetchCustomerPosts:', error);
      Alert.alert('Error', 'Failed to load posts');
    } finally {
      setLoadingPosts(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCustomerPosts(activeFilter);
    await fetchProductsAndShopkeepers();
    await fetchAdsProducts();
    setRefreshing(false);
  };

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
        const customerDocRef = doc(db, "customers", user.uid);
        const customerDoc = await getDoc(customerDocRef);
        
        if (customerDoc.exists()) {
          const customerData = customerDoc.data();
          customerName = customerData.fullName || user.displayName || 'Anonymous Customer';
          customerEmail = customerData.email || user.email || '';
        }
      } catch (customerError) {
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
          console.warn('Image upload failed:', imageError);
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

  const handleEditPost = async () => {
    if (!user || !editingPost) {
      Alert.alert('Error', 'Unable to edit post');
      return;
    }
  
    if (!newPost.title.trim() || !newPost.description.trim()) {
      Alert.alert('Error', 'Please fill in title and description');
      return;
    }
  
    try {
      setCreatingPost(true);
  
      let imageUrl: string | undefined = editingPost.imageUrl;

      if (newPost.image && newPost.image !== editingPost.imageUrl) {
        try {
          const uploadedUrl = await uploadPostImage(newPost.image);
          if (uploadedUrl) {
            imageUrl = uploadedUrl;
          }
        } catch (imageError) {
          console.warn('Image upload failed:', imageError);
        }
      }

      const postData = {
        title: newPost.title,
        description: newPost.description,
        price: newPost.price ? parseFloat(newPost.price) : undefined,
        category: newPost.category || 'General',
        type: newPost.type,
        imageUrl: imageUrl,
        location: newPost.location || 'Unknown Location',
        urgency: newPost.urgency,
        tags: newPost.category ? [newPost.category.toLowerCase()] : ['general'],
      };
  
      await updateCustomerPost(editingPost.id, postData);
      
      Alert.alert('Success', 'Post updated successfully!');
      
      setEditPostModalVisible(false);
      setEditingPost(null);
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
      console.error('Error updating post:', error);
      Alert.alert('Error', 'Failed to update post. Please try again.');
    } finally {
      setCreatingPost(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deleteCustomerPost(postId);
      Alert.alert('Success', 'Post deleted successfully!');
      fetchCustomerPosts(activeFilter);
    } catch (error) {
      console.error('Error deleting post:', error);
      Alert.alert('Error', 'Failed to delete post. Please try again.');
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

  const handleEditPostPress = (post: CustomerPost) => {
    setEditingPost(post);
    setNewPost({
      title: post.title,
      description: post.description,
      price: post.price?.toString() || "",
      category: post.category,
      type: post.type,
      image: post.imageUrl || null,
      location: post.location,
      urgency: post.urgency,
    });
    setEditPostModalVisible(true);
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

  // Function to render ads after every 8 products
  const renderProductsWithAds = () => {
    const items = [];
    
    for (let i = 0; i < filteredProducts.length; i++) {
      // Add product
      const product = filteredProducts[i];
      const shopkeeperId = (product as any).shopId || (product as any).shopkeeperID || (product as any).shopkeeper;
      const shopkeeper = shopkeeperId ? shopkeeperData[shopkeeperId] : null;
      
      items.push(
        <AnimatedProductCard 
          key={`product-${product.id}`}
          item={product} 
          index={i} 
          shopkeeperData={shopkeeper}
          onMessagePress={handleMessageButton}
        />
      );
      
      // Add ad after every 8 products
      if ((i + 1) % 8 === 0 && adsProducts.length > 0) {
        const adIndex = Math.floor((i / 8) % adsProducts.length);
        const adProduct = adsProducts[adIndex];
        const shopkeeperId = (adProduct as any).shopId || (adProduct as any).shopkeeperID || (adProduct as any).shopkeeper;
        const shop = shopkeeperId ? shops[shopkeeperId] : undefined;
        
        items.push(
          <AdsCard 
            key={`ad-${i}`}
            product={adProduct}
            shop={shop}
          />
        );
      }
    }
    
    return items;
  };

  useEffect(() => {
    fetchProductsAndShopkeepers();
    fetchCustomerPosts();
    fetchAdsProducts();
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

  const renderContent = () => {
    const handleRefresh = async () => {
      setRefreshing(true);
      
      if (activeTab === "need" || activeTab === "offer") {
        await fetchCustomerPosts(activeFilter);
      } else {
        await fetchProductsAndShopkeepers();
        await fetchAdsProducts();
      }
      
      setRefreshing(false);
    };

    if (activeTab === "need") {
      const needPosts = customerPosts.filter(post => post.type === 'NEED');
      
      return (
        <Animated.View style={{ flex: 1, opacity: tabSlideAnim }}>
          <FlatList
            data={needPosts}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[colors.needColor]}
              />
            }
            renderItem={({ item, index }) => (
              <CustomerPostCard 
                item={item} 
                index={index} 
                onContactPress={handleContactPost}
                onEditPress={handleEditPostPress}
                onDeletePress={handleDeletePost}
                currentUserId={user?.uid}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="document-text" size={64} color={colors.textSecondary} />
                <Text style={styles.emptyStateText}>No needs posted yet</Text>
                <Text style={styles.emptyStateSubtext}>Be the first to post what you need!</Text>
                <TouchableOpacity 
                  style={[styles.createFirstPostButton, { backgroundColor: colors.needColor }]}
                  onPress={() => setCreatePostModalVisible(true)}
                >
                  <Text style={styles.createFirstPostText}>Post Your Need</Text>
                </TouchableOpacity>
              </View>
            }
          />
        </Animated.View>
      );
    }

    if (activeTab === "offer") {
      const offerPosts = customerPosts.filter(post => post.type === 'OFFER');
      
      return (
        <Animated.View style={{ flex: 1, opacity: tabSlideAnim }}>
          <FlatList
            data={offerPosts}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[colors.offerColor]}
              />
            }
            renderItem={({ item, index }) => (
              <CustomerPostCard 
                item={item} 
                index={index} 
                onContactPress={handleContactPost}
                onEditPress={handleEditPostPress}
                onDeletePress={handleDeletePost}
                currentUserId={user?.uid}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="gift" size={64} color={colors.textSecondary} />
                <Text style={styles.emptyStateText}>No offers posted yet</Text>
                <Text style={styles.emptyStateSubtext}>Be the first to offer something!</Text>
                <TouchableOpacity 
                  style={[styles.createFirstPostButton, { backgroundColor: colors.offerColor }]}
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
        </Animated.View>
      );
    }

    return (
      <Animated.View style={{ flex: 1, opacity: tabSlideAnim }}>
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
          {/* Enhanced Offer Banner */}
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
            <FadeInView>
              <View style={styles.categoryFilterInfo}>
                <Text style={styles.categoryFilterText}>
                  Showing {filteredProducts.length} products in {CATEGORIES.find(cat => cat.value === selectedCategory)?.name}
                </Text>
                <TouchableOpacity onPress={() => filterProductsByCategory('all')}>
                  <Text style={styles.clearFilterText}>Clear filter</Text>
                </TouchableOpacity>
              </View>
            </FadeInView>
          )}

          {/* Recommended Products */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {selectedCategory === 'all' ? 'Recommended for you' : `Top ${CATEGORIES.find(cat => cat.value === selectedCategory)?.name}`}
              </Text>
              <TouchableOpacity>
                {/* <Text style={styles.seeAllText}>See all</Text> */}
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
                <Ionicons name="search" size={48} color={colors.textSecondary} />
                <Text style={styles.noProductsText}>No products found</Text>
                <Text style={styles.noProductsSubtext}>Try selecting a different category</Text>
              </View>
            )}
          </View>

          {/* All Products Grid with Ads */}
          {filteredProducts.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {selectedCategory === 'all' ? 'All Products' : `All ${CATEGORIES.find(cat => cat.value === selectedCategory)?.name}`}
              </Text>
              <View style={styles.productsGrid}>
                {renderProductsWithAds()}
              </View>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    );
  };

  const renderPostModal = (isEdit: boolean = false) => {
    const modalTitle = isEdit ? 'Edit Post' : 'Create New Post';
    const submitButtonText = isEdit ? 'Update Post' : 'Create Post';
    const submitHandler = isEdit ? handleEditPost : handleCreatePost;
    const modalVisible = isEdit ? editPostModalVisible : createPostModalVisible;
    const setModalVisible = isEdit ? setEditPostModalVisible : setCreatePostModalVisible;

    return (
      <Modal 
        visible={modalVisible} 
        animationType="slide" 
        transparent={true}
        onRequestClose={() => {
          setModalVisible(false);
          if (isEdit) setEditingPost(null);
        }}
      >
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{modalTitle}</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => {
                    setModalVisible(false);
                    if (isEdit) setEditingPost(null);
                  }}
                >
                  <Ionicons name="close" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.postTypeSelector}>
                <TouchableOpacity 
                  style={[styles.typeButton, newPost.type === "NEED" && styles.activeTypeButton]}
                  onPress={() => setNewPost({...newPost, type: "NEED"})}
                >
                  <LinearGradient
                    colors={newPost.type === "NEED" ? colors.gradientNeed : ['#f1f5f9', '#e2e8f0']}
                    style={styles.typeButtonGradient}
                  >
                    <Text style={[styles.typeButtonText, newPost.type === "NEED" && styles.activeTypeButtonText]}>I Need</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.typeButton, newPost.type === "OFFER" && styles.activeTypeButton]}
                  onPress={() => setNewPost({...newPost, type: "OFFER"})}
                >
                  <LinearGradient
                    colors={newPost.type === "OFFER" ? colors.gradientOffer : ['#f1f5f9', '#e2e8f0']}
                    style={styles.typeButtonGradient}
                  >
                    <Text style={[styles.typeButtonText, newPost.type === "OFFER" && styles.activeTypeButtonText]}>I Offer</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity style={styles.imageUploadSection} onPress={pickImage}>
                {newPost.image ? (
                  <Image source={{ uri: newPost.image }} style={styles.selectedImage} />
                ) : (
                  <LinearGradient
                    colors={['#f8fafc', '#e2e8f0']}
                    style={styles.imagePlaceholder}
                  >
                    <Ionicons name="image" size={40} color={colors.textSecondary} />
                    <Text style={styles.imagePlaceholderText}>Add Image</Text>
                  </LinearGradient>
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
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]} 
                  onPress={() => {
                    setModalVisible(false);
                    if (isEdit) setEditingPost(null);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.submitButton, creatingPost && styles.disabledButton]}
                  onPress={submitHandler}
                  disabled={creatingPost}
                >
                  <LinearGradient
                    colors={newPost.type === "NEED" ? colors.gradientNeed : colors.gradientOffer}
                    style={styles.submitButtonGradient}
                  >
                    {creatingPost ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={styles.submitButtonText}>{submitButtonText}</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <FadeInView duration={800}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image 
              source={require('../../../assets/images/logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.headerTitle}>TownMart</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.headerButton} 
              onPress={() => setCreatePostModalVisible(true)}
            >
              <Ionicons name="add-circle" size={24} color={colors.accent} />
            </TouchableOpacity>
            {/* <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="cart" size={22} color={colors.textPrimary} />
            </TouchableOpacity> */}
          </View>
        </View>
      </FadeInView>

      {/* Enhanced Tabs */}
      <SlideInView delay={300}>
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === "all" && styles.activeTab]}
            onPress={() => setActiveTab("all")}
          >
            <Ionicons 
              name="grid" 
              size={20} 
              color={activeTab === "all" ? colors.surface : colors.textSecondary} 
            />
            <Text style={[styles.tabText, activeTab === "all" && styles.activeTabText]}>Products</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === "need" && styles.activeTab]}
            onPress={() => setActiveTab("need")}
          >
            <Ionicons 
              name="help-circle" 
              size={20} 
              color={activeTab === "need" ? colors.surface : colors.textSecondary} 
            />
            <Text style={[styles.tabText, activeTab === "need" && styles.activeTabText]}>Needs</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === "offer" && styles.activeTab]}
            onPress={() => setActiveTab("offer")}
          >
            <Ionicons 
              name="gift" 
              size={20} 
              color={activeTab === "offer" ? colors.surface : colors.textSecondary} 
            />
            <Text style={[styles.tabText, activeTab === "offer" && styles.activeTabText]}>Offers</Text>
          </TouchableOpacity>
        </View>
      </SlideInView>

      {renderContent()}

      {/* Render both modals */}
      {renderPostModal(false)}
      {renderPostModal(true)}
    </SafeAreaView>
  );
}

// ENHANCED MODERN STYLES with Improved Design
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
    paddingTop: 15,
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
  headerLeft: {
    flex: 1,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.deepBlue,
    letterSpacing: 1,
  },
  headerRight: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: 12,
    padding: 6,
    borderRadius: 10,
    backgroundColor: colors.lightBackground,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginVertical: 15,
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: colors.accent,
  },
  tabText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
    marginLeft: 6,
  },
  activeTabText: {
    color: colors.surface,
  },
  // Enhanced Offer Banner Styles
  offerBanner: {
    marginHorizontal: 20,
    marginVertical: 15,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  offerGradient: {
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  offerContent: {
    flex: 1,
  },
  offerTextContainer: {
    marginBottom: 16,
  },
  offerMainText: {
    color: colors.surface,
    fontSize: 28,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
    marginBottom: 4,
  },
  offerSubtext: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.9,
  },
  offerShopText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '400',
    opacity: 0.8,
    marginTop: 4,
  },
  offerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  offerButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '600',
  },
  // Ads Card Styles
  adsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 16,
    marginHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    width: width - 30,
  },
  adsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: colors.lightBackground,
  },
  adsBadge: {
    backgroundColor: colors.accent,
    color: colors.surface,
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  adsContent: {
    flexDirection: 'row',
    padding: 16,
  },
  adsImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  adsInfo: {
    flex: 1,
  },
  adsProductName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  adsRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  adsRatingText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  adsReviewCount: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  adsPricing: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  adsOriginalPrice: {
    fontSize: 14,
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
    marginRight: 6,
  },
  adsDiscountedPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginRight: 8,
  },
  adsDiscountBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adsDiscountText: {
    color: colors.surface,
    fontSize: 10,
    fontWeight: '600',
  },
  adsDelivery: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  adsShopSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.lightBackground,
  },
  adsShopText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  adsShopNowButton: {
    backgroundColor: colors.accent,
    margin: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  adsShopNowText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '600',
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
    fontSize: 22,
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
  categoryItemSelected: {},
  categoryIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
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
    paddingVertical: 12,
    backgroundColor: colors.lightBackground,
    marginHorizontal: 20,
    borderRadius: 12,
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
  // Enhanced Product Card Styles
  productCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 16,
    width: (width - 45) / 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    overflow: 'hidden',
  },
  productImageContainer: {
    position: 'relative',
    height: 140,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  topBadgesContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
  },
  discountBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  discountText: {
    color: colors.surface,
    fontSize: 10,
    fontWeight: '600',
  },
  saveButtonContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  saveButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  lowStockBadge: {
    backgroundColor: colors.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  lowStockText: {
    color: colors.surface,
    fontSize: 10,
    fontWeight: '600',
  },
  outOfStockBadge: {
    backgroundColor: colors.error,
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
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
    lineHeight: 18,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 4,
  },
  ratingText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  productDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: 8,
  },
  pricingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  originalPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  originalPrice: {
    fontSize: 12,
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
    marginRight: 6,
  },
  discountedPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  productActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartButton: {
    flex: 1,
    backgroundColor: colors.darkButton,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  cartButtonText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  messageButton: {
    backgroundColor: colors.lightBackground,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  // ENHANCED: Completely Restructured Post Card Styles
  postCard: {
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  postUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  postAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postUserDetails: {
    flex: 1,
  },
  postUsername: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  postMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  postTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  postTypeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  postDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  postHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    padding: 4,
    marginRight: 8,
  },
  bookmarkButton: {
    padding: 4,
  },
  actionMenu: {
    backgroundColor: colors.surface,
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  deleteAction: {
    marginTop: 4,
  },
  actionMenuText: {
    fontSize: 14,
    color: colors.textPrimary,
    marginLeft: 8,
  },
  deleteActionText: {
    color: colors.error,
  },
  postContent: {
    padding: 0,
  },
  postImageContainer: {
    height: 200,
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  noImageContainer: {
    backgroundColor: colors.lightBackground,
  },
  noImageGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    marginTop: 8,
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  postTextContent: {
    padding: 16,
  },
  postTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
    lineHeight: 24,
  },
  postDescription: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
    marginBottom: 0,
  },
  postDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.lightBackground,
    gap: 4,
  },
  detailChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 16,
    backgroundColor: colors.surface,
  },
  ownPostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ownPostText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.surface,
  },
  listContent: {
    paddingBottom: 25,
    paddingTop: 8,
  },
  // Enhanced Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  noProducts: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  createFirstPostText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  // Enhanced Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 24,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  closeButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: colors.lightBackground,
  },
  postTypeSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: colors.lightBackground,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  typeButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTypeButton: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  activeTypeButtonText: {
    color: colors.surface,
    fontWeight: '600',
  },
  imageUploadSection: {
    height: 140,
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
  },
  formInput: {
    backgroundColor: colors.lightBackground,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 100,
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
    marginBottom: 24,
  },
  urgencyLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
    marginRight: 16,
  },
  urgencyOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
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
    fontSize: 14,
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
    borderRadius: 14,
    overflow: 'hidden',
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: colors.lightBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  submitButton: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  submitButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 14,
  },
  disabledButton: {
    opacity: 0.6,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 16,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.surface,
  },
});