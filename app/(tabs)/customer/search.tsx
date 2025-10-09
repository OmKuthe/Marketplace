// import { Href } from 'expo-router';
// import { Ionicons } from '@expo/vector-icons';
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { useRouter } from "expo-router";
// import { collection, getDocs, orderBy, query, doc, getDoc } from "firebase/firestore";
// import React, { useEffect, useState } from "react";
// import {
//   ActivityIndicator,
//   Dimensions,
//   FlatList,
//   Image,
//   SafeAreaView,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
//   Linking,
//   Alert,
//   Animated
// } from "react-native";
// import MapView, { Marker } from 'react-native-maps';
// import * as Location from 'expo-location';
// import { db } from "../../../firebaseConfig";

// const { width, height } = Dimensions.get('window');

// // NEW EYE-CATCHING COLOR SCHEME
// const colors = {
//   background: '#f8fafc',
//   surface: '#ffffff',
//   textPrimary: '#1e293b',
//   textSecondary: '#64748b',
//   accent: '#3b82f6',
//   accentLight: '#60a5fa',
//   success: '#10b981',
//   warning: '#f59e0b',
//   error: '#ef4444',
//   border: '#e2e8f0',
//   darkButton: '#1e293b',
//   lightBackground: 'rgba(226, 232, 240, 0.4)',
//   gradientPrimary: ['#3b82f6', '#6366f1'],
// };

// type Product = {
//   id: string;
//   name: string;
//   description: string;
//   price: number;
//   stock: number;
//   category: string;
//   type: string;
//   imageUrl?: string;
//   image?: string;
//   createdAt?: any;
//   shopkeeperId?: string;
//   shopId?: string;
//   shopName?: string;
//   ownerName?: string;
//   location?: string;
//   phone?: string;
//   email?: string;
//   address?: string;
//   latitude?: number;
//   longitude?: number;
// };

// type Shop = {
//   id: string;
//   shopName: string;
//   ownerName: string;
//   email: string;
//   phone: string;
//   latitude: number;
//   longitude: number;
//   location: string;
//   shopLogo: string;
//   createdAt: any;
//   updatedAt: any;
//   uid: string;
// };

// // Enhanced Product Card Component
// const ProductCard = React.memo(({ 
//   item, 
//   index, 
//   onViewShopDetails, 
//   onViewProductDetails 
// }: { 
//   item: Product | Shop; 
//   index: number;
//   onViewShopDetails: (shop: Shop) => void;
//   onViewProductDetails: (product: Product) => void;
// }) => {
//   const isShop = 'ownerName' in item && !('description' in item);
//   const [imageLoading, setImageLoading] = useState(true);
//   const [imageError, setImageError] = useState(false);
//   const [cardAnim] = useState(new Animated.Value(0));

//   const getImageUrl = (): string => {
//     if (isShop) {
//       const shop = item as Shop;
//       return shop.shopLogo || '';
//     } else {
//       const product = item as Product;
//       return product.imageUrl || product.image || '';
//     }
//   };

//   const imageUrl = getImageUrl();

//   useEffect(() => {
//     Animated.timing(cardAnim, {
//       toValue: 1,
//       duration: 300,
//       delay: index * 50,
//       useNativeDriver: true,
//     }).start();
//   }, []);

//   const handleImageLoad = () => {
//     setImageLoading(false);
//     setImageError(false);
//   };

//   const handleImageError = () => {
//     setImageLoading(false);
//     setImageError(true);
//   };

//   const getLocationAddress = (item: Product | Shop) => {
//     if ('location' in item && item.location) {
//       if (item.location.includes('Lat:')) {
//         return 'Nearby location';
//       }
//       return item.location;
//     }
//     if (item.latitude && item.longitude) {
//       return 'Nearby location';
//     }
//     return "Location not available";
//   };

//   const renderImage = () => {
//     if (imageUrl && !imageError) {
//       return (
//         <>
//           {imageLoading && (
//             <View style={styles.imageLoader}>
//               <ActivityIndicator size="small" color={colors.accent} />
//             </View>
//           )}
//           <Image 
//             source={{ uri: imageUrl }} 
//             style={[
//               styles.itemImage,
//               imageLoading && styles.hiddenImage
//             ]}
//             onLoad={handleImageLoad}
//             onError={handleImageError}
//           />
//         </>
//       );
//     }

//     return (
//       <View style={styles.imagePlaceholder}>
//         <Ionicons 
//           name={isShop ? "storefront" : "cube"} 
//           size={24} 
//           color={colors.accent} 
//         />
//       </View>
//     );
//   };

//   return (
//     <Animated.View
//       style={[
//         styles.card,
//         {
//           opacity: cardAnim,
//           transform: [
//             {
//               translateY: cardAnim.interpolate({
//                 inputRange: [0, 1],
//                 outputRange: [30, 0],
//               }),
//             },
//           ],
//         },
//       ]}
//     >
//       {renderImage()}
      
//       <View style={styles.cardContent}>
//         <Text style={styles.cardTitle}>
//           {isShop ? (item as Shop).shopName : (item as Product).name}
//         </Text>
        
//         <Text style={styles.cardDescription} numberOfLines={2}>
//           {isShop ? `Owner: ${(item as Shop).ownerName}` : (item as Product).description}
//         </Text>
        
//         {!isShop && (item as Product).price && (item as Product).price > 0 && (
//           <Text style={styles.cardPrice}>${(item as Product).price}</Text>
//         )}
        
//         {(item as Product).category && (
//           <Text style={styles.cardCategory}>#{(item as Product).category}</Text>
//         )}
        
//         <Text style={styles.cardAddress} numberOfLines={1}>
//           📍 {getLocationAddress(item)}
//         </Text>
        
