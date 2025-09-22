// import React, { useEffect, useState } from "react";
// import {
//   SafeAreaView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
//   Image,
//   ScrollView,
//   Switch,
//   Alert,
//   Dimensions,
//   ActivityIndicator
// } from "react-native";
// import { Ionicons } from '@expo/vector-icons';
// import { useRouter } from "expo-router";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { auth, db } from "../../../firebaseConfig";
// import { doc, getDoc } from "firebase/firestore";
// import { onAuthStateChanged } from "firebase/auth";

// const { width } = Dimensions.get('window');

// // Simplified type to match your Firebase data
// type ShopkeeperData = {
//   uid: string;
//   email: string;
//   shopName: string;
//   ownerName: string;
//   location: string;
//   phone: string;
//   createdAt: any;
// };

// export default function ShopkeeperProfileScreen() {
//   const [user, setUser] = useState<ShopkeeperData | null>(null);
//   const [sidePanelVisible, setSidePanelVisible] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);
//   const [notificationsEnabled, setNotificationsEnabled] = useState(true);
//   const [orderAlertsEnabled, setOrderAlertsEnabled] = useState(true);
//   const [darkModeEnabled, setDarkModeEnabled] = useState(false);
//   const router = useRouter();

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
//       if (!currentUser) {
//         router.replace("/"); // if logged out, go to login
//         return;
//       }
  
//       try {
//         const docRef = doc(db, "shopkeepers", currentUser.uid);
//         const snap = await getDoc(docRef);

//         if (snap.exists()) {
//           setUser(snap.data() as ShopkeeperData);
//         } else {
//           console.log("No shopkeeper profile found");
//         }
//       } catch (error) {
//         console.error("Error fetching shopkeeper:", error);
//         Alert.alert("Error", "Failed to fetch profile.");
//       } finally {
//         setIsLoading(false);
//       }
//     });
  
//     return () => unsubscribe();
//   }, []);

//   const handleLogout = () => {
//     Alert.alert(
//       "Logout",
//       "Are you sure you want to logout?",
//       [
//         {
//           text: "Cancel",
//           style: "cancel"
//         },
//         {
//           text: "Logout",
//           style: "destructive",
//           onPress: async () => {
//             await AsyncStorage.clear();
//             router.replace("/");
//           }
//         }
//       ]
//     );
//   };

//   const handleEditProfile = () => {
//     router.push("/shop_prof/edit-profile");
//   };

//   const handleShopSettings = () => {
//     router.push("/shop_prof/shop-settings");
//   };

//   const handleProductsManagement = () => {
//     router.push("/shopkeeper/products");
//   };

//   const handleOrderManagement = () => {
//     router.push("/shopkeeper/myorders");
//   };

//   const handleAnalytics = () => {
//     router.push("/shopkeeper/analytics");
//   };

//   const handleSupport = () => {
//     router.push("/shop_prof/support");
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
//           router.push("/shopkeeper/messages");
//         }}
//       >
//         <Ionicons name="chatbubbles" size={20} color="#007AFF" />
//         <Text style={styles.menuItemText}>Messages</Text>
//       </TouchableOpacity>
      
//       <TouchableOpacity 
//         style={[styles.menuItem, styles.activeMenuItem]}
//         onPress={() => setSidePanelVisible(false)}
//       >
//         <Ionicons name="person" size={20} color="#007AFF" />
//         <Text style={styles.menuItemText}>Profile</Text>
//       </TouchableOpacity>
//     </View>
//   );

