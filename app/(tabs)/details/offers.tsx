import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated
} from "react-native";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { db } from '../../../firebaseConfig';

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
};

// Star Rating Component (for consistency, though offers might not have ratings)
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

// Offer Card Component with Consistent Styling
const OfferCard = React.memo(({ 
  item, 
  index, 
  onViewOfferDetails 
}: { 
  item: Offer; 
  index: number;
  onViewOfferDetails: (offer: Offer) => void;
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [saved, setSaved] = useState(false);
  const [cardAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));

  // Calculate discount percentage
  const discountPercentage = item.originalPrice 
    ? Math.round(((item.originalPrice - item.discountPrice) / item.originalPrice) * 100)
    : 0;

  // Mock rating for consistency (offers might not have actual ratings)
  const rating = 4.5;
  const reviewCount = Math.floor(Math.random() * 100) + 1;

  // Format expiry date
  const formatExpiryDate = (date: any) => {
    try {
      if (date?.toDate) {
        return date.toDate().toLocaleDateString();
      }
      return new Date(date).toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getImageUrl = (): string => {
    return item.imageUrl || '';
  };

  const imageUrl = getImageUrl();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 40,
        delay: index * 80,
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
  };

  const renderImage = () => {
    if (imageUrl && !imageError) {
      return (
        <View style={styles.productImageContainer}>
          <Image 
            source={{ uri: imageUrl }} 
            style={styles.productImage}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
          
          {/* Top Badges Container */}
          <View style={styles.topBadgesContainer}>
            {/* Discount Badge */}
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>🔥 {discountPercentage}% OFF</Text>
            </View>

            {/* Status Badge */}
            {item.isExpired ? (
              <View style={styles.expiredBadge}>
                <Text style={styles.expiredBadgeText}>EXPIRED</Text>
              </View>
            ) : (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>ACTIVE</Text>
              </View>
            )}
          </View>
          
          {/* Favorite Button */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Ionicons 
              name={saved ? "heart" : "heart-outline"} 
              size={20} 
              color={saved ? colors.error : colors.surface} 
            />
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.productImageContainer}>
        <View style={styles.imagePlaceholder}>
          <Ionicons name="flash" size={24} color={colors.offerColor} />
        </View>
        
        {/* Top Badges Container */}
        <View style={styles.topBadgesContainer}>
          {/* Discount Badge */}
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>🔥 {discountPercentage}% OFF</Text>
          </View>

          {/* Status Badge */}
          {item.isExpired ? (
            <View style={styles.expiredBadge}>
              <Text style={styles.expiredBadgeText}>EXPIRED</Text>
            </View>
          ) : (
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>ACTIVE</Text>
            </View>
          )}
        </View>
        
        {/* Favorite Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Ionicons 
            name={saved ? "heart" : "heart-outline"} 
            size={20} 
            color={saved ? colors.error : colors.surface} 
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Animated.View
      style={[
        styles.productCard,
        {
          opacity: cardAnim,
          transform: [
            { scale: scaleAnim },
            {
              translateY: cardAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        },
      ]}
    >
      {renderImage()}
      
      <View style={styles.productInfo}>
        {/* Offer Title */}
        <Text style={styles.productName} numberOfLines={2}>
          {item.title}
        </Text>

        {/* Rating Section - Using mock data for consistency */}
        <View style={styles.ratingContainer}>
          <StarRating rating={rating} />
          <Text style={styles.ratingText}>({rating.toFixed(1)})</Text>
          <Text style={styles.reviewCount}>({reviewCount})</Text>
        </View>

        {/* Shop Name */}
        <Text style={styles.shopNameText} numberOfLines={1}>
          {item.shopName}
        </Text>

        {/* Location
        <Text style={styles.locationText} numberOfLines={1}>
          📍 {item.location || 'Unknown Location'}
        </Text> */}

        {/* Description */}
        <Text style={styles.productDescription} numberOfLines={2}>
          {item.description}
        </Text>
        
        {/* Pricing Row */}
        <View style={styles.pricingContainer}>
          <View style={styles.originalPriceContainer}>
            {item.originalPrice && (
              <Text style={styles.originalPrice}>₹{item.originalPrice}</Text>
            )}
            <Text style={styles.discountedPrice}>₹{item.discountPrice}</Text>
          </View>
        </View>
        
        {/* Expiry Information */}
        <View style={styles.expiryContainer}>
          <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
          <Text style={[
            styles.expiryText,
            item.isExpired ? styles.expiredText : styles.activeExpiryText
          ]}>
            {item.isExpired ? 'Expired' : 'Expires'} {formatExpiryDate(item.expiryDate)}
          </Text>
        </View>
        
        {/* Action Buttons */}
        <View style={styles.productActions}>
          <TouchableOpacity 
            style={[
              styles.cartButton,
              item.isExpired && styles.disabledButton
            ]}
            onPress={() => onViewOfferDetails(item)}
            disabled={item.isExpired}
          >
            <Ionicons name="eye-outline" size={16} color={colors.surface} />
            <Text style={styles.cartButtonText}>
              {item.isExpired ? 'Expired Offer' : 'View Offer'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
});

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<Offer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [categories, setCategories] = useState<string[]>([]);
  const [activeStatus, setActiveStatus] = useState<"all" | "active" | "expired">("all");
  
  const router = useRouter();
  const [fadeAnim] = useState(new Animated.Value(0));

  // Load offers from Firebase
  const loadOffers = async () => {
    try {
      const q = query(collection(db, "offers"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const offersData: Offer[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        
        // Calculate if offer is expired
        let expiryDate = data.expiryDate;
        let isExpired = false;
        
        try {
          if (expiryDate?.toDate) {
            isExpired = expiryDate.toDate() < new Date();
          } else if (expiryDate) {
            isExpired = new Date(expiryDate) < new Date();
          }
        } catch (error) {
          console.log("Error parsing expiry date:", error);
        }

        return {
          id: doc.id,
          shopkeeperId: data.shopkeeperId || '',
          shopkeeperName: data.shopkeeperName || '',
          shopName: data.shopName || '',
          title: data.title || '',
          description: data.description || '',
          originalPrice: data.originalPrice,
          discountPrice: data.discountPrice || 0,
          category: data.category || 'General',
          terms: data.terms,
          imageUrl: data.imageUrl,
          expiryDate: data.expiryDate,
          status: isExpired ? 'EXPIRED' : 'ACTIVE',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          isExpired: isExpired,
          location: data.location,
          tags: data.tags || []
        };
      });
      
      setOffers(offersData);
      setFilteredOffers(offersData);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(offersData.map(offer => offer.category))];
      setCategories(['all', ...uniqueCategories]);
      
      setIsLoading(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();

    } catch (err) {
      console.log("Error loading offers:", err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOffers();
  }, []);

  // Filter offers based on search, category, and status
  useEffect(() => {
    let filtered = offers;
    
    // Apply search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(offer =>
        offer.title?.toLowerCase().includes(searchLower) ||
        offer.description?.toLowerCase().includes(searchLower) ||
        offer.category?.toLowerCase().includes(searchLower) ||
        offer.shopName?.toLowerCase().includes(searchLower) ||
        offer.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply category filter
    if (activeCategory !== "all") {
      filtered = filtered.filter(offer => 
        offer.category?.toLowerCase() === activeCategory.toLowerCase()
      );
    }
    
    // Apply status filter
    if (activeStatus !== "all") {
      filtered = filtered.filter(offer => 
        activeStatus === "active" ? !offer.isExpired : offer.isExpired
      );
    }
    
    setFilteredOffers(filtered);
  }, [searchQuery, activeCategory, activeStatus, offers]);

  const handleViewOfferDetails = (offer: Offer) => {
    router.push({
      pathname: "../details/offerdetails",
      params: {
        offer: JSON.stringify({
          id: offer.id,
          title: offer.title,
          description: offer.description,
          originalPrice: offer.originalPrice,
          discountPrice: offer.discountPrice,
          category: offer.category,
          terms: offer.terms,
          imageUrl: offer.imageUrl,
          expiryDate: offer.expiryDate,
          status: offer.status,
          isExpired: offer.isExpired,
          shopName: offer.shopName,
          shopkeeperName: offer.shopkeeperName,
          location: offer.location,
          tags: offer.tags,
          isSpecialOffer: true
        })
      }
    });
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  // Render offers grid
  const renderOffersGrid = () => (
    <FlatList
      data={filteredOffers}
      keyExtractor={(item) => item.id}
      numColumns={2}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.productsGridContainer}
      style={styles.productsGridFlatList}
      renderItem={({ item, index }) => (
        <OfferCard 
          item={item} 
          index={index}
          onViewOfferDetails={handleViewOfferDetails}
        />
      )}
      ListEmptyComponent={
        searchQuery || activeCategory !== "all" || activeStatus !== "all" ? (
          <View style={styles.noResultsContainer}>
            <Ionicons name="search-outline" size={60} color={colors.textSecondary} />
            <Text style={styles.noResultsText}>No offers found</Text>
            <Text style={styles.noResultsSubText}>
              {searchQuery 
                ? `No results for "${searchQuery}"`
                : activeCategory !== "all" 
                  ? `No offers in ${activeCategory} category`
                  : `No ${activeStatus} offers available`
              }
            </Text>
          </View>
        ) : (
          <View style={styles.initialStateContainer}>
            <Ionicons name="flash-outline" size={80} color={colors.textSecondary} />
            <Text style={styles.initialStateText}>No offers available</Text>
            <Text style={styles.initialStateSubText}>
              Check back later for new special offers
            </Text>
          </View>
        )
      }
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim }]}>
        {/* Consistent Header with Logo and Back Button */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.push('/customer/home' as any)}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>TownMart</Text>
            <Text style={styles.headerSubtitle}>Special Offers</Text>
          </View>
          
          <View style={styles.headerLogoContainer}>
            <Image 
              source={require('../../../assets/images/logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={colors.accent} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search offers, categories, or shops..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              clearButtonMode="while-editing"
              placeholderTextColor={colors.textSecondary}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Status Filters */}
        <View style={styles.statusFilterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusFiltersScroll}>
            {[
              { value: "all", label: "All Offers" },
              { value: "active", label: "Active" },
              { value: "expired", label: "Expired" }
            ].map((status) => (
              <TouchableOpacity
                key={status.value}
                style={[
                  styles.statusOption,
                  activeStatus === status.value && styles.activeStatusOption
                ]}
                onPress={() => setActiveStatus(status.value as any)}
              >
                <Text style={[
                  styles.statusOptionText,
                  activeStatus === status.value && styles.activeStatusOptionText
                ]}>
                  {status.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Category Filters */}
        {categories.length > 0 && (
          <View style={styles.filterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryOption,
                    activeCategory === category && styles.activeCategoryOption
                  ]}
                  onPress={() => setActiveCategory(category)}
                >
                  <Text style={[
                    styles.categoryOptionText,
                    activeCategory === category && styles.activeCategoryOptionText
                  ]}>
                    {category === 'all' ? 'All Categories' : category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Results Count */}
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsCount}>
            {filteredOffers.length} offer{filteredOffers.length !== 1 ? 's' : ''} found
            {activeCategory !== 'all' && ` in ${activeCategory}`}
            {activeStatus !== 'all' && ` (${activeStatus})`}
          </Text>
        </View>

        {/* Offers Grid */}
        <View style={styles.resultsSection}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={styles.loadingText}>Loading offers...</Text>
            </View>
          ) : (
            renderOffersGrid()
          )}
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
  // Updated Header with Back Button and Logo
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 19,
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
  headerLogoContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.lightBackground,
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.deepBlue,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '500',
    marginTop: 2,
  },
  searchContainer: {
    padding: 20,
    paddingBottom: 12,
    backgroundColor: colors.surface,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    padding: 0,
    fontWeight: '500',
  },
  clearButton: {
    padding: 4,
  },
  statusFilterContainer: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statusFiltersScroll: {
    flexDirection: 'row',
  },
  statusOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    backgroundColor: colors.surface,
  },
  activeStatusOption: {
    backgroundColor: colors.offerColor,
    borderColor: colors.offerColor,
  },
  statusOptionText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  activeStatusOptionText: {
    color: colors.surface,
  },
  filterContainer: {
    padding: 16,
    paddingTop: 8,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoriesScroll: {
    flexDirection: 'row',
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    backgroundColor: colors.surface,
  },
  activeCategoryOption: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  categoryOptionText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  activeCategoryOptionText: {
    color: colors.surface,
  },
  resultsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultsCount: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  resultsSection: {
    flex: 1,
    backgroundColor: colors.background,
  },
  productsGridFlatList: {
    flex: 1,
  },
  productsGridContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
    paddingTop: 8,
  },
  // Product Card Styles - Consistent with previous design
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
  activeBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeBadgeText: {
    color: colors.surface,
    fontSize: 10,
    fontWeight: '600',
  },
  expiredBadge: {
    backgroundColor: colors.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  expiredBadgeText: {
    color: colors.surface,
    fontSize: 10,
    fontWeight: '600',
  },
  saveButton: {
    position: 'absolute',
    top: 8,
    right: 8,
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
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.lightBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  productInfo: {
    padding: 12,
    flex: 1,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
    lineHeight: 18,
    minHeight: 36,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
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
  shopNameText: {
    fontSize: 12,
    color: colors.offerColor,
    fontWeight: '500',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  productDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: 8,
    minHeight: 32,
  },
  pricingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  originalPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  originalPrice: {
    fontSize: 12,
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  discountedPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  expiryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  expiryText: {
    fontSize: 11,
    fontWeight: '500',
  },
  activeExpiryText: {
    color: colors.warning,
  },
  expiredText: {
    color: colors.error,
  },
  productActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 36,
  },
  cartButton: {
    flex: 1,
    backgroundColor: colors.darkButton,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    height: 36,
  },
  disabledButton: {
    opacity: 0.6,
  },
  cartButtonText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 20,
    textAlign: 'center',
  },
  noResultsSubText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  initialStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  initialStateText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 20,
    textAlign: 'center',
  },
  initialStateSubText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 20,
  },
});