//         {isShop ? (
//           <TouchableOpacity 
//             style={styles.viewDetailsButton}
//             onPress={() => onViewShopDetails(item as Shop)}
//           >
//             <Ionicons name="eye" size={14} color="#fff" />
//             <Text style={styles.viewDetailsButtonText}>View Shop</Text>
//           </TouchableOpacity>
//         ) : (
//           <TouchableOpacity 
//             style={styles.viewDetailsButton}
//             onPress={() => onViewProductDetails(item as Product)}
//           >
//             <Ionicons name="cube" size={14} color="#fff" />
//             <Text style={styles.viewDetailsButtonText}>View Product</Text>
//           </TouchableOpacity>
//         )}
//       </View>
//     </Animated.View>
//   );
// });

// // Enhanced Search Screen
// export default function SearchScreen() {
//   const [searchQuery, setSearchQuery] = useState("");
//   const [searchResults, setSearchResults] = useState<(Product | Shop)[]>([]);
//   const [shops, setShops] = useState<Shop[]>([]);
//   const [products, setProducts] = useState<Product[]>([]);
//   const [isSearching, setIsSearching] = useState(false);
//   const [recentSearches, setRecentSearches] = useState<string[]>([]);
//   const [sidePanelVisible, setSidePanelVisible] = useState(false);
//   const [currentLocation, setCurrentLocation] = useState<{latitude: number; longitude: number} | null>(null);
//   const [mapView, setMapView] = useState(false);
//   const [selectedItem, setSelectedItem] = useState<Product | Shop | null>(null);
//   const [locationPermission, setLocationPermission] = useState(false);
//   const [dataLoaded, setDataLoaded] = useState(false);
//   const router = useRouter();

//   // Animation values
//   const fadeAnim = useState(new Animated.Value(0))[0];
//   const slideAnim = useState(new Animated.Value(300))[0];

//   // Load initial data
//   useEffect(() => {
//     const initializeData = async () => {
//       if (dataLoaded) return;

//       try {
//         // Load recent searches
//         const savedSearches = await AsyncStorage.getItem("recentSearches");
//         if (savedSearches) {
//           setRecentSearches(JSON.parse(savedSearches));
//         }

//         // Get location permission
//         const { status } = await Location.requestForegroundPermissionsAsync();
//         if (status === 'granted') {
//           setLocationPermission(true);
//           const location = await Location.getCurrentPositionAsync({});
//           setCurrentLocation({
//             latitude: location.coords.latitude,
//             longitude: location.coords.longitude
//           });
//         }

//         // Load shops and products
//         await loadShops();
//         await loadProducts();
        
//         setDataLoaded(true);
//         Animated.timing(fadeAnim, {
//           toValue: 1,
//           duration: 400,
//           useNativeDriver: true,
//         }).start();

//       } catch (error) {
//         console.log("Error initializing data:", error);
//       }
//     };

//     initializeData();
//   }, []);

//   const loadShops = async () => {
//     try {
//       const shopsQuery = query(collection(db, "shopkeepers"));
//       const snapshot = await getDocs(shopsQuery);
//       const shopsData: Shop[] = snapshot.docs.map((doc) => ({
//         id: doc.id,
//         ...(doc.data() as Omit<Shop, "id">),
//       }));
//       setShops(shopsData);
//     } catch (err) {
//       console.log("Error loading shops:", err);
//     }
//   };

//   const loadProducts = async () => {
//     try {
//       const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
//       const snapshot = await getDocs(q);
//       const productsData: Product[] = snapshot.docs.map((doc) => {
//         const data = doc.data();
//         return {
//           id: doc.id,
//           name: data.name || '',
//           description: data.description || '',
//           price: data.price || 0,
//           stock: data.stock || 0,
//           category: data.category || 'General',
//           type: data.type || 'product',
//           imageUrl: data.imageUrl,
//           image: data.image,
//           createdAt: data.createdAt,
//           shopkeeperId: data.shopkeeperId,
//           shopId: data.shopId,
//           shopName: data.shopName,
//           ownerName: data.ownerName,
//           location: data.location,
//           phone: data.phone,
//           email: data.email,
//           address: data.address,
//           latitude: data.latitude,
//           longitude: data.longitude
//         };
//       });
//       setProducts(productsData);
//     } catch (err) {
//       console.log("Error loading products:", err);
//     }
//   };

//   // Search function
//   const handleSearch = async (queryText: string = searchQuery) => {
//     const searchText = queryText.trim();
//     if (!searchText) {
//       setSearchResults([]);
//       return;
//     }

//     setIsSearching(true);

//     try {
//       // Save to recent searches
//       const updatedSearches = [
//         searchText,
//         ...recentSearches.filter(s => s !== searchText).slice(0, 4)
//       ];
//       setRecentSearches(updatedSearches);
//       await AsyncStorage.setItem("recentSearches", JSON.stringify(updatedSearches));

//       // Search in shops and products
//       const searchLower = searchText.toLowerCase();
      
//       const filteredShops = shops.filter(shop =>
//         shop.shopName?.toLowerCase().includes(searchLower) ||
//         shop.ownerName?.toLowerCase().includes(searchLower) ||
//         shop.location?.toLowerCase().includes(searchLower)
//       );

//       const filteredProducts = products.filter(product =>
//         product.name?.toLowerCase().includes(searchLower) ||
//         product.description?.toLowerCase().includes(searchLower) ||
//         product.category?.toLowerCase().includes(searchLower)
//       );

//       const combinedResults = [...filteredShops, ...filteredProducts];
//       setSearchResults(combinedResults);

//     } catch (err) {
//       console.log("Error searching:", err);
//     } finally {
//       setIsSearching(false);
//     }
//   };

//   // Debounced search
//   useEffect(() => {
//     if (searchQuery.trim()) {
//       const timeoutId = setTimeout(() => {
//         handleSearch();
//       }, 300);

//       return () => clearTimeout(timeoutId);
//     } else {
//       setSearchResults([]);
//     }
//   }, [searchQuery]);

//   const clearSearch = () => {
//     setSearchQuery("");
//     setSearchResults([]);
//     setSelectedItem(null);
//   };

