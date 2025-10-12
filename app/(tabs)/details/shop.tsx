import { Ionicons } from '@expo/vector-icons'; 
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, getDocs, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
  Linking,
  Alert
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { db } from '../../../firebaseConfig';

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
  uid: string;
};

const { width } = Dimensions.get('window');

// FIXED: Safe default values and validation functions
const getSafeNumber = (value: any, defaultValue: number = 0): number => {
  if (value === undefined || value === null) return defaultValue;
  const num = parseFloat(value);
  return isNaN(num) ? defaultValue : num;
};

const getSafeString = (value: any, defaultValue: string = ''): string => {
  if (value === undefined || value === null) return defaultValue;
  return String(value);
};

export default function ShopScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopLoading, setShopLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'products'>('details');

  // FIXED: Extract individual params to avoid object reference issues
  const shopId = getSafeString(params.shopId, 'unknown-shop');
  const shopName = getSafeString(params.shopName, 'Unknown Shop');
  const ownerName = getSafeString(params.ownerName, 'Unknown Owner');
  const email = getSafeString(params.email, '');
  const phone = getSafeString(params.phone, '');
  // const latitude = getSafeNumber(params.latitude, 21.0957);
  // const longitude = getSafeNumber(params.longitude, 78.9382);
  const latitude = getSafeNumber(params.latitude, 21.1443);
  const longitude = getSafeNumber(params.longitude, 79.0789);
  const location = getSafeString(params.location, 'Unknown Location');
  const shopLogo = getSafeString(params.shopLogo, '');
  const uid = getSafeString(params.uid, shopId);

  // FIXED: Stable fetchShopData function with specific dependencies
  const fetchShopData = useCallback(async () => {
    if (shopId === 'unknown-shop') {
      console.log('❌ No valid shop ID provided');
      setShopLoading(false);
      return;
    }

    try {
      console.log('🔄 Fetching shop data for ID:', shopId);
      
      // Try to get shop from shops collection first
      const shopDocRef = doc(db, 'shops', shopId);
      const shopDoc = await getDoc(shopDocRef);
      
      if (shopDoc.exists()) {
        const shopData = shopDoc.data() as Shop;
        console.log('✅ Shop data found in Firestore:', shopData);
        setShop({
          ...shopData,
          id: shopDoc.id
        });
      } else {
        // If shop not found in shops collection, use passed params with safe defaults
        console.log('⚠️ Shop not found in Firestore, using passed params');
        const safeShop: Shop = {
          id: shopId,
          shopName,
          ownerName,
          email,
          phone,
          latitude,
          longitude,
          location,
          shopLogo,
          uid
        };
        setShop(safeShop);
      }
    } catch (error) {
      console.error('❌ Error fetching shop data:', error);
      // Fallback to params if Firestore fails
      const safeShop: Shop = {
        id: shopId,
        shopName,
        ownerName,
        email,
        phone,
        latitude,
        longitude,
        location,
        shopLogo,
        uid
      };
      setShop(safeShop);
    } finally {
      setShopLoading(false);
    }
  }, [shopId, shopName, ownerName, email, phone, latitude, longitude, location, shopLogo, uid]);

  // FIXED: Initialize shop data - only run once when component mounts
  useEffect(() => {
    console.log('🛍️ ShopScreen initialized with shopId:', shopId);
    fetchShopData();
  }, [fetchShopData]);

  // FIXED: Load products with proper dependency
  const loadShopProducts = useCallback(async () => {
    if (!shop || !shop.id || shop.id === 'unknown-shop') {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log('🔄 Loading products for shop:', shop.id);
      
      const q = query(
        collection(db, 'products'),
        where('shopId', '==', shop.id),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const productsData: Product[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];
      
      console.log(`✅ Loaded ${productsData.length} products`);
      setProducts(productsData);
    } catch (error) {
      console.error('❌ Error loading products:', error);
      Alert.alert('Error', 'Failed to load products. Please try again.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [shop]);

  // FIXED: Load products when shop data is available
  useEffect(() => {
    if (!shopLoading && shop) {
      loadShopProducts();
    }
  }, [shop, shopLoading, loadShopProducts]);

  const handleCall = (phoneNumber: string) => {
    if (!phoneNumber) {
      Alert.alert('Info', 'Phone number not available');
      return;
    }
    
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

  const handleEmail = (email: string) => {
    if (!email) {
      Alert.alert('Info', 'Email not available');
      return;
    }
    
    const emailUrl = `mailto:${email}`;
    Linking.openURL(emailUrl).catch(err => {
      console.log('Error opening email:', err);
      Alert.alert('Error', 'Unable to open email client');
    });
  };

  // FIXED: Safe product navigation
  const handleViewProduct = (product: Product) => {
    if (!shop) return;
    
    try {
      router.push({
        pathname: '../details/productdetails',
        params: {
          product: JSON.stringify({
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            stock: product.stock,
            category: product.category,
            type: product.type,
            imageUrl: product.imageUrl,
            createdAt: product.createdAt,
            shopkeeperId: shop.uid,
            shopId: shop.id,
            shopName: shop.shopName,
            ownerName: shop.ownerName,
            location: shop.location,
            phone: shop.phone,
            email: shop.email
          })
        }
      });
    } catch (error) {
      console.error('❌ Error navigating to product:', error);
      Alert.alert('Error', 'Failed to open product details');
    }
  };

  // UPDATED: Product item without image dependency
  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity 
      style={styles.productCard}
      onPress={() => handleViewProduct(item)}
      activeOpacity={0.7}
    >
      <View style={styles.productIconContainer}>
        <Ionicons 
          name="cube" 
          size={32} 
          color="rgba(23, 104, 217, 1)" 
        />
        {item.stock === 0 && (
          <View style={styles.outOfStockOverlay}>
            <Ionicons name="close-circle" size={20} color="#ff6b6b" />
          </View>
        )}
      </View>
      
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>
          {item.name || 'Unnamed Product'}
        </Text>
        <Text style={styles.productDescription} numberOfLines={2}>
          {item.description || 'No description available'}
        </Text>
        
        <View style={styles.productMetaContainer}>
          {item.category && (
            <Text style={styles.productCategory}>{item.category}</Text>
          )}
          {item.type && (
            <Text style={styles.productType}>{item.type}</Text>
          )}
        </View>
        
        <View style={styles.productFooter}>
          <View style={styles.priceStockContainer}>
            {item.price && item.price > 0 && (
              <Text style={styles.productPrice}>${item.price}</Text>
            )}
            {item.stock !== undefined && (
              <Text style={[
                styles.productStock,
                item.stock === 0 && styles.outOfStock
              ]}>
                {item.stock === 0 ? 'Out of Stock' : `${item.stock} in stock`}
              </Text>
            )}
          </View>
          
          <TouchableOpacity 
            style={styles.viewButton}
            onPress={() => handleViewProduct(item)}
          >
            <Ionicons name="eye" size={16} color="#fff" />
            <Text style={styles.viewButtonText}>View</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderDetailsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Shop Info Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shop Information</Text>
        <View style={styles.infoRow}>
          <Ionicons name="person" size={20} color="rgba(23, 104, 217, 1)" />
          <Text style={styles.infoText}>Owner: {shop?.ownerName || 'Unknown'}</Text>
        </View>
        {shop?.phone && (
          <View style={styles.infoRow}>
            <Ionicons name="call" size={20} color="rgba(23, 104, 217, 1)" />
            <Text style={styles.infoText}>Phone: {shop.phone}</Text>
          </View>
        )}
        {shop?.email && (
          <View style={styles.infoRow}>
            <Ionicons name="mail" size={20} color="rgba(23, 104, 217, 1)" />
            <Text style={styles.infoText}>Email: {shop.email}</Text>
          </View>
        )}
        <View style={styles.infoRow}>
          <Ionicons name="location" size={20} color="rgba(23, 104, 217, 1)" />
          <Text style={styles.infoText}>Address: {shop?.location || 'Unknown Location'}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        {shop?.phone && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.callButton]}
            onPress={() => handleCall(shop.phone)}
          >
            <Ionicons name="call" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Call Shop</Text>
          </TouchableOpacity>
        )}
        
        {shop?.email && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.emailButton]}
            onPress={() => handleEmail(shop.email)}
          >
            <Ionicons name="mail" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Send Email</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Map Section - Only render if coordinates are valid */}
      {shop && !isNaN(shop.latitude) && !isNaN(shop.longitude) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: shop.latitude,
                longitude: shop.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
            >
              <Marker
                coordinate={{
                  latitude: shop.latitude,
                  longitude: shop.longitude,
                }}
                title={shop.shopName}
                description={shop.location}
              >
                <View style={styles.mapMarker}>
                  <Ionicons name="storefront" size={24} color="#fff" />
                </View>
              </Marker>
            </MapView>
          </View>
        </View>
      )}
    </ScrollView>
  );

  const renderProductsTab = () => (
    <View style={styles.tabContent}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="rgba(23, 104, 217, 1)" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : products.length > 0 ? (
        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.productsList}
        />
      ) : (
        <View style={styles.noProductsContainer}>
          <Ionicons name="cube-outline" size={60} color="rgba(144, 186, 242, 1)" />
          <Text style={styles.noProductsText}>No products available</Text>
          <Text style={styles.noProductsSubText}>
            This shop hasn't added any products yet.
          </Text>
        </View>
      )}
    </View>
  );

  if (shopLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="rgba(23, 104, 217, 1)" />
          <Text style={styles.loadingText}>Loading shop information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!shop) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="rgba(144, 186, 242, 1)" />
          <Text style={styles.errorText}>Shop not found</Text>
          <Text style={styles.errorSubText}>
            The shop information could not be loaded.
          </Text>
          <TouchableOpacity 
            style={styles.backButtonLarge}
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="rgba(4, 18, 36, 1)" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {shop.shopName}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* Shop Header */}
      <View style={styles.shopHeader}>
        <View style={styles.shopIconContainer}>
          <Ionicons name="storefront" size={40} color="rgba(23, 104, 217, 1)" />
        </View>
        <View style={styles.shopHeaderInfo}>
          <Text style={styles.shopName}>{shop.shopName}</Text>
          <Text style={styles.ownerName}>By {shop.ownerName}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.ratingText}>4.8 (124 reviews)</Text>
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'details' && styles.activeTab]}
          onPress={() => setActiveTab('details')}
        >
          <Text style={[styles.tabText, activeTab === 'details' && styles.activeTabText]}>
            Details
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'products' && styles.activeTab]}
          onPress={() => setActiveTab('products')}
        >
          <Text style={[styles.tabText, activeTab === 'products' && styles.activeTabText]}>
            Products ({products.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'details' ? renderDetailsTab() : renderProductsTab()}
    </SafeAreaView>
  );
}

