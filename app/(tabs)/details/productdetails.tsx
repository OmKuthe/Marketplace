

import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  Image,
  View,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { conversationService } from '@/utils/conversationService';

const { width } = Dimensions.get('window');

// UPDATED: Use the EXACT SAME color palette from Homepage
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
  rating?: number;
  reviewCount?: number;
};

const isValidUrl = (url: string | undefined): url is string => {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  const trimmedUrl = url.trim();
  
  if (trimmedUrl === '' || 
      trimmedUrl === 'undefined' || 
      trimmedUrl === 'null' ||
      trimmedUrl.includes('undefined') ||
      trimmedUrl.includes('null')) {
    return false;
  }
  
  const looksLikeUrl = trimmedUrl.startsWith('http') && 
                      (trimmedUrl.includes('.') || trimmedUrl.includes('//'));
  
  return looksLikeUrl;
};

// NEW: Star Rating Component (from Homepage)
const StarRating = ({ rating, size = 18 }: { rating: number; size?: number }) => {
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

export default function ProductDetails() {
  const { product } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [productData, setProductData] = useState<Product | null>(null);
  const [saved, setSaved] = useState(false);

  // Parse product data from navigation params
  useEffect(() => {
    console.log('🔍 Received product params:', product);
    
    if (product) {
      try {
        const parsedProduct = typeof product === 'string' ? JSON.parse(product) : product;
        console.log('✅ Successfully parsed product:', parsedProduct);
        setProductData(parsedProduct);
      } catch (error) {
        console.error('❌ Error parsing product data:', error);
        // Try alternative parsing for array format
        if (Array.isArray(product)) {
          try {
            const parsedProduct = JSON.parse(product[0]);
            console.log('✅ Successfully parsed product from array:', parsedProduct);
            setProductData(parsedProduct);
          } catch (secondError) {
            console.error('❌ Error parsing product from array:', secondError);
          }
        }
      }
    } else {
      console.log('❌ No product data received');
    }
  }, [product]);

  const getImageUrl = (): string => {
    if (!productData) {
      return 'https://via.placeholder.com/400x300?text=No+Image+Available';
    }
  
    if (productData.imageUrl && isValidUrl(productData.imageUrl)) {
      console.log('✅ Using imageUrl:', productData.imageUrl);
      return productData.imageUrl;
    }
    
    if (productData.image && isValidUrl(productData.image)) {
      console.log('✅ Using image:', productData.image);
      return productData.image;
    }
  
    console.log('❌ No valid image found, using placeholder');
    return 'https://via.placeholder.com/400x300?text=No+Image+Available';
  };

  const imageUrl = productData ? getImageUrl() : '';

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleImageLoad = () => {
    console.log('✅ Image loaded successfully');
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    console.log('❌ Image failed to load');
    setImageLoading(false);
    setImageError(true);
  };

  // NEW: Function to handle shop card click and redirect to shop page
  const handleShopCardPress = () => {
    if (!productData) return;

    const shopId = productData.shopkeeperId || productData.shopId;
    
    if (!shopId) {
      Alert.alert('Error', 'Shop information not available');
      return;
    }

    console.log('🔄 Navigating to shop page with ID:', shopId);
    
    router.push({
      pathname: "../details/shop",
      params: {
        shopId: shopId,
        shopName: productData.shopName || 'Local Store',
        ownerName: productData.ownerName || 'Shop Owner',
        email: productData.email || '',
        phone: productData.phone || '',
        location: productData.location || 'Unknown Location',
        // Add any other shop details you want to pass
      }
    });
  };

  // UPDATED: Enhanced Image Content with Homepage Style
  const renderImageContent = () => {
    if (!productData) return null;

    if (!imageUrl) {
      return (
        <View style={styles.imageLoader}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Loading image...</Text>
        </View>
      );
    }
  
    if (imageError) {
      return (
        <View style={styles.imageError}>
          <Ionicons name="image-outline" size={50} color={colors.textSecondary} />
          <Text style={styles.imageErrorText}>Image not available</Text>
        </View>
      );
    }

    return (
      <View style={styles.imageContainer}>
        <Image 
          source={{ 
            uri: imageUrl,
            cache: 'force-cache'
          }} 
          style={styles.productImage}
          resizeMode="cover"
          onLoadStart={() => {
            console.log('🔄 Starting to load image:', imageUrl);
            setImageLoading(true);
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
        
        {/* UPDATED: Top Badges Container - MATCHING HOMEPAGE */}
        <View style={styles.topBadgesContainer}>
          {/* Stock Status Badge */}
          {productData.stock === 0 && (
            <View style={styles.outOfStockBadge}>
              <Text style={styles.outOfStockText}>Out of Stock</Text>
            </View>
          )}
          {productData.stock < 10 && productData.stock > 0 && (
            <View style={styles.lowStockBadge}>
              <Text style={styles.lowStockText}>Low Stock</Text>
            </View>
          )}
        </View>
        
        {/* UPDATED: Favorite Button - MATCHING HOMEPAGE */}
        <TouchableOpacity style={styles.saveButton} onPress={() => setSaved(!saved)}>
          <Ionicons 
            name={saved ? "heart" : "heart-outline"} 
            size={20} 
            color={saved ? colors.error : colors.surface} 
          />
        </TouchableOpacity>
      </View>
    );
  };

  const handleOrderNow = () => {
    if (!productData) return;

    const currentImageUrl = imageError || !isValidUrl(imageUrl) ? '' : imageUrl;
    
    router.push({
      pathname: '../orders/order-now',
      params: { 
        product: JSON.stringify({
          id: productData.id,
          name: productData.name,
          price: productData.price,
          imageUrl: currentImageUrl,
          image: currentImageUrl,
          shopName: productData.shopName || 'Local Store',
          shopId: productData.shopId || 'shop-001',
          description: productData.description,
          stock: productData.stock
        })
      }
    });
  };

  const handleMessageShopkeeper = async () => {
    if (!user) {
      Alert.alert('Error', 'Please log in to send messages');
      return;
    }

    if (!productData) return;

    try {
      const shopkeeperId = productData.shopkeeperId || productData.shopId;
      
      if (!shopkeeperId) {
        Alert.alert('Error', 'Unable to identify the shopkeeper');
        return;
      }

      const conversationId = await conversationService.findOrCreateConversation(user.uid, shopkeeperId);
      await conversationService.sendInitialMessage(conversationId, user.uid, productData);
      router.push(`/chat/${conversationId}`);
      
    } catch (error) {
      console.error('Error starting conversation:', error);
      Alert.alert('Error', 'Failed to start conversation. Please try again.');
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown date';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Unknown date';
    }
  };

  // Mock data for e-commerce features (matching homepage)
  const discountPercentage = productData ? Math.floor(Math.random() * 50) + 10 : 0;
  const originalPrice = productData ? Math.round(productData.price * (1 + discountPercentage / 100)) : 0;
  const rating = productData?.rating ? parseFloat(productData.rating.toFixed(1)) : 4.5;
  const reviewCount = productData?.reviewCount || Math.floor(Math.random() * 100) + 1;

  if (!productData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color={colors.textSecondary} />
          <Text style={styles.errorText}>Product not found</Text>
          <Text style={styles.errorSubText}>The product you're looking for doesn't exist or has been removed.</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim }]}>
        {/* UPDATED: Header - MATCHING HOMEPAGE STYLE */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Product Details</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* UPDATED: Product Image Card with Homepage Style */}
          <View style={styles.imageCard}>
            {renderImageContent()}
          </View>

          {/* UPDATED: Product Info Card - RESTRUCTURED */}
          <View style={styles.card}>
            <View style={styles.productHeader}>
              <Text style={styles.productName}>{productData.name}</Text>
              
              {/* UPDATED: Rating Section - MATCHING HOMEPAGE */}
              <View style={styles.ratingContainer}>
                <StarRating rating={rating} />
                <Text style={styles.ratingText}>({rating.toFixed(1)})</Text>
                <Text style={styles.reviewCount}>({reviewCount} reviews)</Text>
              </View>

              {/* UPDATED: Pricing Row - MATCHING HOMEPAGE */}
              <View style={styles.pricingContainer}>
                <View style={styles.originalPriceContainer}>
                  <Text style={styles.originalPrice}>${originalPrice}</Text>
                  <Text style={styles.discountedPrice}>${productData.price}</Text>
                </View>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>✔ {discountPercentage}% OFF</Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />
            
            <Text style={styles.sectionLabel}>Description</Text>
            <Text style={styles.productDescription}>
              {productData.description || 'No description available.'}
            </Text>
            
            <View style={styles.divider} />
            
            {/* UPDATED: Details Grid - ENHANCED STYLING */}
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <View style={styles.detailIcon}>
                  <Ionicons name="pricetag" size={16} color={colors.textSecondary} />
                </View>
                <Text style={styles.detailLabel}>Category</Text>
                <Text style={styles.detailValue}>{productData.category || 'General'}</Text>
              </View>
              
              <View style={styles.detailItem}>
                <View style={styles.detailIcon}>
                  <Ionicons name="cube" size={16} color={colors.textSecondary} />
                </View>
                <Text style={styles.detailLabel}>Stock</Text>
                <Text style={[
                  styles.detailValue, 
                  productData.stock === 0 ? styles.outOfStockValue : styles.inStockValue
                ]}>
                  {productData.stock} available
                </Text>
              </View>
              
              <View style={styles.detailItem}>
                <View style={styles.detailIcon}>
                  <Ionicons name="business" size={16} color={colors.textSecondary} />
                </View>
                <Text style={styles.detailLabel}>Type</Text>
                <Text style={styles.detailValue}>{productData.type || 'Product'}</Text>
              </View>
            </View>

            {productData.createdAt && (
              <View style={styles.dateContainer}>
                <Text style={styles.dateText}>
                  Listed on: {formatDate(productData.createdAt)}
                </Text>
              </View>
            )}
          </View>

          {/* UPDATED: Shopkeeper Info Card - ENHANCED & CLICKABLE */}
          <TouchableOpacity 
            style={styles.card} 
            onPress={handleShopCardPress}
            activeOpacity={0.7}
          >
            <View style={styles.shopHeader}>
              <Text style={styles.sectionTitle}>Shop Information</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </View>
            <View style={styles.shopkeeperInfo}>
              <View style={styles.shopAvatar}>
                <Ionicons name="storefront" size={24} color={colors.accent} />
              </View>
              <View style={styles.shopDetails}>
                <Text style={styles.shopName}>{productData.shopName || 'Local Store'}</Text>
                <Text style={styles.ownerName}>{productData.ownerName || 'Shop Owner'}</Text>
                <View style={styles.shopContactInfo}>
                  <Ionicons name="location" size={14} color={colors.textSecondary} />
                  <Text style={styles.shopLocation}>
                    {productData.location || 'Unknown Location'}
                  </Text>
                </View>
                {productData.phone && (
                  <View style={styles.shopContactInfo}>
                    <Ionicons name="call" size={14} color={colors.textSecondary} />
                    <Text style={styles.shopPhone}>{productData.phone}</Text>
                  </View>
                )}
                {productData.email && (
                  <View style={styles.shopContactInfo}>
                    <Ionicons name="mail" size={14} color={colors.textSecondary} />
                    <Text style={styles.shopEmail}>{productData.email}</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.shopFooter}>
              <Text style={styles.viewShopText}>Tap to view shop details →</Text>
            </View>
          </TouchableOpacity>

          {/* UPDATED: Special Offers Section - MATCHING HOMEPAGE STYLE */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Special Offers</Text>
            <View style={styles.offerItem}>
              <View style={[styles.offerBadge, { backgroundColor: colors.success }]}>
                <Text style={styles.offerBadgeText}>SAVE</Text>
              </View>
              <Text style={styles.offerText}>Free shipping on orders over $50</Text>
            </View>
            <View style={styles.offerItem}>
              <View style={[styles.offerBadge, { backgroundColor: colors.accent }]}>
                <Text style={styles.offerBadgeText}>DEAL</Text>
              </View>
              <Text style={styles.offerText}>Buy 2 get 1 free on selected items</Text>
            </View>
            <View style={styles.offerItem}>
              <View style={[styles.offerBadge, { backgroundColor: colors.warning }]}>
                <Text style={styles.offerBadgeText}>HOT</Text>
              </View>
              <Text style={styles.offerText}>Limited time discount - {discountPercentage}% OFF</Text>
            </View>
          </View>
        </ScrollView>

        {/* UPDATED: Action Buttons - MATCHING HOMEPAGE STYLE */}
        <View style={styles.actionBar}>
          <TouchableOpacity 
            style={styles.messageButton}
            onPress={handleMessageShopkeeper}
          >
            <Ionicons name="chatbubble-ellipses" size={20} color={colors.accent} />
            <Text style={styles.messageButtonText}>Message</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.orderButton,
              productData.stock === 0 && styles.disabledOrderButton
            ]}
            onPress={handleOrderNow}
            disabled={productData.stock === 0}
          >
            <Ionicons name="cart" size={20} color="white" />
            <Text style={styles.orderButtonText}>
              {productData.stock === 0 ? 'Out of Stock' : 'Buy Now'}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

// UPDATED: ENHANCED MODERN STYLES with HOMEPAGE CONSISTENCY
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  animatedContainer: {
    flex: 1,
  },
  // UPDATED: Header - MATCHING HOMEPAGE
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  headerRight: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  // UPDATED: Card Styles - MATCHING HOMEPAGE
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  imageCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 0,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  imageContainer: {
    position: 'relative',
    height: 300,
    backgroundColor: colors.background,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  // UPDATED: Top Badges Container - MATCHING HOMEPAGE
  topBadgesContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
  },
  outOfStockBadge: {
    backgroundColor: colors.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  outOfStockText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  lowStockBadge: {
    backgroundColor: colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  lowStockText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  discountBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  discountText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  saveButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  imageLoader: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 8,
    color: colors.textSecondary,
    fontSize: 14,
  },
  imageError: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  imageErrorText: {
    marginTop: 8,
    color: colors.textSecondary,
    fontSize: 14,
  },
  // UPDATED: Product Header - RESTRUCTURED
  productHeader: {
    marginBottom: 16,
  },
  productName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
    lineHeight: 28,
  },
  // UPDATED: Rating Section - MATCHING HOMEPAGE
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 6,
  },
  ratingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 4,
    fontWeight: '500',
  },
  reviewCount: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 4,
    fontWeight: '500',
  },
  // UPDATED: Pricing Container - MATCHING HOMEPAGE
  pricingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  originalPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  originalPrice: {
    fontSize: 18,
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
    marginRight: 8,
    fontWeight: '500',
  },
  discountedPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.success,
  },
  productDescription: {
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 24,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  // UPDATED: Details Grid - ENHANCED
  detailsGrid: {
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lightBackground,
    borderRadius: 8,
    marginRight: 12,
  },
  detailLabel: {
    fontSize: 15,
    color: colors.textSecondary,
    width: 80,
    marginRight: 12,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  inStockValue: {
    color: colors.success,
  },
  outOfStockValue: {
    color: colors.error,
  },
  dateContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dateText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  // NEW: Shop Header with Chevron
  shopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  // UPDATED: Shopkeeper Info - ENHANCED
  shopkeeperInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  shopAvatar: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: colors.lightBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  shopDetails: {
    flex: 1,
  },
  shopName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  ownerName: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 12,
    fontWeight: '500',
  },
  shopContactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  shopLocation: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
    fontWeight: '500',
  },
  shopPhone: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
    fontWeight: '500',
  },
  shopEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
    fontWeight: '500',
  },
  // NEW: Shop Footer with tap indicator
  shopFooter: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  viewShopText: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '600',
  },
  // UPDATED: Offer Items - MATCHING HOMEPAGE STYLE
  offerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  offerBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 12,
  },
  offerBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  offerText: {
    fontSize: 15,
    color: colors.textPrimary,
    flex: 1,
    fontWeight: '500',
  },
  // UPDATED: Action Bar - MATCHING HOMEPAGE STYLE
  actionBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.accent,
    borderRadius: 12,
    gap: 8,
  },
  messageButtonText: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '600',
  },
  orderButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: colors.darkButton,
    borderRadius: 12,
    gap: 8,
  },
  disabledOrderButton: {
    backgroundColor: colors.textSecondary,
  },
  orderButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  backButtonText: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '600',
  },
});