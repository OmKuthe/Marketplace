// import { Ionicons } from '@expo/vector-icons';
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { useRouter } from "expo-router";
// import { collection, getDocs, orderBy, query } from "firebase/firestore";
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
//   Alert
// } from "react-native";
// import MapView, { Marker } from 'react-native-maps';
// import * as Location from 'expo-location';
// import { db } from "../../../firebaseConfig";

// type Product = {
//   id: string;
//   name: string;
//   description: string;
//   image?: string;
//   category?: string;
//   price?: number;
//   createdAt?: { seconds: number; nanoseconds: number };
//   latitude?: number;
//   longitude?: number;
//   address?: string;
//   shopId?: string;
//   shopName?: string;
//   shopLogo?: string;
//   ownerName?: string;
//   phone?: string;
//   email?: string;
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

// const { width, height } = Dimensions.get('window');

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

//   // Load initial data only once
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
//       const productsData: Product[] = snapshot.docs.map((doc) => ({
//         id: doc.id,
//         ...(doc.data() as Omit<Product, "id">),
//       }));
//       setProducts(productsData);
//     } catch (err) {
//       console.log("Error loading products:", err);
//     }
//   };

//   // Simple search function without useCallback
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

//       // Combine results - shops first, then products
//       const combinedResults = [...filteredShops, ...filteredProducts];
//       setSearchResults(combinedResults);

//     } catch (err) {
//       console.log("Error searching:", err);
//     } finally {
//       setIsSearching(false);
//     }
//   };

//   // Simplified useEffect - only trigger search when searchQuery changes
//   useEffect(() => {
//     if (searchQuery.trim()) {
//       const timeoutId = setTimeout(() => {
//         handleSearch();
//       }, 500);

//       return () => clearTimeout(timeoutId);
//     } else {
//       setSearchResults([]);
//     }
//   }, [searchQuery]); // Only depend on searchQuery

//   const clearSearch = () => {
//     setSearchQuery("");
//     setSearchResults([]);
//     setSelectedItem(null);
//   };

//   // Function to handle phone calls
//   const handleCall = (phoneNumber: string) => {
//     if (!phoneNumber) return;
    
//     const phoneUrl = `tel:${phoneNumber}`;
//     Linking.canOpenURL(phoneUrl)
//       .then(supported => {
//         if (supported) {
//           Linking.openURL(phoneUrl);
//         } else {
//           Alert.alert('Error', 'Phone calls are not supported on this device');
//         }
//       })
//       .catch(err => {
//         console.log('Error making call:', err);
//         Alert.alert('Error', 'Unable to make phone call');
//       });
//   };

//   const getLocationAddress = (item: Product | Shop) => {
//     if ('location' in item && item.location) {
//       if (item.location.includes('Lat:')) {
//         return 'Nearby location';
//       }
//       return item.location;
//     }
//     if (item.address) {
//       return item.address;
//     }
//     if (item.latitude && item.longitude) {
//       return 'Nearby location';
//     }
//     return "Location not available";
//   };

//   const SidePanel = () => (
//     <View style={styles.sidePanel}>
//       <TouchableOpacity 
//         style={styles.sidePanelClose} 
//         onPress={() => setSidePanelVisible(false)}
//       >
//         <Ionicons name="close" size={24} color="#333" />
//       </TouchableOpacity>
      
//       <View style={styles.sidePanelHeader}>
//         <Text style={styles.sidePanelTitle}>Menu</Text>
//       </View>
      
//       {[
//         { name: "Home", icon: "home", route: "/customer/home" },
//         { name: "Search", icon: "search", route: null },
//         { name: "Messages", icon: "chatbubbles", route: "/customer/messages" },
//         { name: "Orders", icon: "list", route: "/customer/myorders" },
//         { name: "Profile", icon: "person", route: "/customer/profile" },
//       ].map((item, index) => (
//         <TouchableOpacity 
//           key={index}
//           style={[styles.menuItem, item.name === "Search" && styles.activeMenuItem]}
//           onPress={() => {
//             setSidePanelVisible(false);
//             if (item.route) {
//               router.push(item.route);
//             }
//           }}
//         >
//           <Ionicons name={item.icon as any} size={20} color="#007AFF" />
//           <Text style={styles.menuItemText}>{item.name}</Text>
//         </TouchableOpacity>
//       ))}
//     </View>
//   );

