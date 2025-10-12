import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from 'expo-location';
import { Href, useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, orderBy, query } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import MapView, { Marker } from 'react-native-maps';
import { db } from "../../../firebaseConfig";

// Add missing imports and types
import { Linking, Alert } from 'react-native';

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

// Add missing FilterOptions type
type FilterOptions = {
  minPrice: number | null;
  maxPrice: number | null;
  category: string | null;
  itemType: 'all' | 'shops' | 'products';
  sortBy: 'relevance' | 'price-low' | 'price-high' | 'name' | 'newest';
  locationRange: number | null;
};

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

const { width, height } = Dimensions.get('window');

// NEW: Star Rating Component (from Homepage)
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

// UPDATED: Enhanced Product Card Component with CONSISTENT BUTTON HEIGHT
const ProductCard = React.memo(({ 
  item, 
  index, 
  onViewShopDetails, 
  onViewProductDetails 
}: { 
  item: Product | Shop; 
  index: number;
  onViewShopDetails: (shop: Shop) => void;
  onViewProductDetails: (product: Product) => void;
}) => {
  const isShop = 'ownerName' in item && !('description' in item);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [saved, setSaved] = useState(false);
  const [cardAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));

  // Mock data for e-commerce features (for products) - MATCHING HOMEPAGE
  const discountPercentage = Math.floor(Math.random() * 50) + 10;
  const originalPrice = isShop ? 0 : Math.round((item as Product).price * (1 + discountPercentage / 100));
  const rating = isShop ? 4.5 : ((item as Product).rating ? parseFloat((item as Product).rating.toFixed(1)) : 4.5);
  const reviewCount = isShop ? Math.floor(Math.random() * 100) + 1 : ((item as Product).reviewCount || Math.floor(Math.random() * 100) + 1);

  const getImageUrl = (): string => {
    if (isShop) {
      const shop = item as Shop;
      return shop.shopLogo || '';
    } else {
      const product = item as Product;
      return product.imageUrl || product.image || '';
    }
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
          
          {/* UPDATED: Top Badges Container - MATCHING HOMEPAGE */}
          <View style={styles.topBadgesContainer}>
            {/* Discount Badge - For Products Only */}
            {!isShop && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>✔ {discountPercentage}% OFF</Text>
              </View>
            )}

            {/* Stock Badge - For Products Only */}
            {!isShop && (item as Product).stock < 10 && (item as Product).stock > 0 && (
              <View style={styles.lowStockBadge}>
                <Text style={styles.lowStockText}>Low Stock</Text>
              </View>
            )}
            {!isShop && (item as Product).stock === 0 && (
              <View style={styles.outOfStockBadge}>
                <Text style={styles.outOfStockText}>Out of Stock</Text>
              </View>
            )}
          </View>
          
          {/* UPDATED: Favorite Button - MATCHING HOMEPAGE */}
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
          <Ionicons 
            name={isShop ? "storefront" : "cube"} 
            size={24} 
            color={colors.accent} 
          />
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
        {/* Product/Shop Name */}
        <Text style={styles.productName} numberOfLines={2}>
          {isShop ? (item as Shop).shopName : (item as Product).name}
        </Text>

        {/* UPDATED: Rating Section - MATCHING HOMEPAGE */}
        <View style={styles.ratingContainer}>
          <StarRating rating={rating} />
          <Text style={styles.ratingText}>({rating.toFixed(1)})</Text>
          <Text style={styles.reviewCount}>({reviewCount})</Text>
        </View>

        {/* UPDATED: Pricing Row - MATCHING HOMEPAGE WITH INDIAN RUPEE */}
        {!isShop && (item as Product).price && (item as Product).price > 0 && (
          <View style={styles.pricingContainer}>
            <View style={styles.originalPriceContainer}>
              <Text style={styles.originalPrice}>₹{originalPrice}</Text>
              <Text style={styles.discountedPrice}>₹{(item as Product).price}</Text>
            </View>
          </View>
        )}
        
        {/* UPDATED: Action Buttons - FIXED CONSISTENT HEIGHT */}
        <View style={styles.productActions}>
          {isShop ? (
            <TouchableOpacity 
              style={[styles.cartButton, styles.shopButton]}
              onPress={() => onViewShopDetails(item as Shop)}
            >
              <Ionicons name="storefront" size={16} color={colors.surface} />
              <Text style={styles.cartButtonText}>View Shop</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[
                styles.cartButton,
                (item as Product).stock === 0 && styles.disabledButton
              ]}
              onPress={() => onViewProductDetails(item as Product)}
              disabled={(item as Product).stock === 0}
            >
              <Ionicons name="cube" size={16} color={colors.surface} />
              <Text style={styles.cartButtonText}>
                {(item as Product).stock > 0 ? 'View Product' : 'Out of Stock'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Animated.View>
  );
});

