// import { Ionicons } from '@expo/vector-icons';
// import { useRouter } from "expo-router";
// import { collection, getDocs, orderBy, query, doc, getDoc } from "firebase/firestore";
// import React, { useEffect, useState } from "react";
// import {
//   Dimensions,
//   FlatList,
//   Image,
//   SafeAreaView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View
// } from "react-native";
// import { db } from "../../../firebaseConfig";

// const { width } = Dimensions.get('window');

// type ShopkeeperData = {
//   uid: string;
//   email: string;
//   shopName: string;
//   ownerName: string;
//   location: string;
//   phone: string;
//   createdAt: any;
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
//   createdAt?: any;
//   shopkeeperId?: string;
//   shopId?: string;
//   shopkeeper?: string;
// };

// export default function ShopkeeperHome() {
//   const [posts, setPosts] = useState<Product[]>([]);
//   const [filteredPosts, setFilteredPosts] = useState<Product[]>([]);
//   const [activeTab, setActiveTab] = useState("all");
//   const [sidePanelVisible, setSidePanelVisible] = useState(false);
//   const [stats, setStats] = useState({
//     totalOrders: 0,
//     pendingOrders: 0,
//     totalRevenue: 0
//   });
//   const [shopkeeperData, setShopkeeperData] = useState<{[key: string]: ShopkeeperData}>({});

//   const router = useRouter();

//   useEffect(() => {
//     const fetchProductsAndShopkeepers = async () => {
//       try {
//         // Fetch products
//         const q = query(
//           collection(db, "products"),
//           orderBy("createdAt", "desc")
//         );
  
//         const snapshot = await getDocs(q);
//         const data = snapshot.docs.map((doc) => ({
//           id: doc.id,
//           ...doc.data(),
//         })) as Product[];
        
//         setPosts(data);
//         setFilteredPosts(data);

//         // Fetch shopkeeper data for each product
//         const shopkeeperMap: {[key: string]: ShopkeeperData} = {};
//         const shopkeeperIds = new Set<string>();
        
//         // Collect all unique shopkeeper IDs from products
//         for (const product of data) {
//           // Try different possible field names for shopkeeper ID
//           const shopkeeperId = product.shopkeeperId || product.shopId || product.shopkeeper;
//           if (shopkeeperId) {
//             shopkeeperIds.add(shopkeeperId);
//           }
//         }

//         // Fetch all shopkeeper data
//         for (const shopkeeperId of Array.from(shopkeeperIds)) {
//           try {
//             const shopkeeperDoc = await getDoc(doc(db, "shopkeepers", shopkeeperId));
//             if (shopkeeperDoc.exists()) {
//               shopkeeperMap[shopkeeperId] = shopkeeperDoc.data() as ShopkeeperData;
//             }
//           } catch (error) {
//             console.error("Error fetching shopkeeper:", error);
//           }
//         }
        
//         setShopkeeperData(shopkeeperMap);
//       } catch (err) {
//         console.log("Error fetching products:", err);
//       }
//     };
  
//     fetchProductsAndShopkeepers();
//   }, []);
  
//   useEffect(() => {
//     setFilteredPosts(posts);
//   }, [activeTab, posts]);

//   // Function to get shopkeeper name for a product
//   const getShopkeeperName = (product: Product) => {
//     const shopkeeperId = product.shopkeeperId || product.shopId || product.shopkeeper;
//     if (shopkeeperId && shopkeeperData[shopkeeperId]) {
//       return shopkeeperData[shopkeeperId].shopName || shopkeeperData[shopkeeperId].ownerName || "Unknown Shop";
//     }
//     return "Unknown Shop";
//   };

//   // Function to get shopkeeper location for a product
//   const getShopkeeperLocation = (product: Product) => {
//     const shopkeeperId = product.shopkeeperId || product.shopId || product.shopkeeper;
//     if (shopkeeperId && shopkeeperData[shopkeeperId]) {
//       return shopkeeperData[shopkeeperId].location || "Unknown Location";
//     }
//     return "Unknown Location";
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
//         <Text style={styles.sidePanelTitle}>Shop Menu</Text>
//       </View>
      
//       <TouchableOpacity 
//         style={styles.menuItem}
//         onPress={() => {
//           setSidePanelVisible(false);
//           router.push("/shopkeeper/home");
//         }}
//       >
//         <Ionicons name="home" size={20} color="#007AFF" />
//         <Text style={styles.menuItemText}>Dashboard</Text>
//       </TouchableOpacity>
      