//   if (isLoading) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <View style={styles.header}>
//           <TouchableOpacity onPress={() => setSidePanelVisible(true)}>
//             <Ionicons name="menu" size={28} color="#333" />
//           </TouchableOpacity>
//           <Text style={styles.headerTitle}>👤 Shop Profile</Text>
//           <View style={{ width: 28 }} />
//         </View>
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#007AFF" />
//           <Text style={styles.loadingText}>Loading profile...</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   if (!user) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <View style={styles.header}>
//           <TouchableOpacity onPress={() => setSidePanelVisible(true)}>
//             <Ionicons name="menu" size={28} color="#333" />
//           </TouchableOpacity>
//           <Text style={styles.headerTitle}>👤 Shop Profile</Text>
//           <View style={{ width: 28 }} />
//         </View>
//         <View style={styles.centered}>
//           <Text>No shopkeeper profile found</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       {/* Header with menu button */}
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => setSidePanelVisible(true)}>
//           <Ionicons name="menu" size={28} color="#333" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>👤 Shop Profile</Text>
//         <TouchableOpacity onPress={handleEditProfile}>
//           <Ionicons name="create-outline" size={24} color="#007AFF" />
//         </TouchableOpacity>
//       </View>

//       {/* Side Panel */}
//       {sidePanelVisible && <SidePanel />}

//       <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
//         {/* Profile Header */}
//         <View style={styles.profileHeader}>
//           <Image 
//             source={{ uri: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" }} 
//             style={styles.avatar}
//           />
//           <Text style={styles.shopName}>{user.shopName}</Text>
//           <Text style={styles.userName}>Owner: {user.ownerName}</Text>
//           <Text style={styles.userEmail}>{user.email}</Text>
//           <Text style={styles.userEmail}>📍 {user.location}</Text>
//           <Text style={styles.userEmail}>📞 {user.phone}</Text>
//         </View>

//         {/* Business Info */}
//         <View style={styles.businessInfo}>
//           <View style={styles.infoItem}>
//             <Ionicons name="location-outline" size={18} color="#007AFF" />
//             <Text style={styles.infoText} numberOfLines={1}>
//               {user.location}
//             </Text>
//           </View>
//           <View style={styles.infoItem}>
//             <Ionicons name="call-outline" size={18} color="#007AFF" />
//             <Text style={styles.infoText}>{user.phone}</Text>
//           </View>
//         </View>

//         {/* Stats Section - Using placeholder data since not in Firebase */}
//         <View style={styles.statsContainer}>
//           <View style={styles.statItem}>
//             <Text style={styles.statNumber}>0</Text>
//             <Text style={styles.statLabel}>Total Orders</Text>
//           </View>
//           <View style={styles.statItem}>
//             <Text style={styles.statNumber}>₹0</Text>
//             <Text style={styles.statLabel}>Revenue</Text>
//           </View>
//           <View style={styles.statItem}>
//             <Text style={styles.statNumber}>0</Text>
//             <Text style={styles.statLabel}>Products</Text>
//           </View>
//           <View style={styles.statItem}>
//             <Text style={styles.statNumber}>0/5</Text>
//             <Text style={styles.statLabel}>Rating</Text>
//           </View>
//         </View>

//         {/* Shop Management Section */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Shop Management</Text>
          
//           <TouchableOpacity style={styles.menuItemCard} onPress={handleProductsManagement}>
//             <View style={styles.menuItemLeft}>
//               <Ionicons name="cube-outline" size={22} color="#007AFF" />
//               <Text style={styles.menuItemText}>Manage Products</Text>
//             </View>
//             <Ionicons name="chevron-forward" size={20} color="#ccc" />
//           </TouchableOpacity>

//           <TouchableOpacity style={styles.menuItemCard} onPress={handleOrderManagement}>
//             <View style={styles.menuItemLeft}>
//               <Ionicons name="list-outline" size={22} color="#007AFF" />
//               <Text style={styles.menuItemText}>Order Management</Text>
//             </View>
//             <Ionicons name="chevron-forward" size={20} color="#ccc" />
//           </TouchableOpacity>

//           <TouchableOpacity style={styles.menuItemCard} onPress={handleEditProfile}>
//             <View style={styles.menuItemLeft}>
//             <Ionicons name="create-outline" size={22} color="#007AFF" />
//             <Text style={styles.menuItemText}>Edit Profile</Text>
//             </View>
//             <Ionicons name="chevron-forward" size={20} color="#ccc" />
//           </TouchableOpacity>