//   // Navigation handlers
//   const handleViewShopDetails = (shop: Shop) => {
//     router.push({
//       pathname: "../details/shop",
//       params: {
//         shopId: shop.id,
//         shopName: shop.shopName,
//         ownerName: shop.ownerName,
//         email: shop.email,
//         phone: shop.phone,
//         latitude: shop.latitude,
//         longitude: shop.longitude,
//         location: shop.location,
//         shopLogo: shop.shopLogo,
//         uid: shop.uid
//       }
//     });
//   };

//   const handleViewProductDetails = async (product: Product) => {
//     try {
//       let shopData = null;
      
//       if (product.shopId) {
//         try {
//           const shopDoc = await getDoc(doc(db, "shopkeepers", product.shopId));
//           if (shopDoc.exists()) {
//             const shop = shopDoc.data();
//             shopData = {
//               shopName: shop.shopName,
//               ownerName: shop.ownerName,
//               location: shop.location,
//               phone: shop.phone,
//               email: shop.email
//             };
//           }
//         } catch (error) {
//           console.log("Error fetching shop details:", error);
//         }
//       }

//       const productImage = product.imageUrl || product.image;

//       router.push({
//         pathname: "../details/productdetails",
//         params: {
//           product: JSON.stringify({
//             id: product.id,
//             name: product.name,
//             description: product.description,
//             price: product.price,
//             stock: product.stock || 0,
//             category: product.category || 'General',
//             type: product.type || 'product',
//             imageUrl: productImage,
//             image: productImage,
//             createdAt: product.createdAt,
//             shopkeeperId: product.shopId,
//             shopId: product.shopId,
//             shopName: shopData?.shopName || product.shopName || 'Local Store',
//             ownerName: shopData?.ownerName || 'Shop Owner',
//             location: shopData?.location || product.address || 'Unknown Location',
//             phone: shopData?.phone || '',
//             email: shopData?.email || ''
//           })
//         }
//       });
//     } catch (error) {
//       console.log("Error navigating to product details:", error);
//       const productImage = product.imageUrl || product.image;
//       router.push({
//         pathname: "../details/productdetails",
//         params: {
//           product: JSON.stringify({
//             id: product.id,
//             name: product.name,
//             description: product.description,
//             price: product.price,
//             stock: product.stock || 0,
//             category: product.category || 'General',
//             type: product.type || 'product',
//             imageUrl: productImage,
//             image: productImage,
//             createdAt: product.createdAt,
//             shopkeeperId: product.shopId,
//             shopId: product.shopId,
//             shopName: product.shopName || 'Local Store',
//             ownerName: 'Shop Owner',
//             location: product.address || 'Unknown Location',
//             phone: '',
//             email: ''
//           })
//         }
//       });
//     }
//   };

//   const getLocationAddress = (item: Product | Shop) => {
//     if ('location' in item && item.location) {
//       if (item.location.includes('Lat:')) {
//         return 'Nearby location';
//       }
//       return item.location;
//     }
//     if (item.latitude && item.longitude) {
//       return 'Nearby location';
//     }
//     return "Location not available";
//   };

//   // Enhanced Side Panel
//   const SidePanel = () => {
//     useEffect(() => {
//       if (sidePanelVisible) {
//         Animated.timing(slideAnim, {
//           toValue: 0,
//           duration: 300,
//           useNativeDriver: true,
//         }).start();
//       }
//     }, [sidePanelVisible]);

//     const closePanel = () => {
//       Animated.timing(slideAnim, {
//         toValue: 300,
//         duration: 300,
//         useNativeDriver: true,
//       }).start(() => setSidePanelVisible(false));
//     };

//     return (
//       <Animated.View 
//         style={[
//           styles.sidePanel,
//           { transform: [{ translateX: slideAnim }] }
//         ]}
//       >
//         <TouchableOpacity 
//           style={styles.sidePanelClose} 
//           onPress={closePanel}
//         >
//           <Ionicons name="close" size={24} color={colors.textPrimary} />
//         </TouchableOpacity>
        
//         <View style={styles.sidePanelHeader}>
//           <Text style={styles.sidePanelTitle}>RAMSHOP</Text>
//           <Text style={styles.sidePanelSubtitle}>Discover • Connect • Shop</Text>
//         </View>
        
//         {[
//           { name: "Home", icon: "home", route: "/customer/home" as Href},
//           { name: "Search", icon: "search", route: null },
//           { name: "Messages", icon: "chatbubbles", route: "/customer/messages" as Href},
//           { name: "Orders", icon: "list", route: "/customer/myorders" as Href},
//           { name: "Profile", icon: "person", route: "/customer/profile" as Href},
//         ].map((item, index) => (
//           <TouchableOpacity 
//             key={index}
//             style={[styles.menuItem, item.name === "Search" && styles.activeMenuItem]}
//             onPress={() => {
//               closePanel();
//               if (item.route) {
//                 router.push(item.route);
//               }
//             }}
//           >
//             <Ionicons name={item.icon as any} size={20} color={colors.accent} />
//             <Text style={styles.menuItemText}>{item.name}</Text>
//           </TouchableOpacity>
//         ))}
//       </Animated.View>
//     );
//   };

//   // Get items with location for map
//   const getMapItems = () => {
//     if (searchQuery && searchResults.length > 0) {
//       return searchResults.filter(item => 
//         item.latitude && item.longitude
//       );
//     }
//     return shops.filter(shop => shop.latitude && shop.longitude);
//   };

//   const mapItems = getMapItems();

//   return (
//     <SafeAreaView style={styles.container}>
//       <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim }]}>
//         {/* Enhanced Header */}
//         <View style={styles.header}>
//           <TouchableOpacity 
//             onPress={() => setSidePanelVisible(true)}
//             style={styles.headerButton}
//           >
//             <Ionicons name="menu" size={24} color={colors.textPrimary} />
//           </TouchableOpacity>
//           <View style={styles.headerTitleContainer}>
//             <Text style={styles.headerTitle}>RAMSHOP</Text>
//             <Text style={styles.headerSubtitle}>Search</Text>
//           </View>
//           <View style={styles.headerButton} />
//         </View>

//         {/* Side Panel */}
//         {sidePanelVisible && <SidePanel />}

