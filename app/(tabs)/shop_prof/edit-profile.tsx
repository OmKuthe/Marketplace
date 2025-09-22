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
import React, { useEffect, useState } from "react";
import { 
  SafeAreaView, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View, 
  Image, 
  ScrollView, 
  Alert 
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";
import { auth, db, storage } from "../../../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

type ShopkeeperData = {
  uid: string;
  email: string;
  shopName: string;
  ownerName: string;
  location: string;
  phone: string;
  logo?: string;
};

export default function EditProfileScreen() {
  const [shopData, setShopData] = useState<ShopkeeperData | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [mapVisible, setMapVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!auth.currentUser) return;
      try {
        const docRef = doc(db, "shopkeepers", auth.currentUser.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as ShopkeeperData;
          setShopData(data);
          if (data.logo) setLogoUri(data.logo);
        }
      } catch (err) {
        Alert.alert("Error", "Failed to fetch profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Pick shop logo
  const handlePickLogo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled) {
      setLogoUri(result.assets[0].uri);
    }
  };

  // Save updates
  const handleSave = async () => {
    if (!auth.currentUser || !shopData) return;

    let logoUrl = shopData.logo || "";

    // Upload new logo if changed
    if (logoUri && logoUri !== shopData.logo) {
      const logoRef = ref(storage, `logos/${auth.currentUser.uid}.jpg`);
      const img = await fetch(logoUri);
      const bytes = await img.blob();
      await uploadBytes(logoRef, bytes);
      logoUrl = await getDownloadURL(logoRef);
    }

    try {
      const docRef = doc(db, "shopkeepers", auth.currentUser.uid);
      await updateDoc(docRef, {
        shopName: shopData.shopName,
        ownerName: shopData.ownerName,
        phone: shopData.phone,
        location: selectedLocation
          ? `${selectedLocation.lat}, ${selectedLocation.lng}`
          : shopData.location,
        logo: logoUrl,
      });

      Alert.alert("Success", "Profile updated!");
      router.back();
    } catch (error) {
      Alert.alert("Error", "Could not update profile");
    }
  };

  if (loading || !shopData) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        {/* Logo */}
        <TouchableOpacity onPress={handlePickLogo}>
          <Image 
            source={{ uri: logoUri || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" }}
            style={styles.logo}
          />
          <Text style={styles.changeLogo}>Change Logo</Text>
        </TouchableOpacity>

        {/* Shop Name */}
        <TextInput 
          style={styles.input}
          placeholder="Shop Name"
          value={shopData.shopName}
          onChangeText={(text) => setShopData({ ...shopData, shopName: text })}
        />

        {/* Owner Name */}
        <TextInput 
          style={styles.input}
          placeholder="Owner Name"
          value={shopData.ownerName}
          onChangeText={(text) => setShopData({ ...shopData, ownerName: text })}
        />

        {/* Phone */}
        <TextInput 
          style={styles.input}
          placeholder="Phone Number"
          keyboardType="phone-pad"
          value={shopData.phone}
          onChangeText={(text) => setShopData({ ...shopData, phone: text })}
        />

        {/* Location */}
        <TouchableOpacity 
          style={styles.locationButton} 
          onPress={() => setMapVisible(true)}
        >
          <Ionicons name="location" size={20} color="#007AFF" />
          <Text style={styles.locationText}>
            {selectedLocation 
              ? `${selectedLocation.lat}, ${selectedLocation.lng}`
              : shopData.location}
          </Text>
        </TouchableOpacity>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>

        {/* Map Picker Modal */}
        {mapVisible && (
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: 20.5937,
                longitude: 78.9629,
                latitudeDelta: 5,
                longitudeDelta: 5,
              }}
              onPress={(e) => {
                setSelectedLocation({
                  lat: e.nativeEvent.coordinate.latitude,
                  lng: e.nativeEvent.coordinate.longitude,
                });
              }}
            >
              {selectedLocation && (
                <Marker
                  coordinate={{
                    latitude: selectedLocation.lat,
                    longitude: selectedLocation.lng,
                  }}
                  title="Shop Location"
                />
              )}
            </MapView>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() => setMapVisible(false)}
            >
              <Text style={styles.saveBtnText}>Confirm Location</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollView: { padding: 20 },
  logo: { width: 100, height: 100, borderRadius: 50, alignSelf: "center" },
  changeLogo: { textAlign: "center", color: "#007AFF", marginVertical: 5 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#ddd",
    marginVertical: 8,
  },
  locationText: { marginLeft: 10 },
  saveBtn: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 20,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  mapContainer: { flex: 1, height: 400, marginTop: 20 },
  map: { flex: 1 },
});