//   const renderProductCard = ({ item }: { item: Product | Shop }) => {
//     const isShop = 'ownerName' in item && !('description' in item);
//     const imageUrl = isShop ? (item as Shop).shopLogo : (item as Product).image;
    
//     return (
//       <TouchableOpacity style={styles.card}>
//         {imageUrl ? (
//           <Image source={{ uri: imageUrl }} style={styles.itemImage} />
//         ) : (
//           <View style={styles.imagePlaceholder}>
//             <Ionicons name={isShop ? "storefront" : "cube"} size={24} color="#007AFF" />
//           </View>
//         )}
//         <View style={styles.cardContent}>
//           <Text style={styles.cardTitle}>{isShop ? (item as Shop).shopName : (item as Product).name}</Text>
//           <Text style={styles.cardDescription}>
//             {isShop ? `Owner: ${(item as Shop).ownerName}` : (item as Product).description}
//           </Text>
//           {!isShop && (item as Product).price && (item as Product).price > 0 && (
//             <Text style={styles.cardPrice}>💰 ${(item as Product).price}</Text>
//           )}
//           {(item as Product).category && (
//             <Text style={styles.cardCategory}>📂 {(item as Product).category}</Text>
//           )}
//           <Text style={styles.cardAddress}>📍 {getLocationAddress(item)}</Text>
//           {isShop && (item as Shop).phone && (
//             <TouchableOpacity 
//               style={styles.phoneButton}
//               onPress={() => handleCall((item as Shop).phone)}
//             >
//               <Ionicons name="call" size={14} color="#fff" />
//               <Text style={styles.phoneButtonText}>Call {(item as Shop).phone}</Text>
//             </TouchableOpacity>
//           )}
//         </View>
//       </TouchableOpacity>
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
//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => setSidePanelVisible(true)}>
//           <Ionicons name="menu" size={28} color="#333" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>🔍 Search</Text>
//         <View style={{ width: 28 }} />
//       </View>

//       {/* Side Panel */}
//       {sidePanelVisible && <SidePanel />}

//       {/* Search Bar */}
//       <View style={styles.searchContainer}>
//         <View style={styles.searchInputContainer}>
//           <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
//           <TextInput
//             style={styles.searchInput}
//             placeholder="Search shops, products, or locations..."
//             value={searchQuery}
//             onChangeText={setSearchQuery}
//             returnKeyType="search"
//             clearButtonMode="while-editing"
//           />
//           {searchQuery.length > 0 && (
//             <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
//               <Ionicons name="close-circle" size={20} color="#999" />
//             </TouchableOpacity>
//           )}
//         </View>
//       </View>

//       {/* View Toggle */}
//       <View style={styles.viewToggleContainer}>
//         <TouchableOpacity 
//           style={[styles.viewToggleButton, !mapView && styles.activeViewToggle]}
//           onPress={() => setMapView(false)}
//         >
//           <Ionicons name="list" size={20} color={!mapView ? "#fff" : "#007AFF"} />
//           <Text style={[styles.viewToggleText, !mapView && styles.activeViewToggleText]}>List</Text>
//         </TouchableOpacity>
        
//         <TouchableOpacity 
//           style={[styles.viewToggleButton, mapView && styles.activeViewToggle]}
//           onPress={() => setMapView(true)}
//         >
//           <Ionicons name="map" size={20} color={mapView ? "#fff" : "#007AFF"} />
//           <Text style={[styles.viewToggleText, mapView && styles.activeViewToggleText]}>Map</Text>
//         </TouchableOpacity>
//       </View>

//       {/* Recent Searches */}
//       {!mapView && searchResults.length === 0 && recentSearches.length > 0 && !isSearching && !searchQuery && (
//         <View style={styles.recentSearchesContainer}>
//           <Text style={styles.sectionTitle}>Recent Searches</Text>
//           <View style={styles.recentSearches}>
//             {recentSearches.map((search, index) => (
//               <TouchableOpacity 
//                 key={index} 
//                 style={styles.recentSearchItem}
//                 onPress={() => setSearchQuery(search)}
//               >
//                 <Ionicons name="time-outline" size={16} color="#777" />
//                 <Text style={styles.recentSearchText}>{search}</Text>
//               </TouchableOpacity>
//             ))}
//           </View>
//         </View>
//       )}