//         {/* Enhanced Search Bar */}
//         <View style={styles.searchContainer}>
//           <View style={styles.searchInputContainer}>
//             <Ionicons name="search" size={20} color={colors.accent} style={styles.searchIcon} />
//             <TextInput
//               style={styles.searchInput}
//               placeholder="Search shops, products, or locations..."
//               value={searchQuery}
//               onChangeText={setSearchQuery}
//               returnKeyType="search"
//               clearButtonMode="while-editing"
//               placeholderTextColor={colors.textSecondary}
//             />
//             {searchQuery.length > 0 && (
//               <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
//                 <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
//               </TouchableOpacity>
//             )}
//           </View>
//         </View>

//         {/* Enhanced View Toggle */}
//         <View style={styles.viewToggleContainer}>
//           <TouchableOpacity 
//             style={[styles.viewToggleButton, !mapView && styles.activeViewToggle]}
//             onPress={() => setMapView(false)}
//           >
//             <Ionicons name="list" size={18} color={!mapView ? "#fff" : colors.accent} />
//             <Text style={[styles.viewToggleText, !mapView && styles.activeViewToggleText]}>List</Text>
//           </TouchableOpacity>
          
//           <TouchableOpacity 
//             style={[styles.viewToggleButton, mapView && styles.activeViewToggle]}
//             onPress={() => setMapView(true)}
//           >
//             <Ionicons name="map" size={18} color={mapView ? "#fff" : colors.accent} />
//             <Text style={[styles.viewToggleText, mapView && styles.activeViewToggleText]}>Map</Text>
//           </TouchableOpacity>
//         </View>

//         {/* Enhanced Recent Searches */}
//         {!mapView && searchResults.length === 0 && recentSearches.length > 0 && !isSearching && !searchQuery && (
//           <View style={styles.recentSearchesContainer}>
//             <Text style={styles.sectionTitle}>Recent Searches</Text>
//             <View style={styles.recentSearches}>
//               {recentSearches.map((search, index) => (
//                 <TouchableOpacity 
//                   key={index} 
//                   style={styles.recentSearchItem}
//                   onPress={() => setSearchQuery(search)}
//                 >
//                   <Ionicons name="time-outline" size={14} color={colors.accent} />
//                   <Text style={styles.recentSearchText}>{search}</Text>
//                 </TouchableOpacity>
//               ))}
//             </View>
//           </View>
//         )}

//         {/* Enhanced Search Results */}
//         <View style={styles.resultsContainer}>
//           {/* Results Count */}
//           {(searchResults.length > 0 || (!searchQuery && mapView)) && (
//             <Text style={styles.resultsCount}>
//               {searchQuery ? (
//                 `Found ${searchResults.length} result${searchResults.length !== 1 ? 's' : ''}`
//               ) : (
//                 `Showing ${shops.filter(s => s.latitude && s.longitude).length} shops near you`
//               )}
//               {mapView && (
//                 <Text style={styles.mapResultsCount}>
//                   {" "}({mapItems.length} on map)
//                 </Text>
//               )}
//             </Text>
//           )}
          
//           {mapView ? (
//             // Enhanced Map View
//             <View style={styles.mapContainer}>
//               <MapView 
//                 style={styles.map}
//                 initialRegion={{
//                   latitude: currentLocation?.latitude || 28.6130,
//                   longitude: currentLocation?.longitude || 77.2259,
//                   latitudeDelta: 0.1,
//                   longitudeDelta: 0.1,
//                 }}
//                 showsUserLocation={true}
//                 showsMyLocationButton={true}
//               >
//                 {/* User Location Marker */}
//                 {currentLocation && (
//                   <Marker
//                     coordinate={currentLocation}
//                     title="Your Location"
//                     pinColor={colors.accent}
//                   />
//                 )}
                
//                 {/* Item Markers */}
//                 {mapItems.map((item) => {
//                   const isShop = 'ownerName' in item && !('description' in item);
//                   return (
//                     <Marker
//                       key={item.id}
//                       coordinate={{
//                         latitude: item.latitude!,
//                         longitude: item.longitude!,
//                       }}
//                       title={isShop ? (item as Shop).shopName : (item as Product).name}
//                       description={getLocationAddress(item)}
//                       onPress={() => setSelectedItem(item)}
//                     >
//                       <View style={[
//                         styles.marker,
//                         isShop ? styles.shopMarker : styles.productMarker
//                       ]}>
//                         <Ionicons 
//                           name={isShop ? "storefront" : "cube"} 
//                           size={16} 
//                           color="#fff" 
//                         />
//                       </View>
//                     </Marker>
//                   );
//                 })}
//               </MapView>
              
//               {/* Enhanced Selected Item Info */}
//               {selectedItem && (
//                 <View style={styles.selectedItemCard}>
//                   <View style={styles.selectedItemHeader}>
//                     {('shopLogo' in selectedItem && selectedItem.shopLogo) ? (
//                       <Image source={{ uri: selectedItem.shopLogo }} style={styles.selectedItemImage} />
//                     ) : ('image' in selectedItem && (selectedItem as Product).image) ? (
//                       <Image source={{ uri: (selectedItem as Product).image }} style={styles.selectedItemImage} />
//                     ) : ('imageUrl' in selectedItem && (selectedItem as Product).imageUrl) ? (
//                       <Image source={{ uri: (selectedItem as Product).imageUrl }} style={styles.selectedItemImage} />
//                     ) : (
//                       <View style={styles.selectedItemImagePlaceholder}>
//                         <Ionicons name={'ownerName' in selectedItem ? "storefront" : "cube"} size={20} color={colors.accent} />
//                       </View>
//                     )}
//                     <View style={styles.selectedItemInfo}>
//                       <Text style={styles.selectedItemTitle}>
//                         {'shopName' in selectedItem ? selectedItem.shopName : selectedItem.name}
//                       </Text>
//                       {'price' in selectedItem && selectedItem.price && selectedItem.price > 0 && (
//                         <Text style={styles.selectedItemPrice}>${selectedItem.price}</Text>
//                       )}
//                     </View>
//                   </View>
                  
