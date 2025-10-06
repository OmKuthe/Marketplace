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

// Updated color palette based on the shipping list image analysis
const colors = {
  background: '#f5f5f7', // Light grey background
  surface: '#ffffff',     // White cards/sections
  textPrimary: '#1d1d1f', // Dark charcoal for main text
  textSecondary: '#86868b', // Medium grey for secondary text
  accent: '#007aff',      // Vibrant blue for interactive elements
  success: '#34c759',     // Green for prices/success
  border: '#e5e5e7',      // Light grey for borders/dividers
  checkbox: '#007aff',    // Blue for checkboxes
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
};

const isValidUrl = (url: string | undefined): url is string => {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  const trimmedUrl = url.trim();
  
  if (trimmedUrl === '' || 
      trimmedUrl === 'undefined' || 
      trimmedUrl === 'null' ||
      trimmedUrl === 'null' ||
      trimmedUrl.includes('undefined') ||
      trimmedUrl.includes('null')) {
    return false;
  }
  
  const looksLikeUrl = trimmedUrl.startsWith('http') && 
                      (trimmedUrl.includes('.') || trimmedUrl.includes('//'));
  
  return looksLikeUrl;
};

export default function ProductDetails() {
  const { product } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  let productData: Product | null = null;
  try {
    productData = product ? JSON.parse(product as string) : null;
    console.log('🔍 Parsed product data:', productData);
  } catch (error) {
    console.error('❌ Error parsing product data:', error);
    productData = null;
  }

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

  const imageUrl = getImageUrl();

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

  const renderImageContent = () => {
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
    );
  };

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

  const handleOrderNow = () => {
    const currentImageUrl = imageError || !isValidUrl(imageUrl) ? '' : imageUrl;
    
    router.push({
      pathname: '../orders/order-now',
      params: { 
        product: JSON.stringify({
          id: productData!.id,
          name: productData!.name,
          price: productData!.price,
          imageUrl: currentImageUrl,
          image: currentImageUrl,
          shopName: productData!.shopName || 'Local Store',
          shopId: productData!.shopId || 'shop-001',
          description: productData!.description,
          stock: productData!.stock
        })
      }
    });
  };

  const handleMessageShopkeeper = async () => {
    if (!user) {
      Alert.alert('Error', 'Please log in to send messages');
      return;
    }

    try {
      const shopkeeperId = productData!.shopkeeperId || productData!.shopId;
      
      if (!shopkeeperId) {
        Alert.alert('Error', 'Unable to identify the shopkeeper');
        return;
      }

      const conversationId = await conversationService.findOrCreateConversation(user.uid, shopkeeperId);
      await conversationService.sendInitialMessage(conversationId, user.uid, productData!);
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

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim }]}>
        {/* Header - Updated with new design */}
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
          {/* Product Image Card */}
          <View style={styles.card}>
            <View style={styles.imageContainer}>
              {renderImageContent()}
              
              {/* Stock Status Badge */}
              {productData.stock === 0 && (
                <View style={styles.outOfStockBadge}>
                  <Text style={styles.outOfStockText}>Out of Stock</Text>
                </View>
              )}
            </View>
          </View>

          {/* Product Info Card */}
          <View style={styles.card}>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{productData.name}</Text>
              <Text style={styles.productPrice}>${productData.price}</Text>
              
              <View style={styles.divider} />
              
              <Text style={styles.sectionLabel}>Description</Text>
              <Text style={styles.productDescription}>{productData.description}</Text>
              
              <View style={styles.divider} />
              
              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <View style={styles.detailIcon}>
                    <Ionicons name="pricetag" size={16} color={colors.textSecondary} />
                  </View>
                  <Text style={styles.detailLabel}>Category</Text>
                  <Text style={styles.detailValue}>{productData.category}</Text>
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
                  <Text style={styles.detailValue}>{productData.type}</Text>
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
          </View>

          {/* Shopkeeper Info Card */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Shop Information</Text>
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
          </View>

          {/* Special Offers Section - Inspired by the image */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Special Offers</Text>
            <View style={styles.offerItem}>
              <View style={styles.offerBadge}>
                <Text style={styles.offerBadgeText}>SAVE</Text>
              </View>
              <Text style={styles.offerText}>Free shipping on orders over $50</Text>
            </View>
            <View style={styles.offerItem}>
              <View style={styles.offerBadge}>
                <Text style={styles.offerBadgeText}>DEAL</Text>
              </View>
              <Text style={styles.offerText}>Buy 2 get 1 free on selected items</Text>
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons - Updated design */}
        <View style={styles.actionBar}>
          <TouchableOpacity 
            style={styles.messageButton}
            onPress={handleMessageShopkeeper}
          >
            <Ionicons name="chatbubble-ellipses" size={20} color={colors.accent} />
            <Text style={styles.messageButtonText}>Message Shop</Text>
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
              {productData.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  animatedContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  headerRight: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  imageContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.background,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 300,
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
  outOfStockBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  outOfStockText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  productInfo: {
    padding: 0,
  },
  productName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.success,
    marginBottom: 16,
  },
  productDescription: {
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  detailsGrid: {
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailIcon: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
  },
  detailLabel: {
    fontSize: 15,
    color: colors.textSecondary,
    width: 80,
    marginRight: 12,
  },
  detailValue: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  inStockValue: {
    color: colors.success,
  },
  outOfStockValue: {
    color: '#ff3b30',
  },
  dateContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dateText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  shopkeeperSection: {
    marginTop: 8,
  },
  shopkeeperInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  shopAvatar: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  shopDetails: {
    flex: 1,
  },
  shopName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  ownerName: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  shopContactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  shopLocation: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 6,
  },
  shopPhone: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 6,
  },
  shopEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 6,
  },
  offerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  offerBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
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
  },
  actionBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
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
    paddingVertical: 14,
    backgroundColor: colors.accent,
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