// ... (keep the same styles as before)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(144, 186, 242, 0.3)',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(4, 18, 36, 1)',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  headerRight: {
    width: 32,
  },
  shopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(208, 226, 250, 0.3)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(144, 186, 242, 0.3)',
  },
  shopIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: 'rgba(208, 226, 250, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'rgba(144, 186, 242, 0.3)',
  },
  shopHeaderInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 22,
    fontWeight: '700',
    color: 'rgba(4, 18, 36, 1)',
    marginBottom: 4,
  },
  ownerName: {
    fontSize: 16,
    color: 'rgba(4, 18, 36, 0.7)',
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: 'rgba(4, 18, 36, 0.6)',
    marginLeft: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(144, 186, 242, 0.3)',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: 'rgba(23, 104, 217, 1)',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(4, 18, 36, 0.6)',
  },
  activeTabText: {
    color: 'rgba(23, 104, 217, 1)',
  },
  tabContent: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(144, 186, 242, 0.2)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(4, 18, 36, 1)',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: 'rgba(4, 18, 36, 0.8)',
    marginLeft: 12,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  callButton: {
    backgroundColor: 'rgba(23, 104, 217, 1)',
  },
  emailButton: {
    backgroundColor: 'rgba(144, 186, 242, 1)',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapMarker: {
    backgroundColor: 'rgba(23, 104, 217, 1)',
    padding: 8,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#fff',
  },
  productsList: {
    padding: 16,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    shadowColor: 'rgba(4, 18, 36, 0.15)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(144, 186, 242, 0.2)',
  },
  productIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: 'rgba(208, 226, 250, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'rgba(144, 186, 242, 0.3)',
    position: 'relative',
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 2,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(4, 18, 36, 1)',
    marginBottom: 6,
  },
  productDescription: {
    fontSize: 14,
    color: 'rgba(4, 18, 36, 0.7)',
    marginBottom: 8,
    lineHeight: 18,
  },
  productMetaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  productCategory: {
    fontSize: 12,
    color: 'rgba(23, 104, 217, 1)',
    fontWeight: '600',
    backgroundColor: 'rgba(144, 186, 242, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  productType: {
    fontSize: 12,
    color: 'rgba(144, 186, 242, 1)',
    fontWeight: '500',
    backgroundColor: 'rgba(208, 226, 250, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceStockContainer: {
    flex: 1,
  },
  productPrice: {
    fontSize: 16,
    color: 'rgba(23, 104, 217, 1)',
    fontWeight: '700',
    marginBottom: 4,
  },
  productStock: {
    fontSize: 12,
    color: 'rgba(23, 104, 217, 1)',
    fontWeight: '600',
  },
  outOfStock: {
    color: '#ff6b6b',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(23, 104, 217, 1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
    color: 'rgba(4, 18, 36, 0.6)',
  },
  noProductsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noProductsText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(4, 18, 36, 0.8)',
    marginTop: 16,
    textAlign: 'center',
  },
  noProductsSubText: {
    fontSize: 14,
    color: 'rgba(144, 186, 242, 1)',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(4, 18, 36, 0.8)',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubText: {
    fontSize: 16,
    color: 'rgba(144, 186, 242, 1)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  backButtonLarge: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: 'rgba(23, 104, 217, 1)',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});