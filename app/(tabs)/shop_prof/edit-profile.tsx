// import React, { useState } from "react";
// import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";

// export default function EditProfileScreen() {
//   const router = useRouter();
//   const [name, setName] = useState("Rajesh Kumar");
//   const [email, setEmail] = useState("rajesh@freshgrocery.com");
//   const [phone, setPhone] = useState("+91 9876543210");

//   const handleSave = () => {
//     Alert.alert("Profile Updated", "Your profile details have been saved successfully.");
//     router.back();
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => router.back()}>
//           <Ionicons name="arrow-back" size={24} color="#333" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>✏️ Edit Profile</Text>
//         <View style={{ width: 24 }} />
//       </View>

//       <ScrollView contentContainerStyle={styles.form}>
//         <Text style={styles.label}>Full Name</Text>
//         <TextInput style={styles.input} value={name} onChangeText={setName} />

//         <Text style={styles.label}>Email</Text>
//         <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" />

//         <Text style={styles.label}>Phone</Text>
//         <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

//         <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
//           <Text style={styles.saveText}>Save Changes</Text>
//         </TouchableOpacity>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#fff" },
//   header: {
//     flexDirection: "row", alignItems: "center", justifyContent: "space-between",
//     padding: 16, borderBottomWidth: 1, borderBottomColor: "#eee",
//   },
//   headerTitle: { fontSize: 18, fontWeight: "bold" },
//   form: { padding: 20 },
//   label: { fontSize: 14, color: "#333", marginBottom: 6 },
//   input: {
//     borderWidth: 1, borderColor: "#ddd", borderRadius: 8,
//     padding: 12, marginBottom: 16, fontSize: 16,
//   },
//   saveButton: {
//     backgroundColor: "#007AFF", padding: 16, borderRadius: 8, alignItems: "center",
//   },
//   saveText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
// });

import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebaseConfig';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import MapView, { Marker } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

type ShopkeeperData = {
  uid: string;
  email: string;
  shopName: string;
  ownerName: string;
  location: string;
  phone: string;
  shopLogo?: string;
  latitude?: number;
  longitude?: number;
};

