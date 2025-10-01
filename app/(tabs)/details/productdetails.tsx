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

// Reuse your existing color palette
const colors = {
  primary: 'rgba(23, 104, 217, 1)',
  secondary: 'rgba(144, 186, 242, 1)',
  background: '#ffffff',
  surface: '#ffffff',
  textPrimary: 'rgba(4, 18, 36, 1)',
  textSecondary: 'rgba(4, 18, 36, 0.7)',
  border: 'rgba(144, 186, 242, 0.3)',
  success: 'rgba(23, 104, 217, 1)',
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

// Move isValidUrl outside the component to avoid scope issues
const isValidUrl = (url: string | undefined): url is string => {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  const trimmedUrl = url.trim();
  
  // Check for obviously invalid values
  if (trimmedUrl === '' || 
      trimmedUrl === 'undefined' || 
      trimmedUrl === 'null' ||
      trimmedUrl === 'null' ||
      trimmedUrl.includes('undefined') ||
      trimmedUrl.includes('null')) {
    return false;
  }
  
  // Simple check - if it looks like a URL and contains common image domains
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

  // Parse product data safely
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
  
    // Simple priority check - just like your home page
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
    // Fade in animation
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
          <ActivityIndicator size="large" color={colors.primary} />
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
        onLoad={() => {
          console.log('✅ Image loaded successfully');
          setImageLoading(false);
          setImageError(false);
        }}
        onError={(error) => {
          console.log('❌ Image load error for URL:', imageUrl);
          console.log('Error details:', error.nativeEvent);
          setImageLoading(false);
          setImageError(true);
        }}
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
    // Use the actual image URL that's being displayed
    const currentImageUrl = imageError || !isValidUrl(imageUrl) ? '' : imageUrl;
    
    router.push({
      pathname: '../orders/order-now',
      params: { 
        product: JSON.stringify({
          id: productData!.id,
          name: productData!.name,
          price: productData!.price,
          imageUrl: currentImageUrl,
          image: currentImageUrl, // Pass both for compatibility
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
        {/* Header */}
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
          {/* Product Image */}
          <View style={styles.imageContainer}>
            {renderImageContent()}
            
            {/* Stock Status Badge */}
            {productData.stock === 0 && (
              <View style={styles.outOfStockBadge}>
                <Text style={styles.outOfStockText}>Out of Stock</Text>
              </View>
            )}
          </View>

          {/* Product Info */}
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{productData.name}</Text>
            <Text style={styles.productPrice}>${productData.price}</Text>
            <Text style={styles.productDescription}>{productData.description}</Text>
            
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Ionicons name="pricetag" size={20} color={colors.primary} />
                <Text style={styles.detailLabel}>Category:</Text>
                <Text style={styles.detailValue}>{productData.category}</Text>
              </View>
              
              <View style={styles.detailItem}>
                <Ionicons name="cube" size={20} color={colors.primary} />
                <Text style={styles.detailLabel}>Stock:</Text>
                <Text style={[
                  styles.detailValue, 
                  productData.stock === 0 ? styles.outOfStockValue : styles.inStockValue
                ]}>
                  {productData.stock} available
                </Text>
              </View>
              
              <View style={styles.detailItem}>
                <Ionicons name="business" size={20} color={colors.primary} />
                <Text style={styles.detailLabel}>Type:</Text>
                <Text style={styles.detailValue}>{productData.type}</Text>
              </View>

              {/* Debug info for image fields */}
              <View style={styles.detailItem}>
                <Ionicons name="information-circle" size={20} color={colors.primary} />
                <Text style={styles.detailLabel}>Image Status:</Text>
                <Text style={styles.detailValue}>
                  {isValidUrl(imageUrl) ? 'Available' : 'Not Available'}
                </Text>
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

          {/* Shopkeeper Info */}
          <View style={styles.shopkeeperSection}>
            <Text style={styles.sectionTitle}>Shop Information</Text>
            <View style={styles.shopkeeperInfo}>
              <View style={styles.shopAvatar}>
                <Ionicons name="storefront" size={24} color={colors.primary} />
              </View>
              <View style={styles.shopDetails}>
                <Text style={styles.shopName}>{productData.shopName || 'Local Store'}</Text>
                <Text style={styles.ownerName}>{productData.ownerName || 'Shop Owner'}</Text>
                <Text style={styles.shopLocation}>
                  <Ionicons name="location" size={14} color={colors.textSecondary} />
                  {' '}{productData.location || 'Unknown Location'}
                </Text>
                {productData.phone && (
                  <Text style={styles.shopPhone}>
                    <Ionicons name="call" size={14} color={colors.textSecondary} />
                    {' '}{productData.phone}
                  </Text>
                )}
                {productData.email && (
                  <Text style={styles.shopEmail}>
                    <Ionicons name="mail" size={14} color={colors.textSecondary} />
                    {' '}{productData.email}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionBar}>
          <TouchableOpacity 
            style={styles.messageButton}
            onPress={handleMessageShopkeeper}
          >
            <Ionicons name="chatbubble-ellipses" size={20} color={colors.primary} />
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
              {productData.stock === 0 ? 'Out of Stock' : 'Order Now'}
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
    marginTop:27,
    paddingBottom:38
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  headerRight: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    width: width,
    height: width,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imageLoader: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: colors.textSecondary,
    fontSize: 14,
  },
  imageError: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  imageErrorText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 10,
    textAlign: 'center',
  },
  imageErrorSubText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 5,
    textAlign: 'center',
  },
  outOfStockBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    zIndex: 10,
  },
  outOfStockText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  productInfo: {
    padding: 16,
  },
  productName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 16,
  },
  productDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 20,
  },
  detailsGrid: {
    backgroundColor: 'rgba(144, 186, 242, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
    marginRight: 4,
    fontWeight: '500',
    width: 100,
  },
  detailValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  inStockValue: {
    color: colors.success,
  },
  outOfStockValue: {
    color: '#FF3B30',
  },
  dateContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  dateText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  shopkeeperSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  shopkeeperInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(144, 186, 242, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  shopAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(144, 186, 242, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  shopDetails: {
    flex: 1,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  ownerName: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  shopLocation: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  shopPhone: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  shopEmail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  actionBar: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(144, 186, 242, 0.2)',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    marginRight: 8,
  },
  messageButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  orderButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
  },
  disabledOrderButton: {
    backgroundColor: '#C7C7CC',
  },
  orderButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 20,
    color: colors.textPrimary,
    marginBottom: 10,
    marginTop: 10,
    textAlign: 'center',
  },
  errorSubText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  backButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
});

