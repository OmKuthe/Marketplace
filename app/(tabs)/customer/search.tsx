// import { Ionicons } from '@expo/vector-icons';
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { useRouter } from "expo-router";
// import { collection, getDocs, orderBy, query } from "firebase/firestore";
// import React, { useEffect, useState } from "react";
// import {
//   ActivityIndicator,
//   Dimensions,
//   FlatList,
//   SafeAreaView,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View
// } from "react-native";
// import MapView, { Marker } from 'react-native-maps';
// import * as Location from 'expo-location';
// import { db } from "../../../firebaseConfig";

// type Post = {
//   id: string;
//   type: "NEED" | "OFFER";
//   content: string;
//   timestamp: any;
// };

// type Product = {
//   id: string;
//   name: string;
//   description: string;
//   category?: string;
//   price?: number;
//   createdAt?: { seconds: number; nanoseconds: number };
//   // Map properties
//   latitude?: number;
//   longitude?: number;
//   address?: string;
// };

// const { width, height } = Dimensions.get('window');

// export default function SearchScreen() {
//   const [posts, setPosts] = useState<Post[]>([]);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [searchResults, setSearchResults] = useState<Product[]>([]);
//   const [isSearching, setIsSearching] = useState(false);
//   const [activeFilter, setActiveFilter] = useState("all");
//   const [recentSearches, setRecentSearches] = useState<string[]>([]);
//   const [sidePanelVisible, setSidePanelVisible] = useState(false);
//   const [currentLocation, setCurrentLocation] = useState<{latitude: number; longitude: number} | null>(null);
//   const [mapView, setMapView] = useState(false);
//   const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
//   const [locationPermission, setLocationPermission] = useState(false);
//   const router = useRouter();

//   useEffect(() => {
//     const loadSearches = async () => {
//       try {
//         const savedSearches = await AsyncStorage.getItem("recentSearches");
//         if (savedSearches) {
//           setRecentSearches(JSON.parse(savedSearches));
//         }
//       } catch (err) {
//         console.log("Error loading searches", err);
//       }
//     };

//     const getLocationPermission = async () => {
//       try {
//         const { status } = await Location.requestForegroundPermissionsAsync();
//         if (status === 'granted') {
//           setLocationPermission(true);
//           const location = await Location.getCurrentPositionAsync({});
//           setCurrentLocation({
//             latitude: location.coords.latitude,
//             longitude: location.coords.longitude
//           });
//         }
//       } catch (error) {
//         console.log("Error getting location:", error);
//       }
//     };

//     loadSearches();
//     getLocationPermission();
//   }, []);

//   const handleSearch = async () => {
//     if (!searchQuery.trim()) return;

//     setIsSearching(true);
//     try {
//       const updatedSearches = [
//         searchQuery,
//         ...recentSearches.filter(s => s !== searchQuery).slice(0, 4)
//       ];
//       setRecentSearches(updatedSearches);
//       await AsyncStorage.setItem("recentSearches", JSON.stringify(updatedSearches));

//       const q = query(
//         collection(db, "products"),
//         orderBy("createdAt", "desc")
//       );

//       const snapshot = await getDocs(q);
//       const data: Product[] = snapshot.docs.map((doc) => ({
//         id: doc.id,
//         ...(doc.data() as Omit<Product, "id">),
//       }));

//       const filteredData = data.filter(product =>
//         product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         product.description?.toLowerCase().includes(searchQuery.toLowerCase())
//       );

//       setSearchResults(filteredData);
//     } catch (err) {
//       console.log("Error searching products:", err);
//     } finally {
//       setIsSearching(false);
//     }
//   };

//   const clearSearch = () => {
//     setSearchQuery("");
//     setSearchResults([]);
//     setSelectedProduct(null);
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
      
//       <TouchableOpacity 
//         style={styles.menuItem}
//         onPress={() => {
//           setSidePanelVisible(false);
//           router.push("/customer/home");
//         }}
//       >
//         <Ionicons name="home" size={20} color="#007AFF" />
//         <Text style={styles.menuItemText}>Home</Text>
//       </TouchableOpacity>
      