//                   <Text style={styles.selectedItemAddress}>
//                     📍 {getLocationAddress(selectedItem)}
//                   </Text>
                  
//                   {'ownerName' in selectedItem && (
//                     <Text style={styles.selectedItemDetail}>👤 {selectedItem.ownerName}</Text>
//                   )}
                  
//                   {'description' in selectedItem && selectedItem.description && (
//                     <Text style={styles.selectedItemDetail}>{selectedItem.description}</Text>
//                   )}
                  
//                   <View style={styles.actionButtons}>
//                     <TouchableOpacity 
//                       style={styles.actionButton}
//                       onPress={() => setSelectedItem(null)}
//                     >
//                       <Text style={styles.actionButtonText}>Close</Text>
//                     </TouchableOpacity>
                    
//                     {'ownerName' in selectedItem ? (
//                       <TouchableOpacity 
//                         style={[styles.actionButton, styles.primaryActionButton]}
//                         onPress={() => handleViewShopDetails(selectedItem as Shop)}
//                       >
//                         <Ionicons name="eye" size={14} color="#fff" />
//                         <Text style={styles.primaryActionButtonText}>View Shop</Text>
//                       </TouchableOpacity>
//                     ) : (
//                       <TouchableOpacity 
//                         style={[styles.actionButton, styles.primaryActionButton]}
//                         onPress={() => handleViewProductDetails(selectedItem as Product)}
//                       >
//                         <Ionicons name="cube" size={14} color="#fff" />
//                         <Text style={styles.primaryActionButtonText}>View Product</Text>
//                       </TouchableOpacity>
//                     )}
//                   </View>
//                 </View>
//               )}

