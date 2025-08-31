import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  ScrollView,
  Switch,
  Alert,
  Dimensions
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get('window');

// Define types for shopkeeper profile
type ShopProfile = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: 'customer' | 'shopkeeper';
  shopName: string;
  shopDescription?: string;
  shopAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  businessHours?: {
    open: string;
    close: string;
    days: string[];
  };
  preferences?: {
    notifications: boolean;
    orderAlerts: boolean;
    darkMode: boolean;
    language: string;
  };
  stats?: {
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    totalRevenue: number;
    activeProducts: number;
    customerRating: number;
    joinedDate: Date;
  };
  verification?: {
    verified: boolean;
    documentStatus: 'pending' | 'approved' | 'rejected';
  };
};

export default function ShopkeeperProfileScreen() {
  const [user, setUser] = useState<ShopProfile | null>(null);
  const [sidePanelVisible, setSidePanelVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [orderAlertsEnabled, setOrderAlertsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const router = useRouter();

  // Mock shopkeeper data
  useEffect(() => {
    const mockShopkeeper: ShopProfile = {
      id: "shopkeeper-123",
      name: "Rajesh Kumar",
      email: "rajesh@freshgrocery.com",
      phone: "+91 9876543210",
      avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=150&h=150&fit=crop&crop=face",
      role: "shopkeeper",
      shopName: "Fresh Grocery Store",
      shopDescription: "Your one-stop shop for fresh organic vegetables, fruits, and dairy products",
      shopAddress: {
        street: "45 Market Street",
        city: "Mumbai",
        state: "Maharashtra",
        zipCode: "400001"
      },
      businessHours: {
        open: "08:00",
        close: "20:00",
        days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
      },
      preferences: {
        notifications: true,
        orderAlerts: true,
        darkMode: false,
        language: "English"
      },
      stats: {
        totalOrders: 247,
        completedOrders: 230,
        pendingOrders: 17,
        totalRevenue: 184500,
        activeProducts: 45,
        customerRating: 4.8,
        joinedDate: new Date("2023-06-15")
      },
      verification: {
        verified: true,
        documentStatus: 'approved'
      }
    };

    setTimeout(() => {
      setUser(mockShopkeeper);
      setNotificationsEnabled(mockShopkeeper.preferences?.notifications || true);
      setOrderAlertsEnabled(mockShopkeeper.preferences?.orderAlerts || true);
      setDarkModeEnabled(mockShopkeeper.preferences?.darkMode || false);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.clear();
            router.replace("/");
          }
        }
      ]
    );
  };

  const handleEditProfile = () => {
    router.push("/shop_prof/edit-profile");
  };

  const handleShopSettings = () => {
    router.push("/shop_prof/shop-settings");
  };

  const handleProductsManagement = () => {
    router.push("/shopkeeper/products");
  };

  const handleOrderManagement = () => {
    router.push("/shopkeeper/myorders");
  };

  const handleAnalytics = () => {
    router.push("/shopkeeper/analytics");
  };

  const handleSupport = () => {
    router.push("/shop_prof/support");
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
          router.push("/shopkeeper/messages");
        }}
      >
        <Ionicons name="chatbubbles" size={20} color="#007AFF" />
        <Text style={styles.menuItemText}>Messages</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.menuItem, styles.activeMenuItem]}
        onPress={() => setSidePanelVisible(false)}
      >
        <Ionicons name="person" size={20} color="#007AFF" />
        <Text style={styles.menuItemText}>Profile</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSidePanelVisible(true)}>
            <Ionicons name="menu" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>👤 Shop Profile</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Ionicons name="business-outline" size={64} color="#ccc" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with menu button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSidePanelVisible(true)}>
          <Ionicons name="menu" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>👤 Shop Profile</Text>
        <TouchableOpacity onPress={handleEditProfile}>
          <Ionicons name="create-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Side Panel */}
      {sidePanelVisible && <SidePanel />}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: user?.avatar || 'https://via.placeholder.com/150' }} 
              style={styles.avatar}
            />
            {user?.verification?.verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
              </View>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.shopName}>{user?.shopName}</Text>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <Text style={styles.shopDescription}>{user?.shopDescription}</Text>
          </View>
        </View>

        {/* Business Info */}
        <View style={styles.businessInfo}>
          <View style={styles.infoItem}>
            <Ionicons name="location-outline" size={18} color="#007AFF" />
            <Text style={styles.infoText} numberOfLines={1}>
              {user?.shopAddress?.street}, {user?.shopAddress?.city}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={18} color="#007AFF" />
            <Text style={styles.infoText}>
              {user?.businessHours?.open} - {user?.businessHours?.close}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="call-outline" size={18} color="#007AFF" />
            <Text style={styles.infoText}>{user?.phone}</Text>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user?.stats?.totalOrders || 0}</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>₹{(user?.stats?.totalRevenue || 0).toLocaleString()}</Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user?.stats?.activeProducts || 0}</Text>
            <Text style={styles.statLabel}>Products</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user?.stats?.customerRating || 0}/5</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        {/* Shop Management Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shop Management</Text>
          
          <TouchableOpacity style={styles.menuItemCard} onPress={handleProductsManagement}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="cube-outline" size={22} color="#007AFF" />
              <Text style={styles.menuItemText}>Manage Products</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItemCard} onPress={handleOrderManagement}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="list-outline" size={22} color="#007AFF" />
              <Text style={styles.menuItemText}>Order Management</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItemCard} onPress={handleEditProfile}>
            <View style={styles.menuItemLeft}>
            <Ionicons name="create-outline" size={22} color="#007AFF" />
            <Text style={styles.menuItemText}>Edit Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItemCard} onPress={handleShopSettings}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="settings-outline" size={22} color="#007AFF" />
              <Text style={styles.menuItemText}>Shop Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <View style={styles.menuItemCard}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="notifications-outline" size={22} color="#007AFF" />
              <Text style={styles.menuItemText}>Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={notificationsEnabled ? '#007AFF' : '#f4f3f4'}
            />
          </View>

          <View style={styles.menuItemCard}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="alert-circle-outline" size={22} color="#007AFF" />
              <Text style={styles.menuItemText}>Order Alerts</Text>
            </View>
            <Switch
              value={orderAlertsEnabled}
              onValueChange={setOrderAlertsEnabled}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={orderAlertsEnabled ? '#007AFF' : '#f4f3f4'}
            />
          </View>

          <View style={styles.menuItemCard}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="moon-outline" size={22} color="#007AFF" />
              <Text style={styles.menuItemText}>Dark Mode</Text>
            </View>
            <Switch
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={darkModeEnabled ? '#007AFF' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity style={styles.menuItemCard} onPress={handleSupport}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="help-circle-outline" size={22} color="#007AFF" />
              <Text style={styles.menuItemText}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItemCard}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="document-text-outline" size={22} color="#007AFF" />
              <Text style={styles.menuItemText}>Terms & Policies</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.versionText}>Business App v1.2.0</Text>
          <Text style={styles.footerText}>FreshGrocery Partner © 2024</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
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
  activeMenuItem: {
    backgroundColor: '#f0f7ff',
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  profileHeader: {
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#34C759',
    borderRadius: 10,
    padding: 2,
  },
  profileInfo: {
    alignItems: 'center',
  },
  shopName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  userName: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  shopDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 20,
  },
  verificationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  verified: {
    backgroundColor: '#34C759',
  },
  notVerified: {
    backgroundColor: '#FF9500',
  },
  verificationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  businessInfo: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 16,
  },
  logoutText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    padding: 24,
  },
  versionText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});