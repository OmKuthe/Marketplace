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
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const colors = {
  primary: 'rgba(15, 177, 234, 1)',
  primaryLight: 'rgba(15, 177, 234, 0.15)',
  secondary: 'rgba(9, 68, 89, 1)',
  accent: 'rgba(247, 206, 38, 1)',
  background: '#FFFFFF',
  textPrimary: 'rgba(9, 68, 89, 1)',
  textSecondary: 'rgba(9, 68, 89, 0.7)',
  border: '#E0E0E0',
  inputBackground: '#F8F9FA',
  danger: 'rgba(255, 49, 49, 1)',
  success: 'rgba(76, 175, 80, 1)',
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
  shopkeeperId?: string;
  shopId?: string;
  shopName?: string;
  location?: string;
  // Offer specific fields
  originalPrice?: number;
  discountPrice?: number;
  expiryDate?: string;
  terms?: string;
  isExpired?: boolean;
  isSpecialOffer?: boolean;
};

const isValidUrl = (url: string | undefined): boolean => {
  if (!url || typeof url !== 'string') return false;
  const trimmedUrl = url.trim();
  return trimmedUrl.startsWith('http') && 
         (trimmedUrl.includes('.') || trimmedUrl.includes('//'));
};

export default function ShopkeeperProductDetails() {
  const { product } = useLocalSearchParams();
  const router = useRouter();
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  let productData: Product | null = null;
  try {
    productData = product ? JSON.parse(product as string) : null;
    console.log('🔍 Shopkeeper - Parsed product data:', productData);
  } catch (error) {
    console.error('❌ Error parsing product data:', error);
    productData = null;
  }

  const getImageUrl = (): string => {
    if (!productData) {
      return 'https://via.placeholder.com/400x300?text=No+Image+Available';
    }
  
    if (productData.imageUrl && isValidUrl(productData.imageUrl)) {
      return productData.imageUrl;
    }
  
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
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const renderImageContent = () => {
    if (imageError) {
      return (
        <View style={styles.imageError}>
          <Ionicons name="image-outline" size={50} color={colors.textSecondary} />
          <Text style={styles.imageErrorText}>Image not available</Text>
        </View>
      );
    }

    return (
      <>
        <Image 
          source={{ uri: imageUrl }}
          style={styles.productImage}
          resizeMode="cover"
          onLoadStart={() => setImageLoading(true)}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
        {imageLoading && (
          <View style={styles.imageLoader}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
      </>
    );
  };

  if (!productData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color={colors.textSecondary} />
          <Text style={styles.errorText}>Product not found</Text>
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

  const isOffer = productData.isSpecialOffer || productData.type === 'OFFER';
  const isExpired = productData.isExpired;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const calculateDiscount = () => {
    if (productData?.originalPrice && productData?.discountPrice) {
      const discount = ((productData.originalPrice - productData.discountPrice) / productData.originalPrice) * 100;
      return Math.round(discount);
    }
    return 0;
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
          <Text style={styles.headerTitle}>
            {isOffer ? 'Offer Details' : 'Product Details'}
          </Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Image Card */}
          <View style={styles.card}>
            <View style={styles.imageContainer}>
              {renderImageContent()}
              
              {/* Offer Badge */}
              {isOffer && (
                <View style={styles.offerBadge}>
                  <Ionicons name="flash" size={16} color="white" />
                  <Text style={styles.offerBadgeText}>SPECIAL OFFER</Text>
                </View>
              )}
              
              {/* Expired Badge */}
              {isExpired && (
                <View style={styles.expiredBadge}>
                  <Text style={styles.expiredBadgeText}>EXPIRED</Text>
                </View>
              )}
            </View>
          </View>

          {/* Product/Offer Info Card */}
          <View style={styles.card}>
            <Text style={styles.productName}>
              {productData.name}
            </Text>
            
            {/* Pricing Section */}
            {isOffer ? (
              <View style={styles.offerPricing}>
                {productData.originalPrice && (
                  <Text style={styles.originalPrice}>
                    ₹{productData.originalPrice}
                  </Text>
                )}
                <Text style={styles.discountPrice}>
                  ₹{productData.discountPrice || productData.price}
                </Text>
                {calculateDiscount() > 0 && (
                  <View style={styles.discountPercent}>
                    <Text style={styles.discountPercentText}>
                      {calculateDiscount()}% OFF
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <Text style={styles.productPrice}>
                ₹{productData.price}
              </Text>
            )}

            <View style={styles.divider} />
            
            <Text style={styles.sectionLabel}>Description</Text>
            <Text style={styles.productDescription}>
              {productData.description}
            </Text>
            
            <View style={styles.divider} />
            
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Ionicons name="pricetag" size={16} color={colors.textSecondary} />
                <Text style={styles.detailLabel}>Category</Text>
                <Text style={styles.detailValue}>{productData.category}</Text>
              </View>
              
              <View style={styles.detailItem}>
                <Ionicons name="cube" size={16} color={colors.textSecondary} />
                <Text style={styles.detailLabel}>Stock</Text>
                <Text style={[
                  styles.detailValue, 
                  productData.stock === 0 ? styles.outOfStockValue : styles.inStockValue
                ]}>
                  {productData.stock} available
                </Text>
              </View>
              
              <View style={styles.detailItem}>
                <Ionicons name="business" size={16} color={colors.textSecondary} />
                <Text style={styles.detailLabel}>Type</Text>
                <Text style={styles.detailValue}>{productData.type}</Text>
              </View>
            </View>

            {/* Offer Specific Details */}
            {isOffer && productData.expiryDate && (
              <>
                <View style={styles.divider} />
                <View style={styles.offerDetails}>
                  <View style={styles.detailItem}>
                    <Ionicons name="calendar" size={16} color={colors.textSecondary} />
                    <Text style={styles.detailLabel}>Expires</Text>
                    <Text style={[
                      styles.detailValue,
                      isExpired && styles.expiredDateText
                    ]}>
                      {formatDate(productData.expiryDate)}
                      {isExpired && ' (Expired)'}
                    </Text>
                  </View>
                  
                  {productData.terms && (
                    <View style={styles.termsContainer}>
                      <Text style={styles.termsLabel}>Terms & Conditions:</Text>
                      <Text style={styles.termsText}>{productData.terms}</Text>
                    </View>
                  )}
                </View>
              </>
            )}
          </View>

          {/* Shop Information */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Shop Information</Text>
            <View style={styles.shopInfo}>
              <View style={styles.shopAvatar}>
                <Ionicons name="storefront" size={24} color={colors.primary} />
              </View>
              <View style={styles.shopDetails}>
                <Text style={styles.shopName}>{productData.shopName || 'Your Shop'}</Text>
                <Text style={styles.shopLocation}>
                  <Ionicons name="location" size={14} color={colors.textSecondary} />
                  {' '}{productData.location || 'Unknown Location'}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Simple Action Bar - No buying options */}
        <View style={styles.actionBar}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <Text style={styles.closeButtonText}>Close</Text>
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
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  card: {
    backgroundColor: colors.background,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  imageContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.inputBackground,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 300,
  },
  imageLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
  },
  imageError: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
  },
  imageErrorText: {
    marginTop: 8,
    color: colors.textSecondary,
    fontSize: 14,
  },
  offerBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  offerBadgeText: {
    color: colors.secondary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  expiredBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.danger,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  expiredBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  productPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 16,
  },
  offerPricing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  originalPrice: {
    fontSize: 18,
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  discountPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.danger,
  },
  discountPercent: {
    backgroundColor: colors.danger,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountPercentText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
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
    gap: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    width: 80,
  },
  detailValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  inStockValue: {
    color: colors.success,
  },
  outOfStockValue: {
    color: colors.danger,
  },
  expiredDateText: {
    color: colors.danger,
  },
  offerDetails: {
    gap: 12,
  },
  termsContainer: {
    marginTop: 8,
  },
  termsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  termsText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  shopInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shopAvatar: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopDetails: {
    flex: 1,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  shopLocation: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  actionBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  closeButton: {
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});