//               {/* No Location Warning */}
//               {searchQuery && mapItems.length === 0 && (
//                 <View style={styles.noLocationWarning}>
//                   <Ionicons name="location-outline" size={40} color={colors.textSecondary} />
//                   <Text style={styles.noLocationText}>No locations found for your search</Text>
//                   <Text style={styles.noLocationSubText}>Try searching for something else</Text>
//                 </View>
//               )}
//             </View>
//           ) : (
//             // Enhanced List View
//             <>
//               {searchResults.length > 0 ? (
//                 <FlatList
//                   data={searchResults}
//                   keyExtractor={(item) => item.id}
//                   showsVerticalScrollIndicator={false}
//                   contentContainerStyle={styles.listContent}
//                   renderItem={({ item, index }) => (
//                     <ProductCard 
//                       item={item} 
//                       index={index}
//                       onViewShopDetails={handleViewShopDetails}
//                       onViewProductDetails={handleViewProductDetails}
//                     />
//                   )}
//                 />
//               ) : searchQuery ? (
//                 <View style={styles.noResultsContainer}>
//                   <Ionicons name="search-outline" size={60} color={colors.textSecondary} />
//                   <Text style={styles.noResultsText}>No results found for "{searchQuery}"</Text>
//                   <Text style={styles.noResultsSubText}>Try different keywords</Text>
//                 </View>
//               ) : (
//                 <View style={styles.initialStateContainer}>
//                   <Ionicons name="search-outline" size={80} color={colors.textSecondary} />
//                   <Text style={styles.initialStateText}>Search for shops or products</Text>
//                   <Text style={styles.initialStateSubText}>
//                     Find what you're looking for by typing in the search bar above
//                   </Text>
//                 </View>
//               )}
//             </>
//           )}
//         </View>
//       </Animated.View>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: colors.background,
//     marginTop: 27
//   },
//   animatedContainer: {
//     flex: 1,
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 20,
//     paddingVertical: 16,
//     backgroundColor: colors.surface,
//     borderBottomWidth: 1,
//     borderBottomColor: colors.border,
//     shadowColor: 'rgba(0, 0, 0, 0.1)',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   headerButton: {
//     width: 40,
//     height: 40,
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderRadius: 20,
//     backgroundColor: colors.lightBackground,
//   },
//   headerTitleContainer: {
//     alignItems: 'center',
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: '800',
//     color: colors.textPrimary,
//     letterSpacing: 1,
//   },
//   headerSubtitle: {
//     fontSize: 12,
//     color: colors.accent,
//     fontWeight: '500',
//     marginTop: 2,
//   },
//   searchContainer: {
//     padding: 20,
//     paddingBottom: 12,
//   },
//   searchInputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: colors.surface,
//     borderRadius: 16,
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderWidth: 2,
//     borderColor: colors.border,
//     shadowColor: 'rgba(0, 0, 0, 0.1)',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   searchIcon: {
//     marginRight: 12,
//   },
//   searchInput: {
//     flex: 1,
//     fontSize: 16,
//     color: colors.textPrimary,
//     padding: 0,
//     fontWeight: '500',
//   },
//   clearButton: {
//     padding: 4,
//   },
//   viewToggleContainer: {
//     flexDirection: 'row',
//     marginHorizontal: 20,
//     marginBottom: 16,
//     backgroundColor: colors.surface,
//     borderRadius: 12,
//     padding: 4,
//     borderWidth: 2,
//     borderColor: colors.border,
//     shadowColor: 'rgba(0, 0, 0, 0.1)',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   viewToggleButton: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 10,
//     borderRadius: 8,
//     gap: 6,
//   },
//   activeViewToggle: {
//     backgroundColor: colors.accent,
//   },
//   viewToggleText: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: colors.accent,
//   },
//   activeViewToggleText: {
//     color: '#fff',
//   },
//   resultsContainer: {
//     flex: 1,
//   },
//   resultsCount: {
//     paddingHorizontal: 20,
//     paddingVertical: 12,
//     fontSize: 14,
//     color: colors.textSecondary,
//     backgroundColor: colors.surface,
//     fontWeight: '500',
//     borderBottomWidth: 1,
//     borderBottomColor: colors.border,
//   },
//   mapResultsCount: {
//     color: colors.accent,
//     fontWeight: '600',
//   },
//   listContent: {
//     paddingBottom: 20,
//   },
//   card: {
//     flexDirection: 'row',
//     backgroundColor: colors.surface,
//     marginHorizontal: 20,
//     marginVertical: 6,
//     padding: 16,
//     borderRadius: 16,
//     shadowColor: 'rgba(0, 0, 0, 0.15)',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 12,
//     elevation: 5,
//     borderWidth: 1,
//     borderColor: colors.border,
//   },
//   itemImage: {
//     width: 60,
//     height: 60,
//     borderRadius: 12,
//     marginRight: 16,
//   },
//   hiddenImage: {
//     position: 'absolute',
//     opacity: 0,
//   },
//   imageLoader: {
//     position: 'absolute',
//     width: 60,
//     height: 60,
//     borderRadius: 12,
//     backgroundColor: colors.lightBackground,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 16,
//     zIndex: 1,
//   },
//   imagePlaceholder: {
//     width: 60,
//     height: 60,
//     borderRadius: 12,
//     backgroundColor: colors.lightBackground,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 16,
//     borderWidth: 2,
//     borderColor: colors.border,
//   },
//   cardContent: {
//     flex: 1,
//     justifyContent: 'center',
//   },
//   cardTitle: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: colors.textPrimary,
//     marginBottom: 4,
//   },
//   cardDescription: {
//     fontSize: 14,
//     color: colors.textSecondary,
//     marginBottom: 6,
//     lineHeight: 18,
//   },
//   cardPrice: {
//     fontSize: 15,
//     color: colors.success,
//     fontWeight: '600',
//     marginBottom: 2,
//   },
//   cardCategory: {
//     fontSize: 13,
//     color: colors.accent,
//     marginBottom: 2,
//     fontWeight: '500',
//   },
//   cardAddress: {
//     fontSize: 13,
//     color: colors.textSecondary,
//     marginBottom: 8,
//     fontWeight: '500',
//   },
//   viewDetailsButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: colors.accent,
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 8,
//     alignSelf: 'flex-start',
//     marginTop: 4,
//     gap: 4,
//   },
//   viewDetailsButtonText: {
//     color: '#fff',
//     fontSize: 12,
//     fontWeight: '600',
//   },
//   mapContainer: {
//     flex: 1,
//     position: 'relative',
//   },
//   map: {
//     width: '100%',
//     height: '100%',
//   },
//   marker: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     backgroundColor: colors.accent,
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 2,
//     borderColor: '#fff',
//     shadowColor: 'rgba(0, 0, 0, 0.3)',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.3,
//     shadowRadius: 4,
//     elevation: 6,
//   },
//   shopMarker: {
//     backgroundColor: colors.accent,
//   },
//   productMarker: {
//     backgroundColor: colors.accentLight,
//   },
//   selectedItemCard: {
//     position: 'absolute',
//     bottom: 20,
//     left: 20,
//     right: 20,
//     backgroundColor: colors.surface,
//     borderRadius: 20,
//     padding: 20,
//     shadowColor: 'rgba(0, 0, 0, 0.2)',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.2,
//     shadowRadius: 16,
//     elevation: 12,
//     borderWidth: 1,
//     borderColor: colors.border,
//   },
//   selectedItemHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   selectedItemImage: {
//     width: 50,
//     height: 50,
//     borderRadius: 12,
//     marginRight: 12,
//   },
//   selectedItemImagePlaceholder: {
//     width: 50,
//     height: 50,
//     borderRadius: 12,
//     backgroundColor: colors.lightBackground,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 12,
//     borderWidth: 2,
//     borderColor: colors.border,
//   },
//   selectedItemInfo: {
//     flex: 1,
//   },
//   selectedItemTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: colors.textPrimary,
//     marginBottom: 2,
//   },
//   selectedItemPrice: {
//     fontSize: 16,
//     color: colors.success,
//     fontWeight: '600',
//   },
//   selectedItemAddress: {
//     fontSize: 14,
//     color: colors.textSecondary,
//     marginBottom: 6,
//     fontWeight: '500',
//   },
//   selectedItemDetail: {
//     fontSize: 14,
//     color: colors.textSecondary,
//     marginBottom: 4,
//     lineHeight: 18,
//   },
//   actionButtons: {
//     flexDirection: 'row',
//     gap: 10,
//     marginTop: 12,
//   },
//   actionButton: {
//     flex: 1,
//     paddingVertical: 12,
//     borderRadius: 10,
//     alignItems: 'center',
//     borderWidth: 2,
//     borderColor: colors.border,
//     backgroundColor: colors.surface,
//   },
//   primaryActionButton: {
//     backgroundColor: colors.accent,
//     borderColor: colors.accent,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     gap: 6,
//   },
//   actionButtonText: {
//     color: colors.accent,
//     fontWeight: '600',
//     fontSize: 14,
//   },
//   primaryActionButtonText: {
//     color: '#fff',
//     fontWeight: '600',
//     fontSize: 14,
//   },
//   sidePanel: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     bottom: 0,
//     width: '80%',
//     backgroundColor: colors.surface,
//     zIndex: 1000,
//     shadowColor: 'rgba(0, 0, 0, 0.2)',
//     shadowOffset: { width: 2, height: 0 },
//     shadowOpacity: 0.2,
//     shadowRadius: 12,
//     elevation: 16,
//   },
//   sidePanelClose: {
//     padding: 16,
//     alignSelf: 'flex-end',
//   },
//   sidePanelHeader: {
//     padding: 20,
//     borderBottomWidth: 1,
//     borderBottomColor: colors.border,
//     backgroundColor: colors.surface,
//   },
//   sidePanelTitle: {
//     fontSize: 20,
//     fontWeight: '800',
//     color: colors.textPrimary,
//     letterSpacing: 1,
//   },
//   sidePanelSubtitle: {
//     fontSize: 12,
//     color: colors.accent,
//     fontWeight: '500',
//     marginTop: 4,
//   },
//   menuItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 16,
//     paddingLeft: 20,
//     borderBottomWidth: 1,
//     borderBottomColor: colors.border,
//   },
//   activeMenuItem: {
//     backgroundColor: colors.lightBackground,
//     borderLeftWidth: 4,
//     borderLeftColor: colors.accent,
//   },
//   menuItemText: {
//     marginLeft: 16,
//     fontSize: 16,
//     color: colors.textPrimary,
//     fontWeight: '500',
//   },
//   recentSearchesContainer: {
//     padding: 20,
//   },
//   sectionTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: colors.textPrimary,
//     marginBottom: 12,
//   },
//   recentSearches: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 8,
//   },
//   recentSearchItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: colors.surface,
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 16,
//     borderWidth: 2,
//     borderColor: colors.border,
//   },
//   recentSearchText: {
//     marginLeft: 6,
//     fontSize: 14,
//     color: colors.accent,
//     fontWeight: '500',
//   },
//   noResultsContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 40,
//   },
//   noResultsText: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: colors.textPrimary,
//     marginTop: 20,
//     textAlign: 'center',
//   },
//   noResultsSubText: {
//     fontSize: 14,
//     color: colors.textSecondary,
//     marginTop: 8,
//     textAlign: 'center',
//   },
//   noLocationWarning: {
//     position: 'absolute',
//     top: '50%',
//     left: 20,
//     right: 20,
//     alignItems: 'center',
//     transform: [{ translateY: -50 }],
//   },
//   noLocationText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: colors.textPrimary,
//     marginTop: 12,
//     textAlign: 'center',
//   },
//   noLocationSubText: {
//     fontSize: 14,
//     color: colors.textSecondary,
//     marginTop: 6,
//     textAlign: 'center',
//   },
//   initialStateContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 40,
//   },
//   initialStateText: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: colors.textPrimary,
//     marginTop: 20,
//     textAlign: 'center',
//   },
//   initialStateSubText: {
//     fontSize: 14,
//     color: colors.textSecondary,
//     marginTop: 10,
//     textAlign: 'center',
//     lineHeight: 20,
//   },
// });

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
import * as Location from 'expo-location';
import { db } from "../../../firebaseConfig";

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