//       {/* Search Results */}
//       {isSearching ? (
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#007AFF" />
//           <Text style={styles.loadingText}>Searching...</Text>
//         </View>
//       ) : (
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
//             // MAP VIEW
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
//                     pinColor="blue"
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
//                         <Text style={styles.markerText}>
//                           {isShop ? "🏪" : "📦"}
//                         </Text>
//                       </View>
//                     </Marker>
//                   );
//                 })}
//               </MapView>
              
//               {/* Selected Item Info */}
//               {selectedItem && (
//                 <View style={styles.selectedItemCard}>
//                   <View style={styles.selectedItemHeader}>
//                     {('shopLogo' in selectedItem && selectedItem.shopLogo) ? (
//                       <Image source={{ uri: selectedItem.shopLogo }} style={styles.selectedItemImage} />
//                     ) : ('image' in selectedItem && selectedItem.image) ? (
//                       <Image source={{ uri: selectedItem.image }} style={styles.selectedItemImage} />
//                     ) : (
//                       <View style={styles.selectedItemImagePlaceholder}>
//                         <Ionicons name={'ownerName' in selectedItem ? "storefront" : "cube"} size={24} color="#007AFF" />
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
//                     <Text style={styles.selectedItemDetail}>👤 Owner: {selectedItem.ownerName}</Text>
//                   )}
                  
//                   {'description' in selectedItem && selectedItem.description && (
//                     <Text style={styles.selectedItemDetail}>{selectedItem.description}</Text>
//                   )}
                  
//                   <View style={styles.actionButtons}>
//                     <TouchableOpacity 
//                       style={styles.closeButton}
//                       onPress={() => setSelectedItem(null)}
//                     >
//                       <Text style={styles.closeButtonText}>Close</Text>
//                     </TouchableOpacity>
                    
//                     {'phone' in selectedItem && selectedItem.phone && (
//                       <TouchableOpacity 
//                         style={styles.callButton}
//                         onPress={() => handleCall(selectedItem.phone)}
//                       >
//                         <Ionicons name="call" size={16} color="#fff" />
//                         <Text style={styles.callButtonText}>Call</Text>
//                       </TouchableOpacity>
//                     )}
//                   </View>
//                 </View>
//               )}

//               {/* No Location Warning */}
//               {searchQuery && mapItems.length === 0 && (
//                 <View style={styles.noLocationWarning}>
//                   <Ionicons name="location-outline" size={40} color="#ccc" />
//                   <Text style={styles.noLocationText}>No locations found for your search</Text>
//                   <Text style={styles.noLocationSubText}>Try searching for something else</Text>
//                 </View>
//               )}
//             </View>
//           ) : (
//             // LIST VIEW
//             <>
//               {searchResults.length > 0 ? (
//                 <FlatList
//                   data={searchResults}
//                   keyExtractor={(item) => item.id}
//                   showsVerticalScrollIndicator={false}
//                   contentContainerStyle={styles.listContent}
//                   renderItem={renderProductCard}
//                 />
//               ) : searchQuery ? (
//                 <View style={styles.noResultsContainer}>
//                   <Ionicons name="search-outline" size={60} color="#ccc" />
//                   <Text style={styles.noResultsText}>No results found for "{searchQuery}"</Text>
//                   <Text style={styles.noResultsSubText}>Try different keywords</Text>
//                 </View>
//               ) : (
//                 <View style={styles.initialStateContainer}>
//                   <Ionicons name="search-outline" size={80} color="#f0f0f0" />
//                   <Text style={styles.initialStateText}>Search for shops or products</Text>
//                   <Text style={styles.initialStateSubText}>
//                     Find what you're looking for by typing in the search bar above
//                   </Text>
//                 </View>
//               )}
//             </>
//           )}
//         </View>
//       )}
//     </SafeAreaView>
//   );
// }

