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
  image?: string;
  category?: string;
  price?: number;
  createdAt?: any;
  shopId?: string;
  shopName?: string;
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
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.productImage} />
      ) : (
        <View style={styles.productImagePlaceholder}>
          <Ionicons name="cube" size={32} color="#007AFF" />
        </View>
      )}
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productDescription} numberOfLines={2}>
          {item.description}
        </Text>
        {item.category && (
          <Text style={styles.productCategory}>Category: {item.category}</Text>
        )}
        {item.price && item.price > 0 && (
          <Text style={styles.productPrice}>${item.price}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderDetailsTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Shop Info Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shop Information</Text>
        <View style={styles.infoRow}>
          <Ionicons name="person" size={20} color="#007AFF" />
          <Text style={styles.infoText}>Owner: {shop.ownerName}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="call" size={20} color="#007AFF" />
          <Text style={styles.infoText}>Phone: {shop.phone}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="mail" size={20} color="#007AFF" />
          <Text style={styles.infoText}>Email: {shop.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location" size={20} color="#007AFF" />
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
          <ActivityIndicator size="large" color="#007AFF" />
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
          <Ionicons name="cube-outline" size={60} color="#ccc" />
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
          <Ionicons name="arrow-back" size={24} color="#333" />
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
            <Ionicons name="storefront" size={40} color="#007AFF" />
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
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
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
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
    backgroundColor: '#e9ecef',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#dee2e6',
  },
  shopHeaderInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  ownerName: {
    fontSize: 16,
    color: '#666',
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
  },
  tabContent: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
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
    backgroundColor: '#28a745',
  },
  emailButton: {
    backgroundColor: '#007AFF',
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
    backgroundColor: '#007AFF',
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
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  productImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 18,
  },
  productCategory: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
    fontWeight: '500',
  },
  productPrice: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    marginTop: 4,
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
    color: '#666',
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
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  noProductsSubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});