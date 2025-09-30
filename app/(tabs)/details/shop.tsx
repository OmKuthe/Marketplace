
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
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

export default function ShopScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Extract shop data from params
  const shop: Shop = {
    id: params.shopId as string,
    shopName: params.shopName as string,
    ownerName: params.ownerName as string,
    email: params.email as string,
    phone: params.phone as string,
    latitude: parseFloat(params.latitude as string),
    longitude: parseFloat(params.longitude as string),
    location: params.location as string,
    shopLogo: params.shopLogo as string,
    uid: params.uid as string,
  };

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'products'>('details');

  useEffect(() => {
    loadShopProducts();
  }, [shop.id]);

  const loadShopProducts = async () => {
    try {
      setLoading(true);
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
      setProducts(productsData);
    } catch (error) {
      console.log('Error loading products:', error);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

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

  const handleEmail = (email: string) => {
    if (!email) return;
    
    const emailUrl = `mailto:${email}`;
    Linking.openURL(emailUrl).catch(err => {
      console.log('Error opening email:', err);
      Alert.alert('Error', 'Unable to open email client');
    });
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity style={styles.productCard}>
      {item.imageUrl ? (
        <Image 
          source={{ uri: item.imageUrl }} 
          style={styles.productImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.productImagePlaceholder}>
          <Ionicons name="cube" size={32} color="rgba(23, 104, 217, 1)" />
        </View>
      )}
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productDescription} numberOfLines={2}>
          {item.description}
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
      </View>
    </TouchableOpacity>
  );

  const renderDetailsTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Shop Info Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shop Information</Text>
        <View style={styles.infoRow}>
          <Ionicons name="person" size={20} color="rgba(23, 104, 217, 1)" />
          <Text style={styles.infoText}>Owner: {shop.ownerName}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="call" size={20} color="rgba(23, 104, 217, 1)" />
          <Text style={styles.infoText}>Phone: {shop.phone}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="mail" size={20} color="rgba(23, 104, 217, 1)" />
          <Text style={styles.infoText}>Email: {shop.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location" size={20} color="rgba(23, 104, 217, 1)" />
          <Text style={styles.infoText}>Address: {shop.location}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.callButton]}
          onPress={() => handleCall(shop.phone)}
        >
          <Ionicons name="call" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Call Shop</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.emailButton]}
          onPress={() => handleEmail(shop.email)}
        >
          <Ionicons name="mail" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Send Email</Text>
        </TouchableOpacity>
      </View>

      {/* Map Section */}
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
        {shop.shopLogo ? (
          <Image source={{ uri: shop.shopLogo }} style={styles.shopLogo} />
        ) : (
          <View style={styles.shopLogoPlaceholder}>
            <Ionicons name="storefront" size={40} color="rgba(23, 104, 217, 1)" />
          </View>
        )}
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
  shopLogo: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  shopLogoPlaceholder: {
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
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  productImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: 'rgba(208, 226, 250, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'rgba(144, 186, 242, 0.3)',
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
  productPrice: {
    fontSize: 16,
    color: 'rgba(23, 104, 217, 1)',
    fontWeight: '700',
  },
  productStock: {
    fontSize: 12,
    color: 'rgba(23, 104, 217, 1)',
    fontWeight: '600',
  },
  outOfStock: {
    color: '#ff6b6b',
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
});