// Enhanced Search Screen with Consistent Styling
export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<(Product | Shop)[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [mapView, setMapView] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Product | Shop | null>(null);
  const [locationPermission, setLocationPermission] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({
    minPrice: null,
    maxPrice: null,
    category: null,
    itemType: 'all',
    sortBy: 'relevance',
    locationRange: null
  });
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  
  const router = useRouter();

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];

  // Load initial data
  useEffect(() => {
    const initializeData = async () => {
      if (dataLoaded) return;

      try {
        const savedSearches = await AsyncStorage.getItem("recentSearches");
        if (savedSearches) {
          setRecentSearches(JSON.parse(savedSearches));
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          setLocationPermission(true);
          const location = await Location.getCurrentPositionAsync({});
          setCurrentLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          });
        }

        await loadShops();
        await loadProducts();
        
        setDataLoaded(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();

      } catch (error) {
        console.log("Error initializing data:", error);
      }
    };

    initializeData();
  }, []);

  // Extract available categories
  useEffect(() => {
    const categories = new Set<string>();
    products.forEach(product => {
      if (product.category) {
        categories.add(product.category);
      }
    });
    shops.forEach(shop => {
      if (shop.location) {
        // You could extract location-based categories here if needed
      }
    });
    setAvailableCategories(Array.from(categories));
  }, [products, shops]);

  const loadShops = async () => {
    try {
      const shopsQuery = query(collection(db, "shopkeepers"));
      const snapshot = await getDocs(shopsQuery);
      const shopsData: Shop[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Shop, "id">),
      }));
      setShops(shopsData);
    } catch (err) {
      console.log("Error loading shops:", err);
    }
  };

  const loadProducts = async () => {
    try {
      const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const productsData: Product[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          description: data.description || '',
          price: data.price || 0,
          stock: data.stock || 0,
          category: data.category || 'General',
          type: data.type || 'product',
          imageUrl: data.imageUrl,
          image: data.image,
          createdAt: data.createdAt,
          shopkeeperId: data.shopkeeperId,
          shopId: data.shopId,
          shopName: data.shopName,
          ownerName: data.ownerName,
          location: data.location,
          phone: data.phone,
          email: data.email,
          address: data.address,
          latitude: data.latitude,
          longitude: data.longitude,
          rating: data.rating ? parseFloat(data.rating.toFixed(1)) : 4.5,
          reviewCount: data.reviewCount || Math.floor(Math.random() * 100) + 1
        };
      });
      setProducts(productsData);
    } catch (err) {
      console.log("Error loading products:", err);
    }
  };

  // Add missing filter functions
  const applyFilters = (filters: FilterOptions) => {
    setActiveFilters(filters);
    setFilterModalVisible(false);
    // Trigger search again with new filters
    if (searchQuery.trim()) {
      handleSearch();
    }
  };

  const clearFilters = () => {
    setActiveFilters({
      minPrice: null,
      maxPrice: null,
      category: null,
      itemType: 'all',
      sortBy: 'relevance',
      locationRange: null
    });
  };

  // Optimized search function
  const handleSearch = async (queryText: string = searchQuery) => {
    const searchText = queryText.trim();
    if (!searchText) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    try {
      const updatedSearches = [
        searchText,
        ...recentSearches.filter(s => s !== searchText).slice(0, 4)
      ];
      setRecentSearches(updatedSearches);
      await AsyncStorage.setItem("recentSearches", JSON.stringify(updatedSearches));

      const searchLower = searchText.toLowerCase();
      
      let filteredShops = shops.filter(shop =>
        shop.shopName?.toLowerCase().includes(searchLower) ||
        shop.ownerName?.toLowerCase().includes(searchLower) ||
        shop.location?.toLowerCase().includes(searchLower)
      );

      let filteredProducts = products.filter(product =>
        product.name?.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower) ||
        product.category?.toLowerCase().includes(searchLower)
      );

      // Apply additional filters
      if (activeFilters.itemType !== 'all') {
        if (activeFilters.itemType === 'shops') {
          filteredProducts = [];
        } else if (activeFilters.itemType === 'products') {
          filteredShops = [];
        }
      }

      if (activeFilters.category) {
        filteredProducts = filteredProducts.filter(product => 
          product.category?.toLowerCase() === activeFilters.category?.toLowerCase()
        );
      }

      if (activeFilters.minPrice !== null) {
        filteredProducts = filteredProducts.filter(product => 
          product.price >= activeFilters.minPrice!
        );
      }

      if (activeFilters.maxPrice !== null) {
        filteredProducts = filteredProducts.filter(product => 
          product.price <= activeFilters.maxPrice!
        );
      }

      // Apply sorting
      if (activeFilters.sortBy !== 'relevance') {
        filteredProducts.sort((a, b) => {
          switch (activeFilters.sortBy) {
            case 'price-low':
              return a.price - b.price;
            case 'price-high':
              return b.price - a.price;
            case 'name':
              return a.name.localeCompare(b.name);
            case 'newest':
              return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
            default:
              return 0;
          }
        });
      }

      // Combine results - shops first, then products
      const combinedResults = [...filteredShops, ...filteredProducts];
      setSearchResults(combinedResults);

      console.log(`Found ${combinedResults.length} results for "${searchText}"`);

    } catch (err) {
      console.log("Error searching:", err);
    } finally {
      setIsSearching(false);
    }
  };

  // Optimized search with debounce
  useEffect(() => {
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        handleSearch();
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, activeFilters]);

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedItem(null);
  };

  // Function to handle phone calls
  const handleCall = (phoneNumber: string) => {
    if (!phoneNumber) return;
    
    const phoneUrl = `tel:${phoneNumber}`;
    Linking.canOpenURL(phoneUrl)
      .then(supported => {
        if (supported) {
          Linking.openURL(phoneUrl);
        } else {
          Alert.alert('Error', 'Phone calls are not supported on this device');
        }
      })
      .catch(err => {
        console.log('Error making call:', err);
        Alert.alert('Error', 'Unable to make phone call');
      });
  };

  // Function to navigate to shop details
  const handleViewShopDetails = (shop: Shop) => {
    router.push({
      pathname: "../details/shop",
      params: {
        shopId: shop.id,
        shopName: shop.shopName,
        ownerName: shop.ownerName,
        email: shop.email,
        phone: shop.phone,
        latitude: shop.latitude,
        longitude: shop.longitude,
        location: shop.location,
        shopLogo: shop.shopLogo,
        uid: shop.uid
      }
    });
  };

  const handleViewProductDetails = async (product: Product) => {
    try {
      let shopData = null;
      
      if (product.shopId) {
        try {
          const shopDoc = await getDoc(doc(db, "shopkeepers", product.shopId));
          if (shopDoc.exists()) {
            const shop = shopDoc.data();
            shopData = {
              shopName: shop.shopName,
              ownerName: shop.ownerName,
              location: shop.location,
              phone: shop.phone,
              email: shop.email
            };
          }
        } catch (error) {
          console.log("Error fetching shop details:", error);
        }
      }

      const productImage = product.imageUrl || product.image;

      router.push({
        pathname: "../details/productdetails",
        params: {
          product: JSON.stringify({
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            stock: product.stock || 0,
            category: product.category || 'General',
            type: product.type || 'product',
            imageUrl: productImage,
            image: productImage,
            createdAt: product.createdAt,
            shopkeeperId: product.shopId,
            shopId: product.shopId,
            shopName: shopData?.shopName || product.shopName || 'Local Store',
            ownerName: shopData?.ownerName || 'Shop Owner',
            location: shopData?.location || product.address || 'Unknown Location',
            phone: shopData?.phone || '',
            email: shopData?.email || '',
            rating: product.rating || 4.5,
            reviewCount: product.reviewCount || Math.floor(Math.random() * 100) + 1
          })
        }
      });
    } catch (error) {
      console.log("Error navigating to product details:", error);
      const productImage = product.imageUrl || product.image;
      router.push({
        pathname: "../details/productdetails",
        params: {
          product: JSON.stringify({
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            stock: product.stock || 0,
            category: product.category || 'General',
            type: product.type || 'product',
            imageUrl: productImage,
            image: productImage,
            createdAt: product.createdAt,
            shopkeeperId: product.shopId,
            shopId: product.shopId,
            shopName: product.shopName || 'Local Store',
            ownerName: 'Shop Owner',
            location: product.address || 'Unknown Location',
            phone: '',
            email: '',
            rating: product.rating || 4.5,
            reviewCount: product.reviewCount || Math.floor(Math.random() * 100) + 1
          })
        }
      });
    }
  };

  const getLocationAddress = (item: Product | Shop) => {
    if ('location' in item && item.location) {
      if (item.location.includes('Lat:')) {
        return 'Nearby location';
      }
      return item.location;
    }
    if (item.latitude && item.longitude) {
      return 'Nearby location';
    }
    return "Location not available";
  };

  // Enhanced Filter Modal Component
  const FilterModal = () => {
    const [localFilters, setLocalFilters] = useState<FilterOptions>(activeFilters);

    const handleApply = () => {
      applyFilters(localFilters);
    };

    const handleReset = () => {
      setLocalFilters({
        minPrice: null,
        maxPrice: null,
        category: null,
        itemType: 'all',
        sortBy: 'relevance',
        locationRange: null
      });
    };

    return (
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter & Sort</Text>
              <TouchableOpacity 
                onPress={() => setFilterModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Item Type Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Item Type</Text>
                <View style={styles.filterOptions}>
                  {[
                    { value: 'all', label: 'All Items' },
                    { value: 'shops', label: 'Shops Only' },
                    { value: 'products', label: 'Products Only' }
                  ].map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.filterOption,
                        localFilters.itemType === type.value && styles.activeFilterOption
                      ]}
                      onPress={() => setLocalFilters(prev => ({
                        ...prev,
                        itemType: type.value as any
                      }))}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        localFilters.itemType === type.value && styles.activeFilterOptionText
                      ]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Price Range */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Price Range</Text>
                <View style={styles.priceInputs}>
                  <View style={styles.priceInput}>
                    <Text style={styles.priceLabel}>Min Price</Text>
                    <TextInput
                      style={styles.priceInputField}
                      placeholder="₹0"
                      keyboardType="numeric"
                      value={localFilters.minPrice?.toString() || ''}
                      onChangeText={(text) => setLocalFilters(prev => ({
                        ...prev,
                        minPrice: text ? parseInt(text) : null
                      }))}
                    />
                  </View>
                  <View style={styles.priceInput}>
                    <Text style={styles.priceLabel}>Max Price</Text>
                    <TextInput
                      style={styles.priceInputField}
                      placeholder="₹1000"
                      keyboardType="numeric"
                      value={localFilters.maxPrice?.toString() || ''}
                      onChangeText={(text) => setLocalFilters(prev => ({
                        ...prev,
                        maxPrice: text ? parseInt(text) : null
                      }))}
                    />
                  </View>
                </View>
              </View>

              {/* Category Filter */}
              {availableCategories.length > 0 && (
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Category</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
                    <TouchableOpacity
                      style={[
                        styles.categoryOption,
                        !localFilters.category && styles.activeCategoryOption
                      ]}
                      onPress={() => setLocalFilters(prev => ({ ...prev, category: null }))}
                    >
                      <Text style={[
                        styles.categoryOptionText,
                        !localFilters.category && styles.activeCategoryOptionText
                      ]}>
                        All Categories
                      </Text>
                    </TouchableOpacity>
                    {availableCategories.map((category) => (
                      <TouchableOpacity
                        key={category}
                        style={[
                          styles.categoryOption,
                          localFilters.category === category && styles.activeCategoryOption
                        ]}
                        onPress={() => setLocalFilters(prev => ({ 
                          ...prev, 
                          category: localFilters.category === category ? null : category 
                        }))}
                      >
                        <Text style={[
                          styles.categoryOptionText,
                          localFilters.category === category && styles.activeCategoryOptionText
                        ]}>
                          {category}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Sort Options */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Sort By</Text>
                <View style={styles.sortOptions}>
                  {[
                    { value: 'relevance', label: 'Relevance', icon: 'star' },
                    { value: 'price-low', label: 'Price: Low to High', icon: 'arrow-up' },
                    { value: 'price-high', label: 'Price: High to Low', icon: 'arrow-down' },
                    { value: 'name', label: 'Name', icon: 'text' },
                    { value: 'newest', label: 'Newest First', icon: 'time' }
                  ].map((sort) => (
                    <TouchableOpacity
                      key={sort.value}
                      style={[
                        styles.sortOption,
                        localFilters.sortBy === sort.value && styles.activeSortOption
                      ]}
                      onPress={() => setLocalFilters(prev => ({
                        ...prev,
                        sortBy: sort.value as any
                      }))}
                    >
                      <Ionicons 
                        name={sort.icon as any} 
                        size={16} 
                        color={localFilters.sortBy === sort.value ? colors.surface : colors.accent} 
                      />
                      <Text style={[
                        styles.sortOptionText,
                        localFilters.sortBy === sort.value && styles.activeSortOptionText
                      ]}>
                        {sort.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.resetButton}
                onPress={handleReset}
              >
                <Text style={styles.resetButtonText}>Reset Filters</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.applyButton}
                onPress={handleApply}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const getMapItems = () => {
    if (searchQuery && searchResults.length > 0) {
      return searchResults.filter(item => 
        item.latitude && item.longitude
      );
    }
    return shops.filter(shop => shop.latitude && shop.longitude);
  };

  const mapItems = getMapItems();

  // Check if any filters are active
  const hasActiveFilters = 
    activeFilters.minPrice !== null ||
    activeFilters.maxPrice !== null ||
    activeFilters.category !== null ||
    activeFilters.itemType !== 'all' ||
    activeFilters.sortBy !== 'relevance';

  // FIXED: Render product cards in a FlatList for proper scrolling
  const renderProductGrid = () => (
    <FlatList
      data={searchResults}
      keyExtractor={(item) => item.id}
      numColumns={2}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.productsGridContainer}
      style={styles.productsGridFlatList}
      renderItem={({ item, index }) => (
        <ProductCard 
          item={item} 
          index={index}
          onViewShopDetails={handleViewShopDetails}
          onViewProductDetails={handleViewProductDetails}
        />
      )}
      ListEmptyComponent={
        searchQuery ? (
          <View style={styles.noResultsContainer}>
            <Ionicons name="search-outline" size={60} color={colors.textSecondary} />
            <Text style={styles.noResultsText}>No results found for "{searchQuery}"</Text>
            <Text style={styles.noResultsSubText}>Try different keywords or adjust filters</Text>
          </View>
        ) : (
          <View style={styles.initialStateContainer}>
            <Ionicons name="search-outline" size={80} color={colors.textSecondary} />
            <Text style={styles.initialStateText}>Search for shops or products</Text>
            <Text style={styles.initialStateSubText}>
              Find what you're looking for by typing in the search bar above
            </Text>
          </View>
        )
      }
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim }]}>
        {/* UPDATED: Header with TownMart Logo */}
        <View style={styles.header}>
          <View style={styles.headerLogoContainer}>
            <Image 
              source={require('../../../assets/images/logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>TownMart</Text>
            <Text style={styles.headerSubtitle}>Search</Text>
          </View>
          
          <View style={styles.headerButton} />
        </View>

        {/* Filter Modal */}
        <FilterModal />

        {/* Enhanced Search Bar with Filter Button */}
        <View style={styles.searchContainer}>
          <View style={styles.searchRow}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color={colors.accent} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search shops, products, or locations..."
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
            
            <TouchableOpacity 
              style={[styles.filterButton, hasActiveFilters && styles.activeFilterButton]}
              onPress={() => setFilterModalVisible(true)}
            >
              <Ionicons 
                name="filter" 
                size={20} 
                color={hasActiveFilters ? colors.surface : colors.accent} 
              />
              {hasActiveFilters && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>!</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <View style={styles.activeFiltersContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.activeFiltersScroll}>
                {activeFilters.itemType !== 'all' && (
                  <View style={styles.activeFilterTag}>
                    <Text style={styles.activeFilterTagText}>
                      {activeFilters.itemType === 'shops' ? 'Shops Only' : 'Products Only'}
                    </Text>
                    <TouchableOpacity onPress={() => setActiveFilters(prev => ({ ...prev, itemType: 'all' }))}>
                      <Ionicons name="close" size={14} color={colors.surface} />
                    </TouchableOpacity>
                  </View>
                )}
                {activeFilters.minPrice !== null && (
                  <View style={styles.activeFilterTag}>
                    <Text style={styles.activeFilterTagText}>
                      Min: ₹{activeFilters.minPrice}
                    </Text>
                    <TouchableOpacity onPress={() => setActiveFilters(prev => ({ ...prev, minPrice: null }))}>
                      <Ionicons name="close" size={14} color={colors.surface} />
                    </TouchableOpacity>
                  </View>
                )}
                {activeFilters.maxPrice !== null && (
                  <View style={styles.activeFilterTag}>
                    <Text style={styles.activeFilterTagText}>
                      Max: ₹{activeFilters.maxPrice}
                    </Text>
                    <TouchableOpacity onPress={() => setActiveFilters(prev => ({ ...prev, maxPrice: null }))}>
                      <Ionicons name="close" size={14} color={colors.surface} />
                    </TouchableOpacity>
                  </View>
                )}
                {activeFilters.category && (
                  <View style={styles.activeFilterTag}>
                    <Text style={styles.activeFilterTagText}>
                      {activeFilters.category}
                    </Text>
                    <TouchableOpacity onPress={() => setActiveFilters(prev => ({ ...prev, category: null }))}>
                      <Ionicons name="close" size={14} color={colors.surface} />
                    </TouchableOpacity>
                  </View>
                )}
                <TouchableOpacity onPress={clearFilters} style={styles.clearAllFilters}>
                  <Text style={styles.clearAllFiltersText}>Clear All</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}
        </View>

        {/* Enhanced View Toggle */}
        <View style={styles.viewToggleContainer}>
          <TouchableOpacity 
            style={[styles.viewToggleButton, !mapView && styles.activeViewToggle]}
            onPress={() => setMapView(false)}
          >
            <Ionicons name="list" size={18} color={!mapView ? colors.surface : colors.accent} />
            <Text style={[styles.viewToggleText, !mapView && styles.activeViewToggleText]}>List</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.viewToggleButton, mapView && styles.activeViewToggle]}
            onPress={() => setMapView(true)}
          >
            <Ionicons name="map" size={18} color={mapView ? colors.surface : colors.accent} />
            <Text style={[styles.viewToggleText, mapView && styles.activeViewToggleText]}>Map</Text>
          </TouchableOpacity>
        </View>

        {/* Enhanced Recent Searches */}
        {!mapView && searchResults.length === 0 && recentSearches.length > 0 && !isSearching && !searchQuery && (
          <View style={styles.recentSearchesContainer}>
            <Text style={styles.sectionTitle}>Recent Searches</Text>
            <View style={styles.recentSearches}>
              {recentSearches.map((search, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.recentSearchItem}
                  onPress={() => setSearchQuery(search)}
                >
                  <Ionicons name="time-outline" size={14} color={colors.accent} />
                  <Text style={styles.recentSearchText}>{search}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Enhanced Search Results */}
        <View style={styles.resultsContainer}>
          {/* Results Count */}
          {(searchResults.length > 0 || (!searchQuery && mapView)) && (
            <Text style={styles.resultsCount}>
              {searchQuery ? (
                `Found ${searchResults.length} result${searchResults.length !== 1 ? 's' : ''}`
              ) : (
                `Showing ${shops.filter(s => s.latitude && s.longitude).length} shops near you`
              )}
              {mapView && (
                <Text style={styles.mapResultsCount}>
                  {" "}({mapItems.length} on map)
                </Text>
              )}
            </Text>
          )}
          
          {mapView ? (
            // Enhanced Map View
            <View style={styles.mapContainer}>
              <MapView 
                style={styles.map}
                initialRegion={{
                  latitude: currentLocation?.latitude || 28.6130,
                  longitude: currentLocation?.longitude || 77.2259,
                  latitudeDelta: 0.1,
                  longitudeDelta: 0.1,
                }}
                showsUserLocation={true}
                showsMyLocationButton={true}
              >
                {/* User Location Marker */}
                {currentLocation && (
                  <Marker
                    coordinate={currentLocation}
                    title="Your Location"
                    pinColor={colors.accent}
                  />
                )}
                
                {/* Item Markers */}
                {mapItems.map((item) => {
                  const isShop = 'ownerName' in item && !('description' in item);
                  return (
                    <Marker
                      key={item.id}
                      coordinate={{
                        latitude: item.latitude!,
                        longitude: item.longitude!,
                      }}
                      title={isShop ? (item as Shop).shopName : (item as Product).name}
                      description={getLocationAddress(item)}
                      onPress={() => setSelectedItem(item)}
                    >
                      <View style={[
                        styles.marker,
                        isShop ? styles.shopMarker : styles.productMarker
                      ]}>
                        <Ionicons 
                          name={isShop ? "storefront" : "cube"} 
                          size={16} 
                          color="#fff" 
                        />
                      </View>
                    </Marker>
                  );
                })}
              </MapView>
              
              {/* Enhanced Selected Item Info */}
              {selectedItem && (
                <View style={styles.selectedItemCard}>
                  <View style={styles.selectedItemHeader}>
                    {('shopLogo' in selectedItem && selectedItem.shopLogo) ? (
                      <Image source={{ uri: selectedItem.shopLogo }} style={styles.selectedItemImage} />
                    ) : ('image' in selectedItem && (selectedItem as Product).image) ? (
                      <Image source={{ uri: (selectedItem as Product).image }} style={styles.selectedItemImage} />
                    ) : ('imageUrl' in selectedItem && (selectedItem as Product).imageUrl) ? (
                      <Image source={{ uri: (selectedItem as Product).imageUrl }} style={styles.selectedItemImage} />
                    ) : (
                      <View style={styles.selectedItemImagePlaceholder}>
                        <Ionicons name={'ownerName' in selectedItem ? "storefront" : "cube"} size={20} color={colors.accent} />
                      </View>
                    )}
                    <View style={styles.selectedItemInfo}>
                      <Text style={styles.selectedItemTitle}>
                        {'shopName' in selectedItem ? selectedItem.shopName : selectedItem.name}
                      </Text>
                      {'price' in selectedItem && selectedItem.price && selectedItem.price > 0 && (
                        <Text style={styles.selectedItemPrice}>₹{selectedItem.price}</Text>
                      )}
                    </View>
                  </View>
                  
                  <Text style={styles.selectedItemAddress}>
                    📍 {getLocationAddress(selectedItem)}
                  </Text>
                  
                  {'ownerName' in selectedItem && (
                    <Text style={styles.selectedItemDetail}>👤 {selectedItem.ownerName}</Text>
                  )}
                  
                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => setSelectedItem(null)}
                    >
                      <Text style={styles.actionButtonText}>Close</Text>
                    </TouchableOpacity>
                    
                    {'ownerName' in selectedItem ? (
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.primaryActionButton]}
                        onPress={() => handleViewShopDetails(selectedItem as Shop)}
                      >
                        <Ionicons name="eye-outline" size={14} color="#fff" />
                        <Text style={styles.primaryActionButtonText}>View Shop</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.primaryActionButton]}
                        onPress={() => handleViewProductDetails(selectedItem as Product)}
                      >
                        <Ionicons name="cube-outline" size={14} color="#fff" />
                        <Text style={styles.primaryActionButtonText}>View Product</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}

              {/* No Location Warning */}
              {searchQuery && mapItems.length === 0 && (
                <View style={styles.noLocationWarning}>
                  <Ionicons name="location-outline" size={40} color={colors.textSecondary} />
                  <Text style={styles.noLocationText}>No locations found for your search</Text>
                  <Text style={styles.noLocationSubText}>Try searching for something else</Text>
                </View>
              )}
            </View>
          ) : (
            // FIXED: Enhanced List View with Scrollable Product Cards
            renderProductGrid()
          )}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

// UPDATED: ENHANCED MODERN STYLES with CONSISTENT BUTTON HEIGHT AND LOGO
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  animatedContainer: {
    flex: 1,
  },
  // UPDATED: Header with Logo
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
  headerButton: {
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
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
  filterButton: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
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
    position: 'relative',
  },
  activeFilterButton: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  filterBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: colors.surface,
    fontSize: 10,
    fontWeight: 'bold',
  },
  activeFiltersContainer: {
    marginTop: 12,
  },
  activeFiltersScroll: {
    flexDirection: 'row',
  },
  activeFilterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    gap: 6,
  },
  activeFilterTagText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '500',
  },
  clearAllFilters: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.lightBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clearAllFiltersText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '500',
  },
  viewToggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
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
  viewToggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  activeViewToggle: {
    backgroundColor: colors.accent,
  },
  viewToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  activeViewToggleText: {
    color: colors.surface,
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  resultsCount: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textSecondary,
    backgroundColor: colors.surface,
    fontWeight: '500',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  mapResultsCount: {
    color: colors.accent,
    fontWeight: '600',
  },
  // FIXED: Updated styles for scrollable product grid
  productsGridFlatList: {
    flex: 1,
  },
  productsGridContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
    paddingTop: 8,
  },
  // UPDATED: ENHANCED Product Card Styles with CONSISTENT BUTTON HEIGHT
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
  // UPDATED: Top Badges Container - MATCHING HOMEPAGE
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
    marginBottom: 8,
    lineHeight: 18,
    minHeight: 36,
  },
  // UPDATED: Rating Section - MATCHING HOMEPAGE
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
  // UPDATED: Pricing Container - MATCHING HOMEPAGE
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
  // UPDATED: Product Actions - FIXED CONSISTENT HEIGHT
  productActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 36, // Fixed minimum height for consistency
  },
  cartButton: {
    flex: 1,
    backgroundColor: colors.darkButton,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10, // Increased padding for better height
    paddingHorizontal: 12,
    borderRadius: 8,
    height: 36, // Fixed height for consistency
  },
  shopButton: {
    // Specific style for shop button to ensure same height
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
  // Rest of the styles remain the same
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  shopMarker: {
    backgroundColor: colors.accent,
  },
  productMarker: {
    backgroundColor: colors.accentLight,
  },
  selectedItemCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  selectedItemImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: colors.lightBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  selectedItemInfo: {
    flex: 1,
  },
  selectedItemTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  selectedItemPrice: {
    fontSize: 16,
    color: colors.success,
    fontWeight: '600',
  },
  selectedItemAddress: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 6,
    fontWeight: '500',
  },
  selectedItemDetail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  primaryActionButton: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionButtonText: {
    color: colors.accent,
    fontWeight: '600',
    fontSize: 14,
  },
  primaryActionButtonText: {
    color: colors.surface,
    fontWeight: '600',
    fontSize: 14,
  },
  recentSearchesContainer: {
    padding: 20,
    backgroundColor: colors.surface,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  recentSearches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
  },
  recentSearchText: {
    marginLeft: 6,
    fontSize: 14,
    color: colors.accent,
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
  noLocationWarning: {
    position: 'absolute',
    top: '50%',
    left: 20,
    right: 20,
    alignItems: 'center',
    transform: [{ translateY: -50 }],
  },
  noLocationText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 12,
    textAlign: 'center',
  },
  noLocationSubText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 6,
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
  // Filter Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  filterOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  activeFilterOption: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  activeFilterOptionText: {
    color: colors.surface,
  },
  priceInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  priceInput: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  priceInputField: {
    backgroundColor: colors.lightBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.textPrimary,
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
  sortOptions: {
    gap: 8,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  activeSortOption: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  sortOptionText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  activeSortOptionText: {
    color: colors.surface,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.surface,
  },
});