const { width, height } = Dimensions.get('window');

// Product Card Component with Image Handling
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
  const [cardAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));

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

  const renderImage = () => {
    if (imageUrl && !imageError) {
      return (
        <>
          {imageLoading && (
            <View style={styles.imageLoader}>
              <ActivityIndicator size="small" color={colors.accent} />
            </View>
          )}
          <Image 
            source={{ uri: imageUrl }} 
            style={[
              styles.itemImage,
              imageLoading && styles.hiddenImage
            ]}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        </>
      );
    }

    return (
      <View style={styles.imagePlaceholder}>
        <Ionicons 
          name={isShop ? "storefront" : "cube"} 
          size={24} 
          color={colors.accent} 
        />
      </View>
    );
  };

  return (
    <Animated.View
      style={[
        styles.card,
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
      
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>
          {isShop ? (item as Shop).shopName : (item as Product).name}
        </Text>
        
        <Text style={styles.cardDescription} numberOfLines={2}>
          {isShop ? `Owner: ${(item as Shop).ownerName}` : (item as Product).description}
        </Text>
        
        {!isShop && (item as Product).price && (item as Product).price > 0 && (
          <Text style={styles.cardPrice}>${(item as Product).price}</Text>
        )}
        
        {(item as Product).category && (
          <Text style={styles.cardCategory}>{(item as Product).category}</Text>
        )}
        
        <View style={styles.cardFooter}>
          <Text style={styles.cardAddress} numberOfLines={1}>
            📍 {getLocationAddress(item)}
          </Text>
          
          {isShop ? (
            <TouchableOpacity 
              style={styles.viewDetailsButton}
              onPress={() => onViewShopDetails(item as Shop)}
            >
              <Ionicons name="eye-outline" size={14} color="#fff" />
              <Text style={styles.viewDetailsButtonText}>View Shop</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.viewDetailsButton}
              onPress={() => onViewProductDetails(item as Product)}
            >
              <Ionicons name="cube-outline" size={14} color="#fff" />
              <Text style={styles.viewDetailsButtonText}>View Product</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Animated.View>
  );
});

// Enhanced Search Screen
export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<(Product | Shop)[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [sidePanelVisible, setSidePanelVisible] = useState(false);
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
  const slideAnim = useState(new Animated.Value(300))[0];

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
          longitude: data.longitude
        };
      });
      setProducts(productsData);
    } catch (err) {
      console.log("Error loading products:", err);
    }
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
            email: shopData?.email || ''
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
            email: ''
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

  // Enhanced Side Panel
  const SidePanel = () => {
    useEffect(() => {
      if (sidePanelVisible) {
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    }, [sidePanelVisible]);

    const closePanel = () => {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setSidePanelVisible(false));
    };

    return (
      <Animated.View 
        style={[
          styles.sidePanel,
          { transform: [{ translateX: slideAnim }] }
        ]}
      >
        <TouchableOpacity 
          style={styles.sidePanelClose} 
          onPress={closePanel}
        >
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        
        <View style={styles.sidePanelHeader}>
          <Text style={styles.sidePanelTitle}>RAMSHOP</Text>
          <Text style={styles.sidePanelSubtitle}>Discover • Connect • Shop</Text>
        </View>
        
        {[
          { name: "Home", icon: "home-outline", route: "/customer/home" as Href},
          { name: "Search", icon: "search", route: null },
          { name: "Messages", icon: "chatbubble-outline", route: "/customer/messages" as Href},
          { name: "Orders", icon: "list-outline", route: "/customer/myorders" as Href},
          { name: "Profile", icon: "person-outline", route: "/customer/profile" as Href},
        ].map((item, index) => (
          <TouchableOpacity 
            key={index}
            style={[styles.menuItem, item.name === "Search" && styles.activeMenuItem]}
            onPress={() => {
              closePanel();
              if (item.route) {
                router.push(item.route);
              }
            }}
          >
            <Ionicons name={item.icon as any} size={20} color={colors.accent} />
            <Text style={styles.menuItemText}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
    );
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
                      placeholder="$0"
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
                      placeholder="$1000"
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

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim }]}>
        {/* Enhanced Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => setSidePanelVisible(true)}
            style={styles.headerButton}
          >
            <Ionicons name="menu" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>MARKETMATE</Text>
            <Text style={styles.headerSubtitle}>Search</Text>
          </View>
          <View style={styles.headerButton} />
        </View>

        {/* Side Panel */}
        {sidePanelVisible && <SidePanel />}

        {/* Filter Modal */}
        <FilterModal />

        {/* Enhanced Search Bar with Filter Button */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="rgba(23, 104, 217, 1)" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search shops, products, or locations..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              clearButtonMode="while-editing"
              placeholderTextColor="rgba(144, 186, 242, 0.8)"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color="rgba(144, 186, 242, 1)" />
              </TouchableOpacity>
            )}
          </View>
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
                      Min: ${activeFilters.minPrice}
                    </Text>
                    <TouchableOpacity onPress={() => setActiveFilters(prev => ({ ...prev, minPrice: null }))}>
                      <Ionicons name="close" size={14} color={colors.surface} />
                    </TouchableOpacity>
                  </View>
                )}
                {activeFilters.maxPrice !== null && (
                  <View style={styles.activeFilterTag}>
                    <Text style={styles.activeFilterTagText}>
                      Max: ${activeFilters.maxPrice}
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
            <Ionicons name="list" size={18} color={!mapView ? "#fff" : colors.accent} />
            <Text style={[styles.viewToggleText, !mapView && styles.activeViewToggleText]}>List</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.viewToggleButton, mapView && styles.activeViewToggle]}
            onPress={() => setMapView(true)}
          >
            <Ionicons name="map" size={18} color={mapView ? "#fff" : colors.accent} />
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
                        <Text style={styles.selectedItemPrice}>${selectedItem.price}</Text>
                      )}
                    </View>
                  </View>
                  
                  <Text style={styles.selectedItemAddress}>
                    📍 {getLocationAddress(selectedItem)}
                  </Text>
                  
                  {'ownerName' in selectedItem && (
                    <Text style={styles.selectedItemDetail}>👤 {selectedItem.ownerName}</Text>
                  )}
                  
                  {'description' in selectedItem && selectedItem.description && (
                    <Text style={styles.selectedItemDetail}>{selectedItem.description}</Text>
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
            // Enhanced List View
            <>
              {searchResults.length > 0 ? (
                <FlatList
                  data={searchResults}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.listContent}
                  renderItem={({ item, index }) => (
                    <ProductCard 
                      item={item} 
                      index={index}
                      onViewShopDetails={handleViewShopDetails}
                      onViewProductDetails={handleViewProductDetails}
                    />
                  )}
                />
              ) : searchQuery ? (
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
              )}
            </>
          )}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    marginTop:27
  },
  animatedContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.lightBackground,
    backgroundColor: colors.lightBackground,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
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
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
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
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
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
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    borderWidth: 2,
    borderColor: colors.border,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
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
    color: colors.accent,
  },
  activeViewToggleText: {
    color: '#fff',
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
    color: colors.textSecondary,
    backgroundColor: colors.surface,
    fontWeight: '500',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  mapResultsCount: {
    color: colors.accent,
    color: colors.accent,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 20,
    paddingTop: 8,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginVertical: 6,
    padding: 16,
    borderRadius: 16,
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  hiddenImage: {
    position: 'absolute',
    opacity: 0,
  },
  imageLoader: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: 'rgba(208, 226, 250, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    zIndex: 1,
  },
  imagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: 'rgba(208, 226, 250, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'rgba(144, 186, 242, 0.3)',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(4, 18, 36, 1)',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: 'rgba(4, 18, 36, 0.7)',
    marginBottom: 6,
    lineHeight: 18,
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardPrice: {
    fontSize: 15,
    color: 'rgba(23, 104, 217, 1)',
    fontWeight: '600',
  },
  cardCategory: {
    fontSize: 13,
    color: 'rgba(144, 186, 242, 1)',
    marginBottom: 2,
    fontWeight: '500',
  },
  cardAddress: {
    fontSize: 13,
    color: 'rgba(4, 18, 36, 0.6)',
    marginBottom: 8,
    fontWeight: '500',
    flex: 1,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(23, 104, 217, 1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  viewDetailsButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
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
    shadowColor: 'rgba(4, 18, 36, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  shopMarker: {
    backgroundColor: colors.accent,
  },
  productMarker: {
    backgroundColor: 'rgba(144, 186, 242, 1)',
  },
  selectedItemCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: 'rgba(4, 18, 36, 0.2)',
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
    backgroundColor: 'rgba(208, 226, 250, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'rgba(144, 186, 242, 0.3)',
  },
  selectedItemInfo: {
    flex: 1,
  },
  selectedItemTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(4, 18, 36, 1)',
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
    borderColor: 'rgba(144, 186, 242, 0.4)',
    backgroundColor: '#ffffff',
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
    color: 'rgba(23, 104, 217, 1)',
    fontWeight: '600',
    fontSize: 14,
  },
  primaryActionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  sidePanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '80%',
    backgroundColor: colors.surface,
    zIndex: 1000,
    shadowColor: 'rgba(4, 18, 36, 0.2)',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 16,
  },
  sidePanelClose: {
    padding: 16,
    alignSelf: 'flex-end',
  },
  sidePanelHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  sidePanelTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: 'rgba(4, 18, 36, 1)',
    letterSpacing: 1,
  },
  sidePanelSubtitle: {
    fontSize: 12,
    color: 'rgba(23, 104, 217, 0.8)',
    fontWeight: '500',
    marginTop: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingLeft: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  activeMenuItem: {
    backgroundColor: colors.lightBackground,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  menuItemText: {
    marginLeft: 16,
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
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
    borderColor: 'rgba(144, 186, 242, 0.4)',
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
    color: 'rgba(4, 18, 36, 1)',
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
    color: 'rgba(4, 18, 36, 1)',
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

