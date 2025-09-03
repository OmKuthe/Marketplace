import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
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

export default function ShopkeeperHome() {
  const [posts, setPosts] = useState<any[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [sidePanelVisible, setSidePanelVisible] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0
  });
  const router = useRouter();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const q = query(
          collection(db, "products"),
          orderBy("createdAt", "desc")
        );
  
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPosts(data);
        setFilteredPosts(data);
      } catch (err) {
        console.log("Error fetching products:", err);
      }
    };
  
    fetchProducts();
  }, []);
  
  
  useEffect(() => {
      setFilteredPosts(posts);
  }, [activeTab, posts]);

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
          router.push("/shopkeeper/messages");
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
          router.push("/shopkeeper/profile");
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
      {/* Header with menu button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSidePanelVisible(true)}>
          <Ionicons name="menu" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🏪 Shop Dashboard</Text>
        <View style={{ width: 28 }} /> {/* Spacer for balance */}
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
          <Text style={styles.statLabel}>Pending Orders</Text>
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
                  <Text style={styles.username}>john_doe</Text>
                  <Text style={styles.userLocation}>New York, NY</Text>
                </View>
              </View>
              <TouchableOpacity>
                <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            
            {/* Product Image */}
            {item.image ? (
              <Image
                source={{ uri: item.image }}
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
                <Text style={styles.stockInfo}>20 in stock</Text>
                <Text style={styles.postDate}>
                  {item.timestamp ? 
                    new Date(item.timestamp.seconds * 1000).toLocaleDateString() : 
                    '3/9/2025'
                  }
                </Text>
              </View>
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

//proto 2
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 22,  // Increased from 16
    paddingHorizontal: 20, // Increased from 16
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 22,  // Slightly larger
    fontWeight: "bold",
    marginVertical: 4,  // Added vertical margin
  },
  sidePanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width * 0.75,
    height: '100%',
    backgroundColor: '#fff',
    zIndex: 100,
    padding: 24,  // Increased from 20
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  sidePanelClose: {
    alignSelf: 'flex-end',
    marginBottom: 24,  // Increased from 20
    padding: 8,  // Added for better touch area
  },
  sidePanelHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 20,  // Increased from 15
    marginBottom: 24,  // Increased from 20
  },
  sidePanelTitle: {
    fontSize: 24,  // Increased from 22
    fontWeight: 'bold',
    marginVertical: 6,  // Added vertical spacing
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,  // Increased from 15
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    fontSize: 17,  // Slightly larger
    marginLeft: 16,  // Increased from 15
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 20,  // Increased vertical padding
    paddingHorizontal: 20,  // Increased horizontal padding
    marginBottom: 8,  // Added bottom margin
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 20,  // Increased from 16
    borderRadius: 12,
    width: '30%',
    alignItems: 'center',
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statCardHighlight: {
    backgroundColor: '#e6f7ff',
  },
  statValue: {
    fontSize: 22,  // Increased from 20
    fontWeight: 'bold',
    color: '#007AFF',
    marginVertical: 6,  // Added vertical spacing
  },
  statValueHighlight: {
    color: '#1890ff',
  },
  statLabel: {
    fontSize: 13,  // Slightly larger
    color: '#666',
    marginTop: 6,  // Increased from 4
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,  // Increased from 16
    marginBottom: 20,  // Increased from 16
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,  // Increased from 10
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 15,  // Slightly larger
    fontWeight: '500',
  },
  activeTabText: {
    color: 'white',
  },
  listContent: {
    paddingVertical: 20,  // Increased vertical padding
    paddingHorizontal: 20,  // Increased horizontal padding
    paddingBottom: 24,  // Increased bottom padding
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,  // Increased from 16
    overflow: 'hidden',
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,  // Increased from 12
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,  // Increased from 36
    height: 40,  // Increased from 36
    borderRadius: 20,  // Adjusted for new size
    backgroundColor: '#007AFF',
    marginRight: 12,  // Increased from 10
  },
  username: {
    fontWeight: '600',
    fontSize: 15,  // Slightly larger
  },
  userLocation: {
    fontSize: 13,  // Slightly larger
    color: '#666',
    marginTop: 2,  // Added spacing
  },
  productImage: {
    width: '100%',
    height: 320,  // Increased from 300
  },
  imagePlaceholder: {
    width: '100%',
    height: 220,  // Increased from 200
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,  // Added padding
  },
  placeholderText: {
    marginTop: 12,  // Increased from 8
    color: '#999',
    fontSize: 14,  // Added font size for consistency
  },
  cardContent: {
    padding: 20,  // Increased from 16
  },
  productName: {
    fontWeight: 'bold',
    fontSize: 19,  // Increased from 18
    marginBottom: 12,  // Increased from 8
  },
  productDescription: {
    fontSize: 15,  // Increased from 14
    color: '#333',
    marginBottom: 16,  // Increased from 12
    lineHeight: 22,  // Increased from 20
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,  // Increased from 8
  },
  productPrice: {
    fontWeight: 'bold',
    fontSize: 17,  // Increased from 16
    color: '#007AFF',
  },
  productCategory: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,  // Increased from 8
    paddingVertical: 6,  // Increased from 4
    borderRadius: 6,  // Increased from 4
  },
  stockInfo: {
    fontSize: 15,  // Increased from 14
    color: '#52c41a',
    marginVertical: 4,  // Added vertical spacing
  },
  postDate: {
    fontSize: 13,  // Increased from 12
    color: '#999',
    marginTop: 4,  // Added spacing
  },
  // New footer style
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
});