// // Keep your existing styles exactly the same
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 20,
//     paddingVertical: 15,
//     borderBottomWidth: 1,
//     borderBottomColor: '#e0e0e0',
//     backgroundColor: '#fff',
//   },
//   headerTitle: {
//     fontSize: 22,
//     fontWeight: '700',
//     color: '#333',
//   },
//   searchContainer: {
//     padding: 20,
//     paddingBottom: 10,
//   },
//   searchInputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#f8f9fa',
//     borderRadius: 15,
//     paddingHorizontal: 15,
//     paddingVertical: 12,
//     borderWidth: 1,
//     borderColor: '#e0e0e0',
//   },
//   searchIcon: {
//     marginRight: 10,
//   },
//   searchInput: {
//     flex: 1,
//     fontSize: 16,
//     color: '#333',
//     padding: 0,
//   },
//   clearButton: {
//     padding: 4,
//   },
//   viewToggleContainer: {
//     flexDirection: 'row',
//     marginHorizontal: 20,
//     marginBottom: 15,
//     backgroundColor: '#f8f9fa',
//     borderRadius: 12,
//     padding: 4,
//     borderWidth: 1,
//     borderColor: '#e0e0e0',
//   },
//   viewToggleButton: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 10,
//     borderRadius: 10,
//     gap: 8,
//   },
//   activeViewToggle: {
//     backgroundColor: '#007AFF',
//     shadowColor: '#007AFF',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 3,
//     elevation: 3,
//   },
//   viewToggleText: {
//     fontSize: 15,
//     fontWeight: '600',
//     color: '#007AFF',
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
//     color: '#666',
//     backgroundColor: '#f8f9fa',
//     fontWeight: '500',
//   },
//   mapResultsCount: {
//     color: '#007AFF',
//     fontWeight: '600',
//   },
//   listContent: {
//     paddingBottom: 20,
//   },
//   card: {
//     flexDirection: 'row',
//     backgroundColor: '#fff',
//     marginHorizontal: 20,
//     marginVertical: 6,
//     padding: 15,
//     borderRadius: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.08,
//     shadowRadius: 6,
//     elevation: 3,
//     borderWidth: 1,
//     borderColor: '#f0f0f0',
//   },
//   itemImage: {
//     width: 60,
//     height: 60,
//     borderRadius: 10,
//     marginRight: 15,
//   },
//   imagePlaceholder: {
//     width: 60,
//     height: 60,
//     borderRadius: 10,
//     backgroundColor: '#f8f9fa',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 15,
//     borderWidth: 1,
//     borderColor: '#e0e0e0',
//   },
//   cardContent: {
//     flex: 1,
//     justifyContent: 'center',
//   },
//   cardTitle: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: '#333',
//     marginBottom: 4,
//   },
//   cardDescription: {
//     fontSize: 14,
//     color: '#666',
//     marginBottom: 6,
//     lineHeight: 18,
//   },
//   cardPrice: {
//     fontSize: 15,
//     color: '#007AFF',
//     fontWeight: '600',
//     marginBottom: 2,
//   },
//   cardCategory: {
//     fontSize: 13,
//     color: '#888',
//     marginBottom: 2,
//     fontWeight: '500',
//   },
//   cardAddress: {
//     fontSize: 13,
//     color: '#666',
//     marginBottom: 2,
//     fontWeight: '500',
//   },
//   phoneButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#28a745',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 8,
//     alignSelf: 'flex-start',
//     marginTop: 4,
//     gap: 4,
//   },
//   phoneButtonText: {
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
//     backgroundColor: '#007AFF',
//     padding: 10,
//     borderRadius: 20,
//     borderWidth: 3,
//     borderColor: '#fff',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.3,
//     shadowRadius: 4,
//     elevation: 5,
//   },
//   shopMarker: {
//     backgroundColor: '#FF6B35',
//   },
//   productMarker: {
//     backgroundColor: '#007AFF',
//   },
//   markerText: {
//     color: '#fff',
//     fontWeight: 'bold',
//     fontSize: 14,
//   },
//   selectedItemCard: {
//     position: 'absolute',
//     bottom: 20,
//     left: 20,
//     right: 20,
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     padding: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 8,
//     borderWidth: 1,
//     borderColor: '#e0e0e0',
//   },
//   selectedItemHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   selectedItemImage: {
//     width: 50,
//     height: 50,
//     borderRadius: 10,
//     marginRight: 12,
//   },
//   selectedItemImagePlaceholder: {
//     width: 50,
//     height: 50,
//     borderRadius: 10,
//     backgroundColor: '#f8f9fa',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 12,
//     borderWidth: 1,
//     borderColor: '#e0e0e0',
//   },
//   selectedItemInfo: {
//     flex: 1,
//   },
//   selectedItemTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#333',
//     marginBottom: 2,
//   },
//   selectedItemPrice: {
//     fontSize: 16,
//     color: '#007AFF',
//     fontWeight: '600',
//   },
//   selectedItemAddress: {
//     fontSize: 14,
//     color: '#666',
//     marginBottom: 8,
//     fontWeight: '500',
//   },
//   selectedItemDetail: {
//     fontSize: 14,
//     color: '#666',
//     marginBottom: 6,
//     lineHeight: 18,
//   },
//   actionButtons: {
//     flexDirection: 'row',
//     gap: 10,
//     marginTop: 12,
//   },
//   closeButton: {
//     flex: 1,
//     backgroundColor: '#f8f9fa',
//     paddingVertical: 12,
//     borderRadius: 10,
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: '#e0e0e0',
//   },
//   closeButtonText: {
//     color: '#333',
//     fontWeight: '600',
//     fontSize: 15,
//   },
//   callButton: {
//     flex: 1,
//     backgroundColor: '#28a745',
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 12,
//     borderRadius: 10,
//     gap: 6,
//   },
//   callButtonText: {
//     color: '#fff',
//     fontWeight: '600',
//     fontSize: 15,
//   },
//   sidePanel: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     bottom: 0,
//     width: '80%',
//     backgroundColor: '#fff',
//     zIndex: 1000,
//     shadowColor: '#000',
//     shadowOffset: { width: 2, height: 0 },
//     shadowOpacity: 0.25,
//     shadowRadius: 10,
//     elevation: 10,
//   },
//   sidePanelClose: {
//     padding: 15,
//     alignSelf: 'flex-end',
//   },
//   sidePanelHeader: {
//     padding: 20,
//     borderBottomWidth: 1,
//     borderBottomColor: '#f0f0f0',
//   },
//   sidePanelTitle: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#333',
//   },
//   menuItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 15,
//     paddingLeft: 20,
//     borderBottomWidth: 1,
//     borderBottomColor: '#f8f9fa',
//   },
//   activeMenuItem: {
//     backgroundColor: '#f0f7ff',
//     borderLeftWidth: 4,
//     borderLeftColor: '#007AFF',
//   },
//   menuItemText: {
//     marginLeft: 15,
//     fontSize: 16,
//     color: '#333',
//     fontWeight: '500',
//   },
//   recentSearchesContainer: {
//     padding: 20,
//   },
//   sectionTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333',
//     marginBottom: 12,
//   },
//   recentSearches: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 10,
//   },
//   recentSearchItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#f8f9fa',
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 20,
//     borderWidth: 1,
//     borderColor: '#e0e0e0',
//   },
//   recentSearchText: {
//     marginLeft: 6,
//     fontSize: 14,
//     color: '#666',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   loadingText: {
//     marginTop: 10,
//     fontSize: 16,
//     color: '#666',
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
//     color: '#666',
//     marginTop: 20,
//     textAlign: 'center',
//   },
//   noResultsSubText: {
//     fontSize: 14,
//     color: '#999',
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
//     color: '#666',
//     marginTop: 10,
//     textAlign: 'center',
//   },
//   noLocationSubText: {
//     fontSize: 14,
//     color: '#999',
//     marginTop: 5,
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
//     color: '#ccc',
//     marginTop: 20,
//     textAlign: 'center',
//   },
//   initialStateSubText: {
//     fontSize: 14,
//     color: '#ddd',
//     marginTop: 10,
//     textAlign: 'center',
//     lineHeight: 20,
//   },
// });