//       <TouchableOpacity 
//         style={[styles.menuItem, styles.activeMenuItem]}
//         onPress={() => setSidePanelVisible(false)}
//       >
//         <Ionicons name="search" size={20} color="#007AFF" />
//         <Text style={styles.menuItemText}>Search</Text>
//       </TouchableOpacity>
      
//       <TouchableOpacity 
//         style={styles.menuItem}
//         onPress={() => {
//           setSidePanelVisible(false);
//           router.push("/customer/messages");
//         }}
//       >
//         <Ionicons name="chatbubbles" size={20} color="#007AFF" />
//         <Text style={styles.menuItemText}>Messages</Text>
//       </TouchableOpacity>
      
//       <TouchableOpacity 
//         style={styles.menuItem}
//         onPress={() => {
//           setSidePanelVisible(false);
//           router.push("/customer/myorders");
//         }}
//       >
//         <Ionicons name="list" size={20} color="#007AFF" />
//         <Text style={styles.menuItemText}>Orders</Text>
//       </TouchableOpacity>
      
//       <TouchableOpacity 
//         style={styles.menuItem}
//         onPress={() => {
//           setSidePanelVisible(false);
//           router.push("/customer/profile");
//         }}
//       >
//         <Ionicons name="person" size={20} color="#007AFF" />
//         <Text style={styles.menuItemText}>Profile</Text>
//       </TouchableOpacity>
//     </View>
//   );

//   const renderProductCard = ({ item }: { item: Product }) => (
//     <TouchableOpacity style={styles.card}>
//       <Text style={styles.cardTitle}>{item.name}</Text>
//       <Text style={styles.cardContent}>{item.description}</Text>
//       <Text style={styles.cardContent}>💰 ${item.price}</Text>
//       <Text style={styles.cardContent}>📂 {item.category}</Text>
//       {item.address && (
//         <Text style={styles.cardContent}>📍 {item.address}</Text>
//       )}
//       {item.createdAt?.seconds && (
//         <Text style={styles.timestamp}>
//           {new Date(item.createdAt.seconds * 1000).toLocaleString()}
//         </Text>
//       )}
//     </TouchableOpacity>
//   );

//   const productsWithLocation = searchResults.filter(product => 
//     product.latitude && product.longitude
//   );

//   return (
//     <SafeAreaView style={styles.container}>
//       {/* Header with menu button */}
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => setSidePanelVisible(true)}>
//           <Ionicons name="menu" size={28} color="#333" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>🔍 Search</Text>
//         <View style={{ width: 28 }} /> {/* Spacer for balance */}
//       </View>

//       {/* Side Panel */}
//       {sidePanelVisible && <SidePanel />}

//       {/* Search Bar */}
//       <View style={styles.searchContainer}>
//         <View style={styles.searchInputContainer}>
//           <Ionicons name="search" size={20} color="#777" style={styles.searchIcon} />
//           <TextInput
//             style={styles.searchInput}
//             placeholder="Search for needs or offers..."
//             value={searchQuery}
//             onChangeText={setSearchQuery}
//             onSubmitEditing={handleSearch}
//             returnKeyType="search"
//           />
//           {searchQuery.length > 0 && (
//             <TouchableOpacity onPress={clearSearch}>
//               <Ionicons name="close-circle" size={20} color="#777" />
//             </TouchableOpacity>
//           )}
//         </View>
//         <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
//           <Text style={styles.searchButtonText}>Search</Text>
//         </TouchableOpacity>
//       </View>