//proto 1
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#fafafa",
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 16,
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//   },
//   headerTitle: {
//     fontSize: 20,
//     fontWeight: "bold",
//   },
//   sidePanel: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     width: width * 0.75,
//     height: '100%',
//     backgroundColor: '#fff',
//     zIndex: 100,
//     padding: 20,
//     elevation: 5,
//     shadowColor: "#000",
//     shadowOffset: {
//       width: 2,
//       height: 0,
//     },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
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
//     justifyContent: 'space-between',
//     padding: 16,
//   },
//   statCard: {
//     backgroundColor: '#fff',
//     padding: 16,
//     borderRadius: 12,
//     width: '30%',
//     alignItems: 'center',
//     elevation: 2,
//     shadowColor: "#000",
//     shadowOffset: {
//       width: 0,
//       height: 1,
//     },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//   },
//   statCardHighlight: {
//     backgroundColor: '#e6f7ff',
//   },
//   statValue: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#007AFF',
//   },
//   statValueHighlight: {
//     color: '#1890ff',
//   },
//   statLabel: {
//     fontSize: 12,
//     color: '#666',
//     marginTop: 4,
//   },
//   tabContainer: {
//     flexDirection: 'row',
//     marginHorizontal: 16,
//     marginBottom: 16,
//     backgroundColor: '#f0f0f0',
//     borderRadius: 10,
//     overflow: 'hidden',
//   },
//   tab: {
//     flex: 1,
//     paddingVertical: 10,
//     alignItems: 'center',
//   },
//   activeTab: {
//     backgroundColor: '#007AFF',
//   },
//   tabText: {
//     fontSize: 14,
//     fontWeight: '500',
//   },
//   activeTabText: {
//     color: 'white',
//   },
//   listContent: {
//     padding: 16,
//     paddingBottom: 20,
//   },
//   card: {
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     marginBottom: 16,
//     overflow: 'hidden',
//     elevation: 2,
//     shadowColor: "#000",
//     shadowOffset: {
//       width: 0,
//       height: 1,
//     },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//   },
//   cardHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#f0f0f0',
//   },
//   userInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   avatar: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: '#007AFF',
//     marginRight: 10,
//   },
//   username: {
//     fontWeight: '600',
//     fontSize: 14,
//   },
//   userLocation: {
//     fontSize: 12,
//     color: '#666',
//   },
//   productImage: {
//     width: '100%',
//     height: 300,
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
//     padding: 16,
//   },
//   productName: {
//     fontWeight: 'bold',
//     fontSize: 18,
//     marginBottom: 8,
//   },
//   productDescription: {
//     fontSize: 14,
//     color: '#333',
//     marginBottom: 12,
//     lineHeight: 20,
//   },
//   detailsRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   productPrice: {
//     fontWeight: 'bold',
//     fontSize: 16,
//     color: '#007AFF',
//   },
//   productCategory: {
//     fontSize: 14,
//     color: '#666',
//     backgroundColor: '#f0f0f0',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 4,
//   },
//   stockInfo: {
//     fontSize: 14,
//     color: '#52c41a',
//   },
//   postDate: {
//     fontSize: 12,
//     color: '#999',
//   },
// });