import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Linking,
  Alert
} from "react-native";
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { db } from "../../../firebaseConfig";

type Product = {
  id: string;
  name: string;
  description: string;
  image?: string;
  category?: string;
  price?: number;
  createdAt?: { seconds: number; nanoseconds: number };
  latitude?: number;
  longitude?: number;
  address?: string;
  shopId?: string;
  shopName?: string;
  shopLogo?: string;
  ownerName?: string;
  phone?: string;
  email?: string;
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
  const router = useRouter();

  // Load initial data only once
  useEffect(() => {
    const initializeData = async () => {
      if (dataLoaded) return;

      try {
        // Load recent searches
        const savedSearches = await AsyncStorage.getItem("recentSearches");
        if (savedSearches) {
          setRecentSearches(JSON.parse(savedSearches));
        }

        // Get location permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          setLocationPermission(true);
          const location = await Location.getCurrentPositionAsync({});
          setCurrentLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          });
        }

        // Load shops and products
        await loadShops();
        await loadProducts();
        
        setDataLoaded(true);

      } catch (error) {
        console.log("Error initializing data:", error);
      }
    };

    initializeData();
  }, []);

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
      const productsData: Product[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Product, "id">),
      }));
      setProducts(productsData);
    } catch (err) {
      console.log("Error loading products:", err);
    }
  };

  // Simple search function without useCallback
  const handleSearch = async (queryText: string = searchQuery) => {
    const searchText = queryText.trim();
    if (!searchText) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Save to recent searches
      const updatedSearches = [
        searchText,
        ...recentSearches.filter(s => s !== searchText).slice(0, 4)
      ];
      setRecentSearches(updatedSearches);
      await AsyncStorage.setItem("recentSearches", JSON.stringify(updatedSearches));

      // Search in shops and products
      const searchLower = searchText.toLowerCase();
      
      const filteredShops = shops.filter(shop =>
        shop.shopName?.toLowerCase().includes(searchLower) ||
        shop.ownerName?.toLowerCase().includes(searchLower) ||
        shop.location?.toLowerCase().includes(searchLower)
      );

      const filteredProducts = products.filter(product =>
        product.name?.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower) ||
        product.category?.toLowerCase().includes(searchLower)
      );

      // Combine results - shops first, then products
      const combinedResults = [...filteredShops, ...filteredProducts];
      setSearchResults(combinedResults);

    } catch (err) {
      console.log("Error searching:", err);
    } finally {
      setIsSearching(false);
    }
  };

  // Simplified useEffect - only trigger search when searchQuery changes
  useEffect(() => {
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        handleSearch();
      }, 500);

      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]); // Only depend on searchQuery

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
      pathname: "/customer/shop",
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

  // Function to navigate to product details (if needed)
  const handleViewProductDetails = (product: Product) => {
    // You can implement product details navigation here if needed
    console.log("View product details:", product.id);
  };

  const getLocationAddress = (item: Product | Shop) => {
    if ('location' in item && item.location) {
      if (item.location.includes('Lat:')) {
        return 'Nearby location';
      }
      return item.location;
    }
    if (item.address) {
      return item.address;
    }
    if (item.latitude && item.longitude) {
      return 'Nearby location';
    }
    return "Location not available";
  };

  const SidePanel = () => (
    <View style={styles.sidePanel}>
      <TouchableOpacity 
        style={styles.sidePanelClose} 
        onPress={() => setSidePanelVisible(false)}
      >
        <Ionicons name="close" size={24} color="#333" />
      </TouchableOpacity>
      
      <View style={styles.sidePanelHeader}>
        <Text style={styles.sidePanelTitle}>Menu</Text>
      </View>
      
      {[
        { name: "Home", icon: "home", route: "/customer/home" },
        { name: "Search", icon: "search", route: null },
        { name: "Messages", icon: "chatbubbles", route: "/customer/messages" },
        { name: "Orders", icon: "list", route: "/customer/myorders" },
        { name: "Profile", icon: "person", route: "/customer/profile" },
      ].map((item, index) => (
        <TouchableOpacity 
          key={index}
          style={[styles.menuItem, item.name === "Search" && styles.activeMenuItem]}
          onPress={() => {
            setSidePanelVisible(false);
            if (item.route) {
              router.push(item.route);
            }
          }}
        >
          <Ionicons name={item.icon as any} size={20} color="#007AFF" />
          <Text style={styles.menuItemText}>{item.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderProductCard = ({ item }: { item: Product | Shop }) => {
    const isShop = 'ownerName' in item && !('description' in item);
    const imageUrl = isShop ? (item as Shop).shopLogo : (item as Product).image;
    
    return (
      <TouchableOpacity style={styles.card}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.itemImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name={isShop ? "storefront" : "cube"} size={24} color="#007AFF" />
          </View>
        )}
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{isShop ? (item as Shop).shopName : (item as Product).name}</Text>
          <Text style={styles.cardDescription}>
            {isShop ? `Owner: ${(item as Shop).ownerName}` : (item as Product).description}
          </Text>
          {!isShop && (item as Product).price && (item as Product).price > 0 && (
            <Text style={styles.cardPrice}>💰 ${(item as Product).price}</Text>
          )}
          {(item as Product).category && (
            <Text style={styles.cardCategory}>📂 {(item as Product).category}</Text>
          )}
          <Text style={styles.cardAddress}>📍 {getLocationAddress(item)}</Text>
          
          {isShop ? (
            <TouchableOpacity 
              style={styles.viewDetailsButton}
              onPress={() => handleViewShopDetails(item as Shop)}
            >
              <Ionicons name="eye" size={14} color="#fff" />
              <Text style={styles.viewDetailsButtonText}>View Shop Details</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.viewDetailsButton}
              onPress={() => handleViewProductDetails(item as Product)}
            >
              <Ionicons name="cube" size={14} color="#fff" />
              <Text style={styles.viewDetailsButtonText}>View Product</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Get items with location for map
  const getMapItems = () => {
    if (searchQuery && searchResults.length > 0) {
      return searchResults.filter(item => 
        item.latitude && item.longitude
      );
    }
    return shops.filter(shop => shop.latitude && shop.longitude);
  };

  const mapItems = getMapItems();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSidePanelVisible(true)}>
          <Ionicons name="menu" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🔍 Search</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Side Panel */}
      {sidePanelVisible && <SidePanel />}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search shops, products, or locations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* View Toggle */}
      <View style={styles.viewToggleContainer}>
        <TouchableOpacity 
          style={[styles.viewToggleButton, !mapView && styles.activeViewToggle]}
          onPress={() => setMapView(false)}
        >
          <Ionicons name="list" size={20} color={!mapView ? "#fff" : "#007AFF"} />
          <Text style={[styles.viewToggleText, !mapView && styles.activeViewToggleText]}>List</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.viewToggleButton, mapView && styles.activeViewToggle]}
          onPress={() => setMapView(true)}
        >
          <Ionicons name="map" size={20} color={mapView ? "#fff" : "#007AFF"} />
          <Text style={[styles.viewToggleText, mapView && styles.activeViewToggleText]}>Map</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Searches */}
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
                <Ionicons name="time-outline" size={16} color="#777" />
                <Text style={styles.recentSearchText}>{search}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Search Results */}
      {isSearching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : (
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
            // MAP VIEW
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
                    pinColor="blue"
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
                        <Text style={styles.markerText}>
                          {isShop ? "🛒" : "📦"}
                        </Text>
                      </View>
                    </Marker>
                  );
                })}
              </MapView>
              
              {/* Selected Item Info */}
              {selectedItem && (
                <View style={styles.selectedItemCard}>
                  <View style={styles.selectedItemHeader}>
                    {('shopLogo' in selectedItem && selectedItem.shopLogo) ? (
                      <Image source={{ uri: selectedItem.shopLogo }} style={styles.selectedItemImage} />
                    ) : ('image' in selectedItem && selectedItem.image) ? (
                      <Image source={{ uri: selectedItem.image }} style={styles.selectedItemImage} />
                    ) : (
                      <View style={styles.selectedItemImagePlaceholder}>
                        <Ionicons name={'ownerName' in selectedItem ? "storefront" : "cube"} size={24} color="#007AFF" />
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
                    <Text style={styles.selectedItemDetail}>👤 Owner: {selectedItem.ownerName}</Text>
                  )}
                  
                  {'description' in selectedItem && selectedItem.description && (
                    <Text style={styles.selectedItemDetail}>{selectedItem.description}</Text>
                  )}
                  
                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      style={styles.closeButton}
                      onPress={() => setSelectedItem(null)}
                    >
                      <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                    
                    {'ownerName' in selectedItem && (
                      <TouchableOpacity 
                        style={styles.viewDetailsButton}
                        onPress={() => handleViewShopDetails(selectedItem as Shop)}
                      >
                        <Ionicons name="eye" size={16} color="#fff" />
                        <Text style={styles.viewDetailsButtonText}>View Shop</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}

              {/* No Location Warning */}
              {searchQuery && mapItems.length === 0 && (
                <View style={styles.noLocationWarning}>
                  <Ionicons name="location-outline" size={40} color="#ccc" />
                  <Text style={styles.noLocationText}>No locations found for your search</Text>
                  <Text style={styles.noLocationSubText}>Try searching for something else</Text>
                </View>
              )}
            </View>
          ) : (
            // LIST VIEW
            <>
              {searchResults.length > 0 ? (
                <FlatList
                  data={searchResults}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.listContent}
                  renderItem={renderProductCard}
                />
              ) : searchQuery ? (
                <View style={styles.noResultsContainer}>
                  <Ionicons name="search-outline" size={60} color="#ccc" />
                  <Text style={styles.noResultsText}>No results found for "{searchQuery}"</Text>
                  <Text style={styles.noResultsSubText}>Try different keywords</Text>
                </View>
              ) : (
                <View style={styles.initialStateContainer}>
                  <Ionicons name="search-outline" size={80} color="#f0f0f0" />
                  <Text style={styles.initialStateText}>Search for shops or products</Text>
                  <Text style={styles.initialStateSubText}>
                    Find what you're looking for by typing in the search bar above
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      )}
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  searchContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  viewToggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  viewToggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  activeViewToggle: {
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  viewToggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
  },
  activeViewToggleText: {
    color: '#fff',
  },
  resultsContainer: {
    flex: 1,
  },
  resultsCount: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f8f9fa',
    fontWeight: '500',
  },
  mapResultsCount: {
    color: '#007AFF',
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 6,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 15,
  },
  imagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    lineHeight: 18,
  },
  cardPrice: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 2,
  },
  cardCategory: {
    fontSize: 13,
    color: '#888',
    marginBottom: 2,
    fontWeight: '500',
  },
  cardAddress: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
    fontWeight: '500',
  },
  // Updated button styles
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
    gap: 4,
  },
  viewDetailsButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28a745',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
    gap: 4,
  },
  phoneButtonText: {
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
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  shopMarker: {
    backgroundColor: '#FF6B35',
  },
  productMarker: {
    backgroundColor: '#007AFF',
  },
  markerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  selectedItemCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedItemImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginRight: 12,
  },
  selectedItemImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedItemInfo: {
    flex: 1,
  },
  selectedItemTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 2,
  },
  selectedItemPrice: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  selectedItemAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  selectedItemDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  closeButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  closeButtonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 15,
  },
  callButton: {
    flex: 1,
    backgroundColor: '#28a745',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  callButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  sidePanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '80%',
    backgroundColor: '#fff',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  sidePanelClose: {
    padding: 15,
    alignSelf: 'flex-end',
  },
  sidePanelHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sidePanelTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingLeft: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  activeMenuItem: {
    backgroundColor: '#f0f7ff',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  menuItemText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  recentSearchesContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  recentSearches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  recentSearchText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
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
    color: '#666',
    marginTop: 20,
    textAlign: 'center',
  },
  noResultsSubText: {
    fontSize: 14,
    color: '#999',
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
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  noLocationSubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
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
    color: '#ccc',
    marginTop: 20,
    textAlign: 'center',
  },
  initialStateSubText: {
    fontSize: 14,
    color: '#ddd',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 20,
  },
});