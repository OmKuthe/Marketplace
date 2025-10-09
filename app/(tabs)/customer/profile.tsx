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
  Dimensions,
  ActivityIndicator,
  Animated
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth, db } from "../../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "../../../hooks/useAuth";

const { width } = Dimensions.get('window');

// CONSISTENT COLOR SCHEME (Same as Search and MyOrders)
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
  needColor: '#f97316',
  offerColor: '#10b981',
  gradientPrimary: ['#667eea', '#764ba2'],
  gradientSecondary: ['#f093fb', '#f5576c'],
  gradientSuccess: ['#10b981', '#34d399'],
  gradientWarning: ['#f59e0b', '#fbbf24'],
  needCard: 'rgba(249, 115, 22, 0.08)',
  offerCard: 'rgba(16, 185, 129, 0.08)',
  lightBackground: 'rgba(226, 232, 240, 0.4)',
  electricPurple: '#8b5cf6',
  deepBlue: '#1e40af',
};

type CustomerProfile = {
  uid: string;
  email: string;
  fullName: string;
  address: string;
  phone: string;
  createdAt: any;
};

export default function ProfileScreen() {
  const [user, setUser] = useState<CustomerProfile | null>(null);
  const [sidePanelVisible, setSidePanelVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const router = useRouter();
  
  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(300)).current;

  const { user: authUser, role, logout } = useAuth();

  useEffect(() => {
    if (!authUser && !isLoading) {
      router.replace("/");
      return;
    }

    if (authUser) {
      fetchCustomerProfile();
    }
  }, [authUser, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [isLoading]);

  const fetchCustomerProfile = async () => {
    if (!authUser) return;

    try {
      const docRef = doc(db, "customers", authUser.uid);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        setUser(snap.data() as CustomerProfile);
      } else {
        console.log("No customer profile found");
      }
    } catch (error) {
      console.error("Error fetching customer:", error);
      Alert.alert("Error", "Failed to fetch profile.");
    } finally {
      setIsLoading(false);
    }
  };

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
            try {
              await logout();
              await AsyncStorage.clear();
              console.log("Logout successful");
            } catch (error) {
              console.error("Logout error:", error);
              Alert.alert("Logout Failed", "There was an error logging out");
            }
          }
        }
      ]
    );
  };

  const handleEditProfile = () => {
    router.push("/profile/edit-profile" as any);
  };

  const handleOrderHistory = () => {
    router.push("/customer/myorders" as any);
  };

  const handlePaymentMethods = () => {
    router.push("/customer/payment" as any);
  };

  const handleSupport = () => {
    router.push("/customer/support" as any);
  };

  // Enhanced Side Panel with Consistent Styling
  const SidePanel = () => {
    React.useEffect(() => {
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
          <Text style={styles.sidePanelTitle}>TownMart</Text>
          <Text style={styles.sidePanelSubtitle}>Discover • Connect • Shop</Text>
        </View>
        
        {[
          { name: "Home", icon: "home-outline", route: "/customer/home" },
          { name: "Search", icon: "search", route: "/customer/search" },
          { name: "Messages", icon: "chatbubble-outline", route: "/customer/messages" },
          { name: "Orders", icon: "list-outline", route: "/customer/myorders" },
          { name: "Profile", icon: "person-outline", route: null },
        ].map((item, index) => (
          <TouchableOpacity 
            key={index}
            style={[styles.menuItem, item.name === "Profile" && styles.activeMenuItem]}
            onPress={() => {
              closePanel();
              if (item.route) {
                router.push(item.route as any);
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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        {/* CONSISTENT Header with TownMart */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => setSidePanelVisible(true)}
            style={styles.headerButton}
          >
            <Ionicons name="menu" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>TownMart</Text>
            <Text style={styles.headerSubtitle}>Profile</Text>
          </View>
          
          <View style={styles.headerButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!authUser) {
    return null;
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        {/* CONSISTENT Header with TownMart */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => setSidePanelVisible(true)}
            style={styles.headerButton}
          >
            <Ionicons name="menu" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>TownMart</Text>
            <Text style={styles.headerSubtitle}>Profile</Text>
          </View>
          
          <View style={styles.headerButton} />
        </View>
        <View style={styles.centered}>
          <Ionicons name="person-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.noProfileText}>No customer profile found</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchCustomerProfile}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* CONSISTENT Header with TownMart */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => setSidePanelVisible(true)}
          style={styles.headerButton}
        >
          <Ionicons name="menu" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>TownMart</Text>
          <Text style={styles.headerSubtitle}>Profile</Text>
        </View>
        
        <TouchableOpacity 
          onPress={handleEditProfile}
          style={styles.headerButton}
        >
          <Ionicons name="create-outline" size={24} color={colors.accent} />
        </TouchableOpacity>
      </View>

      {/* Side Panel */}
      {sidePanelVisible && <SidePanel />}

      <Animated.ScrollView 
        style={[styles.scrollView, { opacity: fadeAnim }]} 
        showsVerticalScrollIndicator={false}
      >
        {/* Enhanced Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" }} 
              style={styles.avatar}
            />
            <View style={styles.onlineIndicator} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user?.fullName}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>Customer</Text>
            </View>
          </View>
        </View>

        {/* Enhanced Info Cards */}
        <View style={styles.infoCards}>
          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <Ionicons name="location" size={20} color={colors.accent} />
              <Text style={styles.infoCardTitle}>Address</Text>
            </View>
            <Text style={styles.infoCardText} numberOfLines={2}>
              {user?.address || "No address provided"}
            </Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <Ionicons name="call" size={20} color={colors.accent} />
              <Text style={styles.infoCardTitle}>Contact</Text>
            </View>
            <Text style={styles.infoCardText}>
              {user?.phone || "No phone provided"}
            </Text>
          </View>
        </View>

        {/* Enhanced Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <Ionicons name="cart" size={20} color={colors.surface} />
            </View>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </View>
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <Ionicons name="checkmark-done" size={20} color={colors.surface} />
            </View>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <Ionicons name="time" size={20} color={colors.surface} />
            </View>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <Ionicons name="calendar" size={20} color={colors.surface} />
            </View>
            <Text style={styles.statNumber}>
              {user?.createdAt ? new Date().getFullYear() - new Date(user.createdAt.seconds * 1000).getFullYear() : 0}
            </Text>
            <Text style={styles.statLabel}>Years</Text>
          </View>
        </View>

        {/* Enhanced Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          
          <TouchableOpacity style={styles.menuItemCard} onPress={handleEditProfile}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: colors.lightBackground }]}>
                <Ionicons name="person" size={20} color={colors.accent} />
              </View>
              <View>
                <Text style={styles.menuItemTitle}>Edit Profile</Text>
                <Text style={styles.menuItemSubtitle}>Update your personal information</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItemCard} onPress={handlePaymentMethods}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: colors.lightBackground }]}>
                <Ionicons name="card" size={20} color={colors.accent} />
              </View>
              <View>
                <Text style={styles.menuItemTitle}>Payment Methods</Text>
                <Text style={styles.menuItemSubtitle}>Manage your payment options</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItemCard} onPress={handleOrderHistory}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: colors.lightBackground }]}>
                <Ionicons name="receipt" size={20} color={colors.accent} />
              </View>
              <View>
                <Text style={styles.menuItemTitle}>Order History</Text>
                <Text style={styles.menuItemSubtitle}>View your past orders</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Enhanced Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <View style={styles.menuItemCard}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: colors.lightBackground }]}>
                <Ionicons name="notifications" size={20} color={colors.accent} />
              </View>
              <View>
                <Text style={styles.menuItemTitle}>Notifications</Text>
                <Text style={styles.menuItemSubtitle}>Manage your notifications</Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.border, true: colors.accentLight }}
              thumbColor={notificationsEnabled ? colors.accent : colors.surface}
            />
          </View>

          <View style={styles.menuItemCard}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: colors.lightBackground }]}>
                <Ionicons name="moon" size={20} color={colors.accent} />
              </View>
              <View>
                <Text style={styles.menuItemTitle}>Dark Mode</Text>
                <Text style={styles.menuItemSubtitle}>Switch to dark theme</Text>
              </View>
            </View>
            <Switch
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              trackColor={{ false: colors.border, true: colors.accentLight }}
              thumbColor={darkModeEnabled ? colors.accent : colors.surface}
            />
          </View>

          <TouchableOpacity style={styles.menuItemCard}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: colors.lightBackground }]}>
                <Ionicons name="language" size={20} color={colors.accent} />
              </View>
              <View>
                <Text style={styles.menuItemTitle}>Language</Text>
                <Text style={styles.menuItemSubtitle}>English (US)</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Enhanced Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity style={styles.menuItemCard} onPress={handleSupport}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: colors.lightBackground }]}>
                <Ionicons name="help-circle" size={20} color={colors.accent} />
              </View>
              <View>
                <Text style={styles.menuItemTitle}>Help & Support</Text>
                <Text style={styles.menuItemSubtitle}>Get help and contact support</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Enhanced Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <View style={styles.logoutContent}>
            <Ionicons name="log-out" size={22} color={colors.error} />
            <Text style={styles.logoutText}>Logout</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.versionText}>TownMart v1.0.0</Text>
          <Text style={styles.copyrightText}>© 2024 All rights reserved</Text>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // CONSISTENT Header with TownMart
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
  scrollView: {
    flex: 1,
  },
  // Consistent Side Panel Styles
  sidePanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '80%',
    backgroundColor: colors.surface,
    zIndex: 1000,
    shadowColor: '#000',
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
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  sidePanelSubtitle: {
    fontSize: 12,
    color: colors.accent,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: colors.background,
  },
  noProfileText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.accent,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  retryButtonText: {
    color: colors.surface,
    fontWeight: '600',
    fontSize: 16,
  },
  profileHeader: {
    backgroundColor: colors.surface,
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.success,
    borderWidth: 3,
    borderColor: colors.surface,
  },
  profileInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: colors.lightBackground,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleText: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '600',
  },
  infoCards: {
    padding: 20,
    gap: 12,
  },
  infoCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
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
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  infoCardText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  section: {
    backgroundColor: colors.surface,
    marginTop: 16,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  logoutButton: {
    backgroundColor: colors.surface,
    marginTop: 24,
    marginHorizontal: 20,
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
    overflow: 'hidden',
  },
  logoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    color: colors.error,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    padding: 32,
    paddingBottom: 40,
  },
  versionText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});