//       {/* Search Filters */}
//       <View style={styles.filterContainer}>
//         <Text style={styles.filterLabel}>Filter by:</Text>
//         <View style={styles.filterOptions}>
//           <TouchableOpacity 
//             style={[styles.filterButton, activeFilter === "all" && styles.activeFilter]}
//             onPress={() => setActiveFilter("all")}
//           >
//             <Text style={[styles.filterText, activeFilter === "all" && styles.activeFilterText]}>All</Text>
//           </TouchableOpacity>
//           <TouchableOpacity 
//             style={[styles.filterButton, activeFilter === "need" && styles.activeFilter]}
//             onPress={() => setActiveFilter("need")}
//           >
//             <Text style={[styles.filterText, activeFilter === "need" && styles.activeFilterText]}>Needs</Text>
//           </TouchableOpacity>
//           <TouchableOpacity 
//             style={[styles.filterButton, activeFilter === "offer" && styles.activeFilter]}
//             onPress={() => setActiveFilter("offer")}
//           >
//             <Text style={[styles.filterText, activeFilter === "offer" && styles.activeFilterText]}>Offers</Text>
//           </TouchableOpacity>
//         </View>
//       </View>

//       {/* View Toggle */}
//       {searchResults.length > 0 && (
//         <View style={styles.viewToggleContainer}>
//           <TouchableOpacity 
//             style={[styles.viewToggleButton, !mapView && styles.activeViewToggle]}
//             onPress={() => setMapView(false)}
//           >
//             <Ionicons name="list" size={20} color={!mapView ? "#fff" : "#007AFF"} />
//             <Text style={[styles.viewToggleText, !mapView && styles.activeViewToggleText]}>List</Text>
//           </TouchableOpacity>
          
//           <TouchableOpacity 
//             style={[styles.viewToggleButton, mapView && styles.activeViewToggle]}
//             onPress={() => setMapView(true)}
//           >
//             <Ionicons name="map" size={20} color={mapView ? "#fff" : "#007AFF"} />
//             <Text style={[styles.viewToggleText, mapView && styles.activeViewToggleText]}>Map</Text>
//           </TouchableOpacity>
//         </View>
//       )}

//       {/* Recent Searches */}
//       {searchResults.length === 0 && recentSearches.length > 0 && !isSearching && (
//         <View style={styles.recentSearchesContainer}>
//           <Text style={styles.sectionTitle}>Recent Searches</Text>
//           <View style={styles.recentSearches}>
//             {recentSearches.map((search, index) => (
//               <TouchableOpacity 
//                 key={index} 
//                 style={styles.recentSearchItem}
//                 onPress={() => {
//                   setSearchQuery(search);
//                   handleSearch();
//                 }}
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
//           {searchResults.length > 0 ? (
//             <>
//               <Text style={styles.resultsCount}>
//                 Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
//                 {mapView && productsWithLocation.length > 0 && (
//                   <Text style={styles.mapResultsCount}>
//                     {" "}({productsWithLocation.length} on map)
//                   </Text>
//                 )}
//               </Text>
              
//               {mapView ? (
//                 // MAP VIEW
//                 <View style={styles.mapContainer}>
//                   <MapView 
//                     style={styles.map}
//                     initialRegion={{
//                       latitude: currentLocation?.latitude || 37.78825,
//                       longitude: currentLocation?.longitude || -122.4324,
//                       latitudeDelta: 0.0922,
//                       longitudeDelta: 0.0421,
//                     }}
//                     showsUserLocation={true}
//                     showsMyLocationButton={true}
//                   >
//                     {/* User Location Marker */}
//                     {currentLocation && (
//                       <Marker
//                         coordinate={currentLocation}
//                         title="Your Location"
//                         pinColor="blue"
//                       />
//                     )}
                    
//                     {/* Product Markers */}
//                     {productsWithLocation.map((product) => (
//                       <Marker
//                         key={product.id}
//                         coordinate={{
//                           latitude: product.latitude!,
//                           longitude: product.longitude!,
//                         }}
//                         title={product.name}
//                         description={`$${product.price} - ${product.category}`}
//                         onPress={() => setSelectedProduct(product)}
//                       >
//                         <View style={styles.marker}>
//                           <Text style={styles.markerText}>${product.price}</Text>
//                         </View>
//                       </Marker>
//                     ))}
//                   </MapView>
                  