//           <TouchableOpacity style={styles.menuItemCard} onPress={handleShopSettings}>
//             <View style={styles.menuItemLeft}>
//               <Ionicons name="settings-outline" size={22} color="#007AFF" />
//               <Text style={styles.menuItemText}>Shop Settings</Text>
//             </View>
//             <Ionicons name="chevron-forward" size={20} color="#ccc" />
//           </TouchableOpacity>
//         </View>

//         {/* Preferences Section */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Preferences</Text>
          
//           <View style={styles.menuItemCard}>
//             <View style={styles.menuItemLeft}>
//               <Ionicons name="notifications-outline" size={22} color="#007AFF" />
//               <Text style={styles.menuItemText}>Notifications</Text>
//             </View>
//             <Switch
//               value={notificationsEnabled}
//               onValueChange={setNotificationsEnabled}
//               trackColor={{ false: '#767577', true: '#81b0ff' }}
//               thumbColor={notificationsEnabled ? '#007AFF' : '#f4f3f4'}
//             />
//           </View>

//           <View style={styles.menuItemCard}>
//             <View style={styles.menuItemLeft}>
//               <Ionicons name="alert-circle-outline" size={22} color="#007AFF" />
//               <Text style={styles.menuItemText}>Order Alerts</Text>
//             </View>
//             <Switch
//               value={orderAlertsEnabled}
//               onValueChange={setOrderAlertsEnabled}
//               trackColor={{ false: '#767577', true: '#81b0ff' }}
//               thumbColor={orderAlertsEnabled ? '#007AFF' : '#f4f3f4'}
//             />
//           </View>

//           <View style={styles.menuItemCard}>
//             <View style={styles.menuItemLeft}>
//               <Ionicons name="moon-outline" size={22} color="#007AFF" />
//               <Text style={styles.menuItemText}>Dark Mode</Text>
//             </View>
//             <Switch
//               value={darkModeEnabled}
//               onValueChange={setDarkModeEnabled}
//               trackColor={{ false: '#767577', true: '#81b0ff' }}
//               thumbColor={darkModeEnabled ? '#007AFF' : '#f4f3f4'}
//             />
//           </View>
//         </View>

//         {/* Support Section */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Support</Text>
          
//           <TouchableOpacity style={styles.menuItemCard} onPress={handleSupport}>
//             <View style={styles.menuItemLeft}>
//               <Ionicons name="help-circle-outline" size={22} color="#007AFF" />
//               <Text style={styles.menuItemText}>Help & Support</Text>
//             </View>
//             <Ionicons name="chevron-forward" size={20} color="#ccc" />
//           </TouchableOpacity>

//           <TouchableOpacity style={styles.menuItemCard}>
//             <View style={styles.menuItemLeft}>
//               <Ionicons name="document-text-outline" size={22} color="#007AFF" />
//               <Text style={styles.menuItemText}>Terms & Policies</Text>
//             </View>
//             <Ionicons name="chevron-forward" size={20} color="#ccc" />
//           </TouchableOpacity>
//         </View>

//         {/* Logout Button */}
//         <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
//           <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
//           <Text style={styles.logoutText}>Logout</Text>
//         </TouchableOpacity>