//       <TouchableOpacity 
//         style={styles.menuItem}
//         onPress={() => {
//           setSidePanelVisible(false);
//           router.push("/shopkeeper/products");
//         }}
//       >
//         <Ionicons name="cube" size={20} color="#007AFF" />
//         <Text style={styles.menuItemText}>Products</Text>
//       </TouchableOpacity>
      
//       <TouchableOpacity 
//         style={styles.menuItem}
//         onPress={() => {
//           setSidePanelVisible(false);
//           router.push("/shopkeeper/myorders");
//         }}
//       >
//         <Ionicons name="list" size={20} color="#007AFF" />
//         <Text style={styles.menuItemText}>Orders</Text>
//       </TouchableOpacity>
      
//       <TouchableOpacity 
//         style={styles.menuItem}
//         onPress={() => {
//           setSidePanelVisible(false);
//           router.push("/shopkeeper/analytics");
//         }}
//       >
//         <Ionicons name="stats-chart" size={20} color="#007AFF" />
//         <Text style={styles.menuItemText}>Analytics</Text>
//       </TouchableOpacity>
      
//       <TouchableOpacity 
//         style={styles.menuItem}
//         onPress={() => {
//           setSidePanelVisible(false);
//           router.push("/shopkeeper/profile");
//         }}
//       >
//         <Ionicons name="person" size={20} color="#007AFF" />
//         <Text style={styles.menuItemText}>Shop Profile</Text>
//       </TouchableOpacity>
//     </View>
//   );

//   return (
//     <SafeAreaView style={styles.container}>
//       {/* Header with menu button */}
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => setSidePanelVisible(true)}>
//           <Ionicons name="menu" size={28} color="#333" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>🏪 Shop Dashboard</Text>
//         <View style={{ width: 28 }} /> {/* Spacer for balance */}
//       </View>

//       {/* Side Panel */}
//       {sidePanelVisible && <SidePanel />}

//       {/* Stats Overview */}
//       <View style={styles.statsContainer}>
//         <View style={styles.statCard}>
//           <Text style={styles.statValue}>{stats.totalOrders}</Text>
//           <Text style={styles.statLabel}>Total Orders</Text>
//         </View>
//         <View style={[styles.statCard, styles.statCardHighlight]}>
//           <Text style={[styles.statValue, styles.statValueHighlight]}>{stats.pendingOrders}</Text>
//           <Text style={styles.statLabel}>Pending Orders</Text>
//         </View>
//         <View style={styles.statCard}>
//           <Text style={styles.statValue}>${stats.totalRevenue}</Text>
//           <Text style={styles.statLabel}>Revenue</Text>
//         </View>
//       </View>

//       {/* Post Type Tabs */}
//       <View style={styles.tabContainer}>
//         <TouchableOpacity 
//           style={[styles.tab, activeTab === "all" && styles.activeTab]}
//           onPress={() => setActiveTab("all")}
//         >
//           <Text style={[styles.tabText, activeTab === "all" && styles.activeTabText]}>All Posts</Text>
//         </TouchableOpacity>
//         <TouchableOpacity 
//           style={[styles.tab, activeTab === "need" && styles.activeTab]}
//           onPress={() => setActiveTab("need")}
//         >
//           <Text style={[styles.tabText, activeTab === "need" && styles.activeTabText]}>Customer Needs</Text>
//         </TouchableOpacity>
//         <TouchableOpacity 
//           style={[styles.tab, activeTab === "offer" && styles.activeTab]}
//           onPress={() => setActiveTab("offer")}
//         >
//           <Text style={[styles.tabText, activeTab === "offer" && styles.activeTabText]}>Offers</Text>
//         </TouchableOpacity>
//       </View>

//       {/* Posts List */}
//       <FlatList
//         data={filteredPosts}
//         keyExtractor={(item) => item.id}
//         renderItem={({ item }) => (
//           <View style={styles.card}>
//             {/* User Info Header */}
//             <View style={styles.cardHeader}>
//               <View style={styles.userInfo}>
//                 <View style={styles.avatar}></View>
//                 <View>
//                   <Text style={styles.username}>
//                     {getShopkeeperName(item)}
//                   </Text>
//                   <Text style={styles.userLocation}>
//                     {getShopkeeperLocation(item)}
//                   </Text>
//                 </View>
//               </View>
//               <TouchableOpacity>
//                 <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
//               </TouchableOpacity>
//             </View>