//                   {/* Selected Product Info */}
//                   {selectedProduct && (
//                     <View style={styles.selectedProductCard}>
//                       <Text style={styles.selectedProductTitle}>{selectedProduct.name}</Text>
//                       <Text style={styles.selectedProductPrice}>${selectedProduct.price}</Text>
//                       <Text style={styles.selectedProductCategory}>{selectedProduct.category}</Text>
//                       <Text style={styles.selectedProductDescription}>
//                         {selectedProduct.description}
//                       </Text>
//                       <TouchableOpacity 
//                         style={styles.viewDetailsButton}
//                         onPress={() => {
//                           // Navigate to product details or show more info
//                           setSelectedProduct(null);
//                         }}
//                       >
//                         <Text style={styles.viewDetailsText}>Close</Text>
//                       </TouchableOpacity>
//                     </View>
//                   )}

//                   {/* No Location Warning */}
//                   {productsWithLocation.length === 0 && (
//                     <View style={styles.noLocationWarning}>
//                       <Ionicons name="location-outline" size={30} color="#666" />
//                       <Text style={styles.noLocationText}>
//                         No products with location data found
//                       </Text>
//                       <Text style={styles.noLocationSubText}>
//                         Switch to list view to see all results
//                       </Text>
//                     </View>
//                   )}
//                 </View>
//               ) : (
//                 // LIST VIEW
//                 <FlatList
//                   data={searchResults}
//                   keyExtractor={(item) => item.id}
//                   showsVerticalScrollIndicator={false}
//                   contentContainerStyle={{ paddingBottom: 20 }}
//                   renderItem={renderProductCard}
//                 />
//               )}
//             </>
//           ) : searchQuery ? (
//             <View style={styles.noResultsContainer}>
//               <Ionicons name="search-outline" size={50} color="#ccc" />
//               <Text style={styles.noResultsText}>No results found for "{searchQuery}"</Text>
//               <Text style={styles.noResultsSubText}>Try different keywords or filters</Text>
//             </View>
//           ) : null}
//         </View>
//       )}
//     </SafeAreaView>
//   );
// }

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
//     borderBottomColor: '#f0f0f0',
//   },
//   headerTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   sidePanel: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     bottom: 0,
//     width: width * 0.8,
//     backgroundColor: 'white',
//     zIndex: 1000,
//     padding: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 2, height: 0 },
//     shadowOpacity: 0.25,
//     shadowRadius: 10,
//     elevation: 10,
//   },
//   sidePanelClose: {
//     alignSelf: 'flex-end',
//     marginBottom: 20,
//   },
//   sidePanelHeader: {
//     borderBottomWidth: 1,
//     borderBottomColor: '#f0f0f0',
//     paddingBottom: 15,
//     marginBottom: 15,
//   },
//   sidePanelTitle: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   menuItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 12,
//     paddingHorizontal: 10,
//     borderRadius: 8,
//     marginBottom: 5,
//   },
//   activeMenuItem: {
//     backgroundColor: '#f0f8ff',
//   },
//   menuItemText: {
//     fontSize: 16,
//     marginLeft: 12,
//     color: '#333',
//   },
//   searchContainer: {
//     flexDirection: 'row',
//     padding: 20,
//     gap: 10,
//   },
//   searchInputContainer: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#f5f5f5',
//     borderRadius: 10,
//     paddingHorizontal: 15,
//   },
//   searchIcon: {
//     marginRight: 10,
//   },
//   searchInput: {
//     flex: 1,
//     paddingVertical: 12,
//     fontSize: 16,
//   },
//   searchButton: {
//     backgroundColor: '#007AFF',
//     paddingHorizontal: 20,
//     paddingVertical: 12,
//     borderRadius: 10,
//     justifyContent: 'center',
//   },
//   searchButtonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   filterContainer: {
//     paddingHorizontal: 20,
//     marginBottom: 10,
//   },
//   filterLabel: {
//     fontSize: 16,
//     fontWeight: '600',
//     marginBottom: 10,
//     color: '#333',
//   },
//   filterOptions: {
//     flexDirection: 'row',
//     gap: 10,
//   },
//   filterButton: {
//     paddingHorizontal: 20,
//     paddingVertical: 8,
//     borderRadius: 15,
//     backgroundColor: '#f5f5f5',
//     borderWidth: 1,
//     borderColor: '#e0e0e0',
//   },
//   activeFilter: {
//     backgroundColor: '#007AFF',
//     borderColor: '#007AFF',
//   },
//   filterText: {
//     fontSize: 14,
//     color: '#666',
//   },
//   activeFilterText: {
//     color: 'white',
//   },
//   viewToggleContainer: {
//     flexDirection: 'row',
//     marginHorizontal: 20,
//     marginVertical: 10,
//     backgroundColor: '#f5f5f5',
//     borderRadius: 10,
//     padding: 4,
//   },
//   viewToggleButton: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 8,
//     borderRadius: 8,
//   },
//   activeViewToggle: {
//     backgroundColor: '#007AFF',
//   },
//   viewToggleText: {
//     marginLeft: 5,
//     fontSize: 14,
//     color: '#007AFF',
//   },
//   activeViewToggleText: {
//     color: '#fff',
//   },
//   recentSearchesContainer: {
//     paddingHorizontal: 20,
//     marginTop: 10,
//   },
//   sectionTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     marginBottom: 10,
//     color: '#333',
//   },
//   recentSearches: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 10,
//   },
//   recentSearchItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#f5f5f5',
//     paddingHorizontal: 15,
//     paddingVertical: 8,
//     borderRadius: 15,
//     gap: 5,
//   },
//   recentSearchText: {
//     color: '#666',
//     fontSize: 14,
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
//   resultsContainer: {
//     flex: 1,
//     paddingHorizontal: 20,
//   },
//   resultsCount: {
//     fontSize: 14,
//     color: '#666',
//     marginBottom: 10,
//   },
//   mapResultsCount: {
//     color: '#007AFF',
//     fontWeight: '600',
//   },
//   mapContainer: {
//     flex: 1,
//     height: height * 0.7,
//     marginBottom: 20,
//   },
//   map: {
//     width: '100%',
//     height: '100%',
//     borderRadius: 10,
//   },
//   marker: {
//     backgroundColor: '#007AFF',
//     padding: 8,
//     borderRadius: 8,
//     minWidth: 50,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//     elevation: 5,
//   },
//   markerText: {
//     color: 'white',
//     fontSize: 12,
//     fontWeight: 'bold',
//   },
//   selectedProductCard: {
//     position: 'absolute',
//     bottom: 10,
//     left: 10,
//     right: 10,
//     backgroundColor: 'white',
//     padding: 15,
//     borderRadius: 10,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//     elevation: 5,
//   },
//   selectedProductTitle: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     marginBottom: 5,
//   },
//   selectedProductPrice: {
//     fontSize: 14,
//     color: '#007AFF',
//     fontWeight: '600',
//     marginBottom: 3,
//   },
//   selectedProductCategory: {
//     fontSize: 12,
//     color: '#666',
//     marginBottom: 3,
//   },
//   selectedProductDescription: {
//     fontSize: 12,
//     color: '#888',
//     marginBottom: 10,
//   },
//   viewDetailsButton: {
//     backgroundColor: '#007AFF',
//     padding: 10,
//     borderRadius: 5,
//     alignItems: 'center',
//   },
//   viewDetailsText: {
//     color: 'white',
//     fontWeight: '600',
//   },
//   noLocationWarning: {
//     position: 'absolute',
//     top: '50%',
//     left: 20,
//     right: 20,
//     backgroundColor: 'white',
//     padding: 20,
//     borderRadius: 10,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//     elevation: 5,
//     transform: [{ translateY: -50 }],
//   },
//   noLocationText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333',
//     marginTop: 10,
//     textAlign: 'center',
//   },
//   noLocationSubText: {
//     fontSize: 14,
//     color: '#666',
//     marginTop: 5,
//     textAlign: 'center',
//   },
//   card: {
//     backgroundColor: 'white',
//     padding: 15,
//     borderRadius: 10,
//     marginBottom: 10,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//     elevation: 2,
//     borderLeftWidth: 4,
//     borderLeftColor: '#007AFF',
//   },
//   cardTitle: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     marginBottom: 5,
//     color: '#333',
//   },
//   cardContent: {
//     fontSize: 14,
//     color: '#666',
//     marginBottom: 3,
//   },
//   timestamp: {
//     fontSize: 12,
//     color: '#999',
//     marginTop: 5,
//   },
//   noResultsContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingVertical: 50,
//   },
//   noResultsText: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#666',
//     marginTop: 15,
//     textAlign: 'center',
//   },
//   noResultsSubText: {
//     fontSize: 14,
//     color: '#999',
//     marginTop: 5,
//     textAlign: 'center',
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
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { db } from "../../../firebaseConfig";

type Post = {
  id: string;
  type: "NEED" | "OFFER";
  content: string;
  timestamp: any;
};

type Product = {
  id: string;
  name: string;
  description: string;
  category?: string;
  price?: number;
  createdAt?: { seconds: number; nanoseconds: number };
  // Map properties
  latitude?: number;
  longitude?: number;
  address?: string;
};

const { width, height } = Dimensions.get('window');

export default function SearchScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [sidePanelVisible, setSidePanelVisible] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [mapView, setMapView] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [locationPermission, setLocationPermission] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadSearches = async () => {
      try {
        const savedSearches = await AsyncStorage.getItem("recentSearches");
        if (savedSearches) {
          setRecentSearches(JSON.parse(savedSearches));
        }
      } catch (err) {
        console.log("Error loading searches", err);
      }
    };

    const getLocationPermission = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          setLocationPermission(true);
          const location = await Location.getCurrentPositionAsync({});
          setCurrentLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          });
        }
      } catch (error) {
        console.log("Error getting location:", error);
      }
    };

    loadSearches();
    getLocationPermission();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const updatedSearches = [
        searchQuery,
        ...recentSearches.filter(s => s !== searchQuery).slice(0, 4)
      ];
      setRecentSearches(updatedSearches);
      await AsyncStorage.setItem("recentSearches", JSON.stringify(updatedSearches));

      const q = query(
        collection(db, "products"),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      const data: Product[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Product, "id">),
      }));

      const filteredData = data.filter(product =>
        product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );

      setSearchResults(filteredData);
    } catch (err) {
      console.log("Error searching products:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedProduct(null);
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
      
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => {
          setSidePanelVisible(false);
          router.push("/customer/home");
        }}
      >
        <Ionicons name="home" size={20} color="#007AFF" />
        <Text style={styles.menuItemText}>Home</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.menuItem, styles.activeMenuItem]}
        onPress={() => setSidePanelVisible(false)}
      >
        <Ionicons name="search" size={20} color="#007AFF" />
        <Text style={styles.menuItemText}>Search</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => {
          setSidePanelVisible(false);
          router.push("/customer/messages");
        }}
      >
        <Ionicons name="chatbubbles" size={20} color="#007AFF" />
        <Text style={styles.menuItemText}>Messages</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => {
          setSidePanelVisible(false);
          router.push("/customer/myorders");
        }}
      >
        <Ionicons name="list" size={20} color="#007AFF" />
        <Text style={styles.menuItemText}>Orders</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => {
          setSidePanelVisible(false);
          router.push("/customer/profile");
        }}
      >
        <Ionicons name="person" size={20} color="#007AFF" />
        <Text style={styles.menuItemText}>Profile</Text>
      </TouchableOpacity>
    </View>
  );

  const renderProductCard = ({ item }: { item: Product }) => (
    <TouchableOpacity style={styles.card}>
      <Text style={styles.cardTitle}>{item.name}</Text>
      <Text style={styles.cardContent}>{item.description}</Text>
      <Text style={styles.cardContent}>💰 ${item.price}</Text>
      <Text style={styles.cardContent}>📂 {item.category}</Text>
      {item.address && (
        <Text style={styles.cardContent}>📍 {item.address}</Text>
      )}
      {item.createdAt?.seconds && (
        <Text style={styles.timestamp}>
          {new Date(item.createdAt.seconds * 1000).toLocaleString()}
        </Text>
      )}
    </TouchableOpacity>
  );

  const productsWithLocation = searchResults.filter(product => 
    product.latitude && product.longitude
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with menu button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSidePanelVisible(true)}>
          <Ionicons name="menu" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🔍 Search</Text>
        <View style={{ width: 28 }} /> {/* Spacer for balance */}
      </View>

      {/* Side Panel */}
      {sidePanelVisible && <SidePanel />}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#777" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for needs or offers..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={20} color="#777" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Search Filters */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Filter by:</Text>
        <View style={styles.filterOptions}>
          <TouchableOpacity 
            style={[styles.filterButton, activeFilter === "all" && styles.activeFilter]}
            onPress={() => setActiveFilter("all")}
          >
            <Text style={[styles.filterText, activeFilter === "all" && styles.activeFilterText]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, activeFilter === "need" && styles.activeFilter]}
            onPress={() => setActiveFilter("need")}
          >
            <Text style={[styles.filterText, activeFilter === "need" && styles.activeFilterText]}>Needs</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, activeFilter === "offer" && styles.activeFilter]}
            onPress={() => setActiveFilter("offer")}
          >
            <Text style={[styles.filterText, activeFilter === "offer" && styles.activeFilterText]}>Offers</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* View Toggle - Always Visible */}
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

      {/* Recent Searches - Only show when no search results and not in map view */}
      {!mapView && searchResults.length === 0 && recentSearches.length > 0 && !isSearching && !searchQuery && (
        <View style={styles.recentSearchesContainer}>
          <Text style={styles.sectionTitle}>Recent Searches</Text>
          <View style={styles.recentSearches}>
            {recentSearches.map((search, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.recentSearchItem}
                onPress={() => {
                  setSearchQuery(search);
                  handleSearch();
                }}
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
          {searchResults.length > 0 ? (
            <>
              <Text style={styles.resultsCount}>
                Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                {mapView && productsWithLocation.length > 0 && (
                  <Text style={styles.mapResultsCount}>
                    {" "}({productsWithLocation.length} on map)
                  </Text>
                )}
              </Text>
              
              {mapView ? (
                // MAP VIEW WITH RESULTS
                <View style={styles.mapContainer}>
                  <MapView 
                    style={styles.map}
                    initialRegion={{
                      latitude: currentLocation?.latitude || 37.78825,
                      longitude: currentLocation?.longitude || -122.4324,
                      latitudeDelta: 0.0922,
                      longitudeDelta: 0.0421,
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
                    
                    {/* Product Markers */}
                    {productsWithLocation.map((product) => (
                      <Marker
                        key={product.id}
                        coordinate={{
                          latitude: product.latitude!,
                          longitude: product.longitude!,
                        }}
                        title={product.name}
                        description={`$${product.price} - ${product.category}`}
                        onPress={() => setSelectedProduct(product)}
                      >
                        <View style={styles.marker}>
                          <Text style={styles.markerText}>${product.price}</Text>
                        </View>
                      </Marker>
                    ))}
                  </MapView>
                  
                  {/* Selected Product Info */}
                  {selectedProduct && (
                    <View style={styles.selectedProductCard}>
                      <Text style={styles.selectedProductTitle}>{selectedProduct.name}</Text>
                      <Text style={styles.selectedProductPrice}>${selectedProduct.price}</Text>
                      <Text style={styles.selectedProductCategory}>{selectedProduct.category}</Text>
                      <Text style={styles.selectedProductDescription}>
                        {selectedProduct.description}
                      </Text>
                      <TouchableOpacity 
                        style={styles.viewDetailsButton}
                        onPress={() => setSelectedProduct(null)}
                      >
                        <Text style={styles.viewDetailsText}>Close</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* No Location Warning */}
                  {productsWithLocation.length === 0 && (
                    <View style={styles.noLocationWarning}>
                      <Ionicons name="location-outline" size={30} color="#666" />
                      <Text style={styles.noLocationText}>
                        No products with location data found
                      </Text>
                      <Text style={styles.noLocationSubText}>
                        Switch to list view to see all results
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                // LIST VIEW WITH RESULTS
                <FlatList
                  data={searchResults}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 20 }}
                  renderItem={renderProductCard}
                />
              )}
            </>
          ) : (
            // NO SEARCH RESULTS OR INITIAL STATE
            <>
              {searchQuery ? (
                // SEARCH WAS PERFORMED BUT NO RESULTS
                <View style={styles.noResultsContainer}>
                  <Ionicons name="search-outline" size={50} color="#ccc" />
                  <Text style={styles.noResultsText}>No results found for "{searchQuery}"</Text>
                  <Text style={styles.noResultsSubText}>Try different keywords or filters</Text>
                </View>
              ) : mapView ? (
                // INITIAL MAP VIEW (NO SEARCH YET)
                <View style={styles.mapContainer}>
                  <MapView 
                    style={styles.map}
                    initialRegion={{
                      latitude: currentLocation?.latitude || 37.78825,
                      longitude: currentLocation?.longitude || -122.4324,
                      latitudeDelta: 0.0922,
                      longitudeDelta: 0.0421,
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
                  </MapView>
                  
                  {/* Welcome Message on Map */}
                  <View style={styles.welcomeMapOverlay}>
                    <Ionicons name="search-outline" size={40} color="#007AFF" />
                    <Text style={styles.welcomeMapText}>Search for products to see them on the map</Text>
                    <Text style={styles.welcomeMapSubText}>
                      Use the search bar above to find needs or offers near you
                    </Text>
                  </View>
                </View>
              ) : (
                // INITIAL LIST VIEW (NO SEARCH YET) - SHOW RECENT SEARCHES OR WELCOME
                <View style={styles.initialStateContainer}>
                  <Ionicons name="search-outline" size={60} color="#f0f0f0" />
                  <Text style={styles.initialStateText}>Search for needs or offers</Text>
                  <Text style={styles.initialStateSubText}>
                    Enter keywords in the search bar above to get started
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
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  sidePanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: width * 0.8,
    backgroundColor: 'white',
    zIndex: 1000,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  sidePanelClose: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  sidePanelHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 15,
    marginBottom: 15,
  },
  sidePanelTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 5,
  },
  activeMenuItem: {
    backgroundColor: '#f0f8ff',
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 12,
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  filterOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 15,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activeFilter: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterText: {
    color: 'white',
  },
  viewToggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginVertical: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 4,
  },
  viewToggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  activeViewToggle: {
    backgroundColor: '#007AFF',
  },
  viewToggleText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#007AFF',
  },
  activeViewToggleText: {
    color: '#fff',
  },
  recentSearchesContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  recentSearches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    gap: 5,
  },
  recentSearchText: {
    color: '#666',
    fontSize: 14,
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
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  mapResultsCount: {
    color: '#007AFF',
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
    height: height * 0.7,
    marginBottom: 20,
  },
  map: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  marker: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 8,
    minWidth: 50,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  selectedProductCard: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedProductTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  selectedProductPrice: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 3,
  },
  selectedProductCategory: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
  },
  selectedProductDescription: {
    fontSize: 12,
    color: '#888',
    marginBottom: 10,
  },
  viewDetailsButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  viewDetailsText: {
    color: 'white',
    fontWeight: '600',
  },
  noLocationWarning: {
    position: 'absolute',
    top: '50%',
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    transform: [{ translateY: -50 }],
  },
  noLocationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 10,
    textAlign: 'center',
  },
  noLocationSubText: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  welcomeMapOverlay: {
    position: 'absolute',
    top: '50%',
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    transform: [{ translateY: -80 }],
  },
  welcomeMapText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  welcomeMapSubText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  initialStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  initialStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 20,
    textAlign: 'center',
  },
  initialStateSubText: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  card: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  cardContent: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 15,
    textAlign: 'center',
  },
  noResultsSubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
});