//         <View style={styles.footer}>
//           <Text style={styles.versionText}>Business App v1.2.0</Text>
//           <Text style={styles.footerText}>FreshGrocery Partner © 2024</Text>
//         </View>
//       </ScrollView>
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
//     padding: 16,
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//   },
//   headerTitle: {
//     fontSize: 20,
//     fontWeight: "bold",
//   },
//   scrollView: {
//     flex: 1,
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
//   activeMenuItem: {
//     backgroundColor: '#f0f7ff',
//   },
//   menuItemText: {
//     fontSize: 16,
//     marginLeft: 15,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   loadingText: {
//     marginTop: 12,
//     fontSize: 16,
//     color: '#666',
//   },
//   centered: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   profileHeader: {
//     backgroundColor: '#fff',
//     padding: 24,
//     alignItems: 'center',
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//   },
//   avatar: {
//     width: 100,
//     height: 100,
//     borderRadius: 50,
//     marginBottom: 16,
//   },
//   shopName: {
//     fontSize: 22,
//     fontWeight: 'bold',
//     color: '#333',
//     marginBottom: 4,
//     textAlign: 'center',
//   },
//   userName: {
//     fontSize: 16,
//     color: '#666',
//     marginBottom: 4,
//   },
//   userEmail: {
//     fontSize: 14,
//     color: '#666',
//     marginBottom: 2,
//   },
//   businessInfo: {
//     backgroundColor: '#fff',
//     padding: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//   },
//   infoItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   infoText: {
//     fontSize: 14,
//     color: '#666',
//     marginLeft: 8,
//     flex: 1,
//   },
//   statsContainer: {
//     flexDirection: 'row',
//     backgroundColor: '#fff',
//     padding: 20,
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//   },
//   statItem: {
//     flex: 1,
//     alignItems: 'center',
//   },
//   statNumber: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#007AFF',
//     marginBottom: 4,
//   },
//   statLabel: {
//     fontSize: 12,
//     color: '#666',
//     textAlign: 'center',
//   },
//   section: {
//     backgroundColor: '#fff',
//     marginTop: 16,
//     paddingHorizontal: 16,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#333',
//     paddingVertical: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//   },
//   menuItemCard: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingVertical: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#f0f0f0',
//   },
//   menuItemLeft: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//   },
//   logoutButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#fff',
//     marginTop: 16,
//     padding: 16,
//     borderRadius: 8,
//     marginHorizontal: 16,
//   },
//   logoutText: {
//     fontSize: 16,
//     color: '#FF3B30',
//     fontWeight: '500',
//     marginLeft: 8,
//   },
//   footer: {
//     alignItems: 'center',
//     padding: 24,
//   },
//   versionText: {
//     fontSize: 12,
//     color: '#999',
//     marginBottom: 4,
//   },
//   footerText: {
//     fontSize: 12,
//     color: '#999',
//   },
// });


import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Image
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

type ShopkeeperData = {
  uid: string;
  email: string;
  shopName: string;
  ownerName: string;
  location: string;
  phone: string;
  createdAt: any;
};

export default function EditProfileScreen() {
  const [user, setUser] = useState<ShopkeeperData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    shopName: "",
    ownerName: "",
    location: "",
    phone: "",
    email: ""
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace("/");
        return;
      }

      try {
        const docRef = doc(db, "shopkeepers", currentUser.uid);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          const userData = snap.data() as ShopkeeperData;
          setUser(userData);
          setFormData({
            shopName: userData.shopName || "",
            ownerName: userData.ownerName || "",
            location: userData.location || "",
            phone: userData.phone || "",
            email: userData.email || ""
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        Alert.alert("Error", "Failed to load profile data.");
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.shopName.trim()) {
      Alert.alert("Validation Error", "Shop name is required");
      return false;
    }
    if (!formData.ownerName.trim()) {
      Alert.alert("Validation Error", "Owner name is required");
      return false;
    }
    if (!formData.location.trim()) {
      Alert.alert("Validation Error", "Location is required");
      return false;
    }
    if (!formData.phone.trim()) {
      Alert.alert("Validation Error", "Phone number is required");
      return false;
    }
    if (!formData.phone.match(/^\d{10}$/)) {
      Alert.alert("Validation Error", "Please enter a valid 10-digit phone number");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm() || !user) return;

    setIsSaving(true);
    try {
      const userDocRef = doc(db, "shopkeepers", user.uid);
      await updateDoc(userDocRef, {
        shopName: formData.shopName.trim(),
        ownerName: formData.ownerName.trim(),
        location: formData.location.trim(),
        phone: formData.phone.trim(),
        updatedAt: new Date()
      });

      Alert.alert("Success", "Profile updated successfully!");
      router.back();
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges()) {
      Alert.alert(
        "Discard Changes",
        "Are you sure you want to discard your changes?",
        [
          { text: "Keep Editing", style: "cancel" },
          { text: "Discard", style: "destructive", onPress: () => router.back() }
        ]
      );
    } else {
      router.back();
    }
  };

  const hasChanges = () => {
    if (!user) return false;
    return (
      formData.shopName !== user.shopName ||
      formData.ownerName !== user.ownerName ||
      formData.location !== user.location ||
      formData.phone !== user.phone
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centered}>
          <Text>No profile data found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={isSaving || !hasChanges()}>
          <Text style={[styles.saveButton, (!hasChanges() || isSaving) && styles.saveButtonDisabled]}>
            {isSaving ? "Saving..." : "Save"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Image Section */}
        <View style={styles.profileImageSection}>
          <Image 
            source={{ uri: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" }} 
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.changePhotoButton}>
            <Ionicons name="camera" size={20} color="#007AFF" />
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Shop Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Shop Name *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.shopName}
              onChangeText={(value) => handleInputChange('shopName', value)}
              placeholder="Enter your shop name"
              placeholderTextColor="#999"
            />
          </View>

          {/* Owner Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Owner Name *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.ownerName}
              onChangeText={(value) => handleInputChange('ownerName', value)}
              placeholder="Enter owner's full name"
              placeholderTextColor="#999"
            />
          </View>

          {/* Email (Read-only) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.readOnlyInput}>
              <Text style={styles.readOnlyText}>{formData.email}</Text>
              <Ionicons name="lock-closed" size={16} color="#999" />
            </View>
            <Text style={styles.helperText}>Email cannot be changed</Text>
          </View>

          {/* Location */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.location}
              onChangeText={(value) => handleInputChange('location', value)}
              placeholder="Enter your shop location"
              placeholderTextColor="#999"
            />
          </View>

          {/* Phone Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.phone}
              onChangeText={(value) => handleInputChange('phone', value)}
              placeholder="Enter 10-digit phone number"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              maxLength={10}
            />
            <Text style={styles.helperText}>Enter without country code</Text>
          </View>

          {/* Business Info Section */}
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Business Information</Text>
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={16} color="#666" />
              <Text style={styles.infoText}>
                Member since: {user.createdAt?.toDate ? 
                  new Date(user.createdAt.toDate()).toLocaleDateString() : 
                  'N/A'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="business-outline" size={16} color="#666" />
              <Text style={styles.infoText}>Shopkeeper Account</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.button, styles.cancelButton]} 
            onPress={handleCancel}
            disabled={isSaving}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.saveActionButton, (!hasChanges() || isSaving) && styles.buttonDisabled]} 
            onPress={handleSave}
            disabled={!hasChanges() || isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveActionButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Save Indicator */}
        {hasChanges() && (
          <View style={styles.changesIndicator}>
            <Ionicons name="information-circle" size={16} color="#007AFF" />
            <Text style={styles.changesText}>You have unsaved changes</Text>
          </View>
        )}
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
    fontSize: 18,
    fontWeight: "600",
  },
  saveButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  saveButtonDisabled: {
    color: '#ccc',
  },
  scrollView: {
    flex: 1,
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  changePhotoText: {
    marginLeft: 8,
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  formSection: {
    backgroundColor: '#fff',
    marginTop: 8,
  },
  inputGroup: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    fontSize: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fafafa',
  },
  readOnlyInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  readOnlyText: {
    fontSize: 16,
    color: '#666',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  infoSection: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    margin: 16,
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
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
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  saveActionButton: {
    backgroundColor: '#007AFF',
  },
  saveActionButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  changesIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#e3f2fd',
    margin: 16,
    borderRadius: 8,
  },
  changesText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
});