//             {/* Product Image */}
//             {item.imageUrl ? (
//               <Image
//                 source={{ uri: item.imageUrl }}
//                 style={styles.productImage}
//                 resizeMode="cover"
//               />
//             ) : (
//               <View style={styles.imagePlaceholder}>
//                 <Ionicons name="image" size={40} color="#ccc" />
//                 <Text style={styles.placeholderText}>No Image</Text>
//               </View>
//             )}

//             {/* Product Details */}
//             <View style={styles.cardContent}>
//               <Text style={styles.productName}>{item.name}</Text>
//               <Text style={styles.productDescription}>{item.description}</Text>
              
//               <View style={styles.detailsRow}>
//                 <Text style={styles.productPrice}>${item.price}</Text>
//                 <Text style={styles.productCategory}>#{item.category || 'General'}</Text>
//               </View>
              
//               <View style={styles.detailsRow}>
//                 <Text style={styles.stockInfo}>{item.stock || 0} in stock</Text>
//                 <Text style={styles.postDate}>
//                   {item.createdAt ? 
//                     new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 
//                     'Unknown date'
//                   }
//                 </Text>
//               </View>
//             </View>
//           </View>
//         )}
//         contentContainerStyle={styles.listContent}
//       />
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#f9f9f9",
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 20,
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//   },
//   headerTitle: {
//     fontSize: 20,
//     fontWeight: "bold",
//   },
//   sidePanel: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     width: width * 0.7,
//     height: '100%',
//     backgroundColor: '#fff',
//     zIndex: 100,
//     padding: 20,
//     shadowColor: "#000",
//     shadowOffset: {
//       width: 2,
//       height: 0,
//     },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//     elevation: 5,
//   },
//   sidePanelClose: {
//     alignSelf: 'flex-end',
//     marginBottom: 20,
//   },
//   sidePanelHeader: {
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//     paddingBottom: 15,
//     marginBottom: 20,
//   },
//   sidePanelTitle: {
//     fontSize: 22,
//     fontWeight: 'bold',
//   },
//   menuItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 15,
//     borderBottomWidth: 1,
//     borderBottomColor: '#f0f0f0',
//   },
//   menuItemText: {
//     fontSize: 16,
//     marginLeft: 15,
//   },
//   statsContainer: {
//     flexDirection: 'row',
//     padding: 16,
//     backgroundColor: '#fff',
//   },
//   statCard: {
//     flex: 1,
//     alignItems: 'center',
//     padding: 12,
//     backgroundColor: '#f8f9fa',
//     borderRadius: 8,
//     marginHorizontal: 4,
//   },
//   statCardHighlight: {
//     backgroundColor: '#007AFF',
//   },
//   statValue: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   statValueHighlight: {
//     color: '#fff',
//   },
//   statLabel: {
//     fontSize: 12,
//     color: '#666',
//     marginTop: 4,
//   },
//   tabContainer: {
//     flexDirection: 'row',
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//   },
//   tab: {
//     flex: 1,
//     paddingVertical: 12,
//     alignItems: 'center',
//   },
//   activeTab: {
//     borderBottomWidth: 2,
//     borderBottomColor: '#007AFF',
//   },
//   tabText: {
//     fontSize: 14,
//     color: '#666',
//   },
//   activeTabText: {
//     color: '#007AFF',
//     fontWeight: '600',
//   },
//   listContent: {
//     padding: 16,
//   },
//   card: {
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     marginBottom: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   cardHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 12,
//   },
//   userInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   avatar: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: '#007AFF',
//     marginRight: 10,
//   },
//   username: {
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   userLocation: {
//     fontSize: 12,
//     color: '#666',
//   },
//   productImage: {
//     width: '100%',
//     height: 200,
//   },
//   imagePlaceholder: {
//     width: '100%',
//     height: 200,
//     backgroundColor: '#f0f0f0',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   placeholderText: {
//     marginTop: 8,
//     color: '#999',
//   },
//   cardContent: {
//     padding: 12,
//   },
//   productName: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginBottom: 4,
//   },
//   productDescription: {
//     fontSize: 14,
//     color: '#666',
//     marginBottom: 8,
//   },
//   detailsRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 4,
//   },
//   productPrice: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#007AFF',
//   },
//   productCategory: {
//     fontSize: 12,
//     color: '#666',
//     backgroundColor: '#f0f0f0',
//     paddingHorizontal: 8,
//     paddingVertical: 2,
//     borderRadius: 4,
//   },
//   stockInfo: {
//     fontSize: 12,
//     color: '#666',
//   },
//   postDate: {
//     fontSize: 12,
//     color: '#999',
//   },
// } as const);


import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { collection, getDocs, orderBy, query, doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { db } from "../../../firebaseConfig";

const { width } = Dimensions.get('window');

type ShopkeeperData = {
  uid: string;
  email: string;
  shopName: string;
  ownerName: string;
  location: string;
  phone: string;
  createdAt: any;
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
  createdAt?: any;
  shopkeeperId?: string;
  shopId?: string;
  shopkeeper?: string;
};

export default function ShopkeeperHome() {
  const [posts, setPosts] = useState<Product[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [sidePanelVisible, setSidePanelVisible] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0
  });
  const [shopkeeperData, setShopkeeperData] = useState<{[key: string]: ShopkeeperData}>({});

  const router = useRouter();

  useEffect(() => {
    const fetchProductsAndShopkeepers = async () => {
      try {
        // Fetch products
        const q = query(
          collection(db, "products"),
          orderBy("createdAt", "desc")
        );
  
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];
        
        setPosts(data);
        setFilteredPosts(data);

        // Fetch shopkeeper data for each product
        const shopkeeperMap: {[key: string]: ShopkeeperData} = {};
        const shopkeeperIds = new Set<string>();
        
        // Collect all unique shopkeeper IDs from products
        for (const product of data) {
          // Try different possible field names for shopkeeper ID
          const shopkeeperId = product.shopkeeperId || product.shopId || product.shopkeeper;
          if (shopkeeperId) {
            shopkeeperIds.add(shopkeeperId);
          }
        }

        // Fetch all shopkeeper data
        for (const shopkeeperId of Array.from(shopkeeperIds)) {
          try {
            const shopkeeperDoc = await getDoc(doc(db, "shopkeepers", shopkeeperId));
            if (shopkeeperDoc.exists()) {
              shopkeeperMap[shopkeeperId] = shopkeeperDoc.data() as ShopkeeperData;
            }
          } catch (error) {
            console.error("Error fetching shopkeeper:", error);
          }
        }
        
        setShopkeeperData(shopkeeperMap);
      } catch (err) {
        console.log("Error fetching products:", err);
      }
    };
  
    fetchProductsAndShopkeepers();
  }, []);
  
  useEffect(() => {
    setFilteredPosts(posts);
  }, [activeTab, posts]);

  // Function to get shopkeeper name for a product
  const getShopkeeperName = (product: Product) => {
    const shopkeeperId = product.shopkeeperId || product.shopId || product.shopkeeper;
    if (shopkeeperId && shopkeeperData[shopkeeperId]) {
      return shopkeeperData[shopkeeperId].shopName || shopkeeperData[shopkeeperId].ownerName || "Unknown Shop";
    }
    return "Unknown Shop";
  };

  // Function to get shopkeeper location for a product
  const getShopkeeperLocation = (product: Product) => {
    const shopkeeperId = product.shopkeeperId || product.shopId || product.shopkeeper;
    if (shopkeeperId && shopkeeperData[shopkeeperId]) {
      return shopkeeperData[shopkeeperId].location || "Unknown Location";
    }
    return "Unknown Location";
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
        <Text style={styles.sidePanelTitle}>Shop Menu</Text>
      </View>
      
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => {
          setSidePanelVisible(false);
          router.push("/shopkeeper/home");
        }}
      >
        <Ionicons name="home" size={20} color="#007AFF" />
        <Text style={styles.menuItemText}>Dashboard</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => {
          setSidePanelVisible(false);
          router.push("/shopkeeper/products");
        }}
      >
        <Ionicons name="cube" size={20} color="#007AFF" />
        <Text style={styles.menuItemText}>Products</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => {
          setSidePanelVisible(false);
          router.push("/shopkeeper/myorders");
        }}
      >
        <Ionicons name="list" size={20} color="#007AFF" />
        <Text style={styles.menuItemText}>Orders</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => {
          setSidePanelVisible(false);
          router.push("/shopkeeper/analytics");
        }}
      >
        <Ionicons name="stats-chart" size={20} color="#007AFF" />
        <Text style={styles.menuItemText}>Analytics</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => {
          setSidePanelVisible(false);
          router.push("/shopkeeper/profile");
        }}
      >
        <Ionicons name="person" size={20} color="#007AFF" />
        <Text style={styles.menuItemText}>Shop Profile</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with menu button - FIXED LAYOUT */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSidePanelVisible(true)} style={styles.menuButton}>
          <Ionicons name="menu" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shop Dashboard</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Side Panel */}
      {sidePanelVisible && <SidePanel />}

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalOrders}</Text>
          <Text style={styles.statLabel}>Total Orders</Text>
        </View>
        <View style={[styles.statCard, styles.statCardHighlight]}>
          <Text style={[styles.statValue, styles.statValueHighlight]}>{stats.pendingOrders}</Text>
          <Text style={styles.statLabel}>Customer Needs</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>${stats.totalRevenue}</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
      </View>

      {/* Post Type Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "all" && styles.activeTab]}
          onPress={() => setActiveTab("all")}
        >
          <Text style={[styles.tabText, activeTab === "all" && styles.activeTabText]}>All Posts</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "need" && styles.activeTab]}
          onPress={() => setActiveTab("need")}
        >
          <Text style={[styles.tabText, activeTab === "need" && styles.activeTabText]}>Customer Needs</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "offer" && styles.activeTab]}
          onPress={() => setActiveTab("offer")}
        >
          <Text style={[styles.tabText, activeTab === "offer" && styles.activeTabText]}>Offers</Text>
        </TouchableOpacity>
      </View>

      {/* Posts List */}
      <FlatList
        data={filteredPosts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* User Info Header */}
            <View style={styles.cardHeader}>
              <View style={styles.userInfo}>
                <View style={styles.avatar}></View>
                <View>
                  <Text style={styles.username}>
                    {getShopkeeperName(item)}
                  </Text>
                  <Text style={styles.userLocation}>
                    {getShopkeeperLocation(item)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity>
                <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Product Image */}
            {item.imageUrl ? (
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.productImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image" size={40} color="#ccc" />
                <Text style={styles.placeholderText}>No Image</Text>
              </View>
            )}

            {/* Product Details */}
            <View style={styles.cardContent}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productDescription}>{item.description}</Text>
              
              <View style={styles.detailsRow}>
                <Text style={styles.productPrice}>${item.price}</Text>
                <Text style={styles.productCategory}>#{item.category || 'General'}</Text>
              </View>
              
              <View style={styles.detailsRow}>
                <Text style={styles.stockInfo}>{item.stock || 0} in stock</Text>
                <Text style={styles.postDate}>
                  {item.createdAt ? 
                    new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 
                    'Unknown date'
                  }
                </Text>
              </View>
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />

      {/* Bottom Navigation - Added to match your image */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={24} color="#007AFF" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="chatbubble-outline" size={24} color="#666" />
          <Text style={styles.navText}>Messages</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="list" size={24} color="#666" />
          <Text style={styles.navText}>Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person-outline" size={24} color="#666" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  // FIXED HEADER STYLES
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuButton: {
    width: 40,
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: 'center',
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  sidePanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width * 0.7,
    height: '100%',
    backgroundColor: '#fff',
    zIndex: 100,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sidePanelClose: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  sidePanelHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 15,
    marginBottom: 20,
  },
  sidePanelTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  statCardHighlight: {
    backgroundColor: '#007AFF',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statValueHighlight: {
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80, // Space for bottom navigation
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    marginRight: 10,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
  },
  userLocation: {
    fontSize: 12,
    color: '#666',
  },
  productImage: {
    width: '100%',
    height: 200,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 8,
    color: '#999',
  },
  cardContent: {
    padding: 12,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  productCategory: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stockInfo: {
    fontSize: 12,
    color: '#666',
  },
  postDate: {
    fontSize: 12,
    color: '#999',
  },
  // Bottom Navigation Styles
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingVertical: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navText: {
    fontSize: 12,
    marginTop: 4,
    color: '#666',
  },
} as const);