export default function EditProfileScreen() {
  const [user, setUser] = useState<ShopkeeperData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    shopName: '',
    ownerName: '',
    phone: '',
    location: '',
    shopLogo: '',
    latitude: 0,
    longitude: 0
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        router.replace('/');
        return;
      }

      const docRef = doc(db, 'shopkeepers', currentUser.uid);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const userData = snap.data() as ShopkeeperData;
        setUser(userData);
        setFormData({
          shopName: userData.shopName || '',
          ownerName: userData.ownerName || '',
          phone: userData.phone || '',
          location: userData.location || '',
          shopLogo: userData.shopLogo || '',
          latitude: userData.latitude || 28.6139, // Default to Delhi
          longitude: userData.longitude || 77.2090
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Sorry, we need camera roll permissions to change your shop logo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        setFormData(prev => ({
          ...prev,
          shopLogo: result.assets[0].uri
        }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImage = async (uri: string): Promise<string> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const storage = getStorage();
      const storageRef = ref(storage, `shop-logos/${auth.currentUser?.uid}-${Date.now()}`);
      
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    }
  };

  const handleLocationSelect = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setFormData(prev => ({
      ...prev,
      latitude,
      longitude
    }));
    
    // Reverse geocode would be implemented here in a real app
    // For now, we'll use a placeholder
    setFormData(prev => ({
      ...prev,
      location: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`
    }));
  };

  const handleSave = async () => {
    if (!formData.shopName.trim() || !formData.ownerName.trim() || !formData.phone.trim()) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    if (!formData.location.trim()) {
      Alert.alert('Validation Error', 'Please select a location from the map');
      return;
    }

    try {
      setSaving(true);
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      let shopLogoUrl = formData.shopLogo;
      
      // Upload new image if it's a local URI (starts with file://)
      if (formData.shopLogo.startsWith('file://')) {
        shopLogoUrl = await uploadImage(formData.shopLogo);
      }

      const updateData = {
        shopName: formData.shopName.trim(),
        ownerName: formData.ownerName.trim(),
        phone: formData.phone.trim(),
        location: formData.location.trim(),
        shopLogo: shopLogoUrl,
        latitude: formData.latitude,
        longitude: formData.longitude,
        updatedAt: new Date()
      };

      const docRef = doc(db, 'shopkeepers', currentUser.uid);
      await updateDoc(docRef, updateData);

      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          <Text style={[styles.saveButton, saving && styles.saveButtonDisabled]}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Shop Logo Section */}
        <View style={styles.logoSection}>
          <TouchableOpacity onPress={pickImage} style={styles.logoContainer}>
            <Image 
              source={{ 
                uri: formData.shopLogo || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' 
              }} 
              style={styles.logoImage}
            />
            <View style={styles.logoOverlay}>
              <Ionicons name="camera" size={24} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.logoText}>Tap to change shop logo</Text>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Shop Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Shop Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.shopName}
              onChangeText={(value) => handleInputChange('shopName', value)}
              placeholder="Enter shop name"
              placeholderTextColor="#999"
            />
          </View>

          {/* Owner Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Owner Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.ownerName}
              onChangeText={(value) => handleInputChange('ownerName', value)}
              placeholder="Enter owner name"
              placeholderTextColor="#999"
            />
          </View>

          {/* Phone Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(value) => handleInputChange('phone', value)}
              placeholder="Enter phone number"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />
          </View>

          {/* Location Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Shop Location *</Text>
            <TouchableOpacity 
              style={styles.locationPicker}
              onPress={() => setMapModalVisible(true)}
            >
              <Ionicons name="location-outline" size={20} color="#007AFF" />
              <Text style={styles.locationText} numberOfLines={1}>
                {formData.location || 'Tap to pick location from map'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#ccc" />
            </TouchableOpacity>
          </View>

          {/* Current Location Display */}
          {formData.latitude !== 0 && formData.longitude !== 0 && (
            <View style={styles.currentLocation}>
              <Text style={styles.currentLocationText}>
                Current Location: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
              </Text>
            </View>
          )}
        </View>

        {/* Save Button */}
        <TouchableOpacity 
          style={[styles.saveButtonLarge, saving && styles.saveButtonLargeDisabled]} 
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.saveButtonLargeText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Map Modal */}
      <Modal
        visible={mapModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Shop Location</Text>
            <TouchableOpacity 
              onPress={() => setMapModalVisible(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: formData.latitude,
                longitude: formData.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              }}
              onPress={handleLocationSelect}
            >
              <Marker
                coordinate={{
                  latitude: formData.latitude,
                  longitude: formData.longitude
                }}
                title="Your Shop"
                description={formData.location}
              />
            </MapView>
          </View>

          <View style={styles.mapInstructions}>
            <Text style={styles.instructionsText}>
              📍 Tap on the map to select your shop location
            </Text>
            <Text style={styles.instructionsSubText}>
              Selected: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.confirmLocationButton}
            onPress={() => setMapModalVisible(false)}
          >
            <Text style={styles.confirmLocationText}>Confirm Location</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
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
  logoSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  logoImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  logoOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 14,
    color: '#666',
  },
  formSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  locationPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fafafa',
  },
  locationText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    color: '#333',
  },
  currentLocation: {
    backgroundColor: '#f0f7ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  currentLocationText: {
    fontSize: 14,
    color: '#007AFF',
    textAlign: 'center',
  },
  saveButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  saveButtonLargeDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonLargeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalCloseButton: {
    padding: 4,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapInstructions: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  instructionsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  instructionsSubText: {
    fontSize: 14,
    color: '#666',
  },
  confirmLocationButton: {
    backgroundColor: '#007AFF',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmLocationText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});