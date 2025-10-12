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
  Dimensions,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Use the SAME color palette from previous pages
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
  gradientPrimary: ['#5f73ccff', '#b8df2cff'] as const,
  gradientSecondary: ['#9776d3ff', '#f5576c'] as const,
  gradientSuccess: ['#10b981', '#34d399'] as const,
  gradientWarning: ['#f59e0b', '#fbbf24'] as const,
  gradientNeed: ['#8b5cf6', '#a78bfa'] as const,
  gradientOffer: ['#06b6d4', '#22d3ee'] as const,
  needCard: 'rgba(139, 92, 246, 0.08)',
  offerCard: 'rgba(6, 182, 212, 0.08)',
  lightBackground: 'rgba(226, 232, 240, 0.4)',
  electricPurple: '#7bf65cff',
  deepBlue: '#1e40af',
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
  isSpecialOffer?: boolean;
};

const isValidUrl = (url: string | undefined | null): boolean => {
  if (!url || typeof url !== 'string') return false;
  const trimmedUrl = url.trim();
  return trimmedUrl.startsWith('http') && 
         (trimmedUrl.includes('.') || trimmedUrl.includes('//'));
};

export default function OfferDetails() {
  const { offer } = useLocalSearchParams();
  const router = useRouter();
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [saved, setSaved] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.95));

  let offerData: Offer | null = null;
  try {
    offerData = offer ? JSON.parse(offer as string) : null;
    console.log('🔍 Offer Details - Parsed offer data:', offerData);
  } catch (error) {
    console.error('❌ Error parsing offer data:', error);
    offerData = null;
  }

  const getImageUrl = (): string => {
    if (!offerData || !offerData.imageUrl || !isValidUrl(offerData.imageUrl)) {
      return 'https://via.placeholder.com/400x300?text=No+Image+Available';
    }
    return offerData.imageUrl;
  };

  const imageUrl = getImageUrl();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const handleSave = () => {
    setSaved(!saved);
    // Show feedback to user
    Alert.alert(
      saved ? 'Removed from Saved' : 'Saved Offer',
      saved ? 'Offer removed from your saved items' : 'Offer saved to your favorites!',
      [{ text: 'OK' }]
    );
  };

  const handleShare = () => {
    // Implement share functionality
    Alert.alert(
      'Share Offer',
      'Share this amazing offer with your friends!',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Share', style: 'default' }
      ]
    );
  };

  const calculateDiscount = () => {
    if (offerData?.originalPrice && offerData?.discountPrice) {
      const discount = ((offerData.originalPrice - offerData.discountPrice) / offerData.originalPrice) * 100;
      return Math.round(discount);
    }
    return 0;
  };

  const formatDate = (date: any) => {
    try {
      if (date?.toDate) {
        return date.toDate().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
      return new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatTimeLeft = (date: any) => {
    try {
      let expiryDate;
      if (date?.toDate) {
        expiryDate = date.toDate();
      } else {
        expiryDate = new Date(date);
      }
      
      const now = new Date();
      const diffTime = expiryDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return 'Expired';
      if (diffDays === 0) return 'Expires today';
      if (diffDays === 1) return '1 day left';
      return `${diffDays} days left`;
    } catch (error) {
      return 'Unknown';
    }
  };

  const renderImageContent = () => {
    if (imageError) {
      return (
        <View style={styles.imageError}>
          <Ionicons name="flash-outline" size={60} color={colors.textSecondary} />
          <Text style={styles.imageErrorText}>Offer image not available</Text>
        </View>
      );
    }

    return (
      <>
        <Image 
          source={{ uri: imageUrl }}
          style={styles.offerImage}
          resizeMode="cover"
          onLoadStart={() => setImageLoading(true)}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
        {imageLoading && (
          <View style={styles.imageLoader}>
            <ActivityIndicator size="large" color={colors.offerColor} />
            <Text style={styles.loadingText}>Loading offer image...</Text>
          </View>
        )}
      </>
    );
  };

  if (!offerData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={80} color={colors.textSecondary} />
          <Text style={styles.errorTitle}>Offer Not Found</Text>
          <Text style={styles.errorText}>The offer you're looking for is not available.</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color={colors.surface} />
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const discountPercentage = calculateDiscount();
  const timeLeft = formatTimeLeft(offerData.expiryDate);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.animatedContainer, { 
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }]
      }]}>
        
        {/* Header with Back Button and Actions */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Special Offer</Text>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerActionButton} onPress={handleSave}>
              <Ionicons 
                name={saved ? "heart" : "heart-outline"} 
                size={24} 
                color={saved ? colors.error : colors.textPrimary} 
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerActionButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          
          {/* Image Section with Badges */}
          <View style={styles.imageCard}>
            <View style={styles.imageContainer}>
              {renderImageContent()}
              
              {/* Discount Badge */}
              <View style={styles.discountBadge}>
                <Ionicons name="flash" size={20} color="white" />
                <Text style={styles.discountBadgeText}>{discountPercentage}% OFF</Text>
              </View>
              
              {/* Status Badge */}
              <View style={[
                styles.statusBadge,
                offerData.isExpired ? styles.expiredBadge : styles.activeBadge
              ]}>
                <Text style={styles.statusBadgeText}>
                  {offerData.isExpired ? 'EXPIRED' : 'ACTIVE'}
                </Text>
              </View>
            </View>
          </View>

          {/* Offer Details Card */}
          <View style={styles.detailsCard}>
            <Text style={styles.offerTitle}>{offerData.title}</Text>
            
            {/* Pricing Section */}
            <View style={styles.pricingSection}>
              {offerData.originalPrice && (
                <Text style={styles.originalPrice}>₹{offerData.originalPrice}</Text>
              )}
              <Text style={styles.discountPrice}>₹{offerData.discountPrice}</Text>
              <View style={styles.saveAmount}>
                <Ionicons name="wallet-outline" size={16} color={colors.success} />
                <Text style={styles.saveAmountText}>
                  Save ₹{offerData.originalPrice ? offerData.originalPrice - offerData.discountPrice : 0}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Offer Description */}
            <Text style={styles.sectionLabel}>About this Offer</Text>
            <Text style={styles.offerDescription}>{offerData.description}</Text>

            <View style={styles.divider} />

            {/* Offer Details Grid */}
            <View style={styles.detailsGrid}>
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <View style={[styles.detailIcon, { backgroundColor: colors.offerColor + '20' }]}>
                    <Ionicons name="calendar" size={20} color={colors.offerColor} />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Expiry Date</Text>
                    <Text style={[
                      styles.detailValue,
                      offerData.isExpired && styles.expiredText
                    ]}>
                      {formatDate(offerData.expiryDate)}
                    </Text>
                    <Text style={[
                      styles.timeLeftText,
                      offerData.isExpired ? styles.expiredTimeText : styles.activeTimeText
                    ]}>
                      {timeLeft}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailItem}>
                  <View style={[styles.detailIcon, { backgroundColor: colors.accent + '20' }]}>
                    <Ionicons name="pricetag" size={20} color={colors.accent} />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Category</Text>
                    <Text style={styles.detailValue}>{offerData.category}</Text>
                  </View>
                </View>
              </View>

              {/* Tags */}
              {offerData.tags && offerData.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  <Text style={styles.tagsLabel}>Tags</Text>
                  <View style={styles.tagsList}>
                    {offerData.tags.map((tag, index) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Terms & Conditions */}
            {offerData.terms && (
              <>
                <View style={styles.divider} />
                <View style={styles.termsSection}>
                  <Text style={styles.sectionLabel}>Terms & Conditions</Text>
                  <Text style={styles.termsText}>{offerData.terms}</Text>
                </View>
              </>
            )}
          </View>

          {/* Shop Information Card */}
          <View style={styles.shopCard}>
            <Text style={styles.sectionTitle}>Shop Information</Text>
            <View style={styles.shopInfo}>
              <View style={styles.shopAvatar}>
                <Ionicons name="storefront" size={28} color={colors.offerColor} />
              </View>
              <View style={styles.shopDetails}>
                <Text style={styles.shopName}>{offerData.shopName}</Text>
                <Text style={styles.shopOwner}>by {offerData.shopkeeperName}</Text>
                <View style={styles.shopLocation}>
                  <Ionicons name="location" size={14} color={colors.textSecondary} />
                  <Text style={styles.locationText}>
                    {offerData.location || 'Multiple locations available'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.viewShopButton}>
                <Ionicons name="arrow-forward" size={20} color={colors.offerColor} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Safety Information */}
          <View style={styles.safetyCard}>
            <View style={styles.safetyHeader}>
              <Ionicons name="shield-checkmark" size={24} color={colors.success} />
              <Text style={styles.safetyTitle}>Trust & Safety</Text>
            </View>
            <View style={styles.safetyFeatures}>
              <View style={styles.safetyFeature}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={styles.safetyText}>Verified Shop</Text>
              </View>
              <View style={styles.safetyFeature}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={styles.safetyText}>Authentic Offer</Text>
              </View>
              <View style={styles.safetyFeature}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={styles.safetyText}>Secure Transaction</Text>
              </View>
            </View>
          </View>

        </ScrollView>

        {/* Action Bar */}
        <View style={styles.actionBar}>
          <TouchableOpacity 
            style={[
              styles.primaryButton,
              offerData.isExpired && styles.disabledButton
            ]}
            onPress={() => {
              if (!offerData.isExpired) {
                Alert.alert(
                  'Redeem Offer',
                  'Show this offer at the shop to get your discount!',
                  [{ text: 'OK' }]
                );
              }
            }}
            disabled={offerData.isExpired}
          >
            <Ionicons 
              name={offerData.isExpired ? "time-outline" : "flash"} 
              size={20} 
              color={colors.surface} 
            />
            <Text style={styles.primaryButtonText}>
              {offerData.isExpired ? 'Offer Expired' : 'Redeem Offer'}
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
  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
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
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.lightBackground,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.lightBackground,
  },
  scrollView: {
    flex: 1,
  },
  // Card Styles
  imageCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 20,
    padding: 0,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  detailsCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 20,
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
  shopCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 20,
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
  safetyCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginVertical: 8,
    marginBottom: 100,
    borderRadius: 20,
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
  // Image Section
  imageContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.lightBackground,
    position: 'relative',
    height: 280,
  },
  offerImage: {
    width: '100%',
    height: '100%',
  },
  imageLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.lightBackground,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  imageError: {
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.lightBackground,
  },
  imageErrorText: {
    marginTop: 12,
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  // Badges
  discountBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  discountBadgeText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  activeBadge: {
    backgroundColor: colors.success,
  },
  expiredBadge: {
    backgroundColor: colors.error,
  },
  statusBadgeText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Offer Content
  offerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
    lineHeight: 34,
  },
  pricingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  originalPrice: {
    fontSize: 20,
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
    fontWeight: '600',
  },
  discountPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.offerColor,
  },
  saveAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  saveAmountText: {
    color: colors.success,
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 20,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  offerDescription: {
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 24,
    marginBottom: 8,
  },
  // Details Grid
  detailsGrid: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 16,
  },
  detailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  detailIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
  },
  timeLeftText: {
    fontSize: 12,
    fontWeight: '500',
  },
  activeTimeText: {
    color: colors.warning,
  },
  expiredTimeText: {
    color: colors.error,
  },
  expiredText: {
    color: colors.error,
  },
  // Tags
  tagsContainer: {
    marginTop: 8,
  },
  tagsLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: colors.accentLight + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.accentLight,
  },
  tagText: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '500',
  },
  // Terms Section
  termsSection: {
    marginTop: 8,
  },
  termsText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  // Shop Information
  shopInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  shopAvatar: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: colors.offerColor + '20',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.offerColor + '40',
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
  shopOwner: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  shopLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  viewShopButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.lightBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Safety Information
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  safetyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  safetyFeatures: {
    gap: 12,
  },
  safetyFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  safetyText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  // Action Bar
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: colors.offerColor,
    gap: 8,
    shadowColor: colors.offerColor,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledButton: {
    backgroundColor: colors.textSecondary,
    shadowColor: colors.textSecondary,
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Error State
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 20,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  backButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});