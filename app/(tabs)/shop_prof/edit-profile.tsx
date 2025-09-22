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
  ScrollView,
  Alert,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { auth, db } from "../../../firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function EditProfileScreen() {
  const router = useRouter();

  // Profile fields
  const [shopName, setShopName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [shopLogo, setShopLogo] = useState<string | null>(null); // dummy
  const [mapDetails, setMapDetails] = useState<string>(""); // dummy

  // Load current data from Firestore
  useEffect(() => {
    const fetchProfile = async () => {
      if (!auth.currentUser) return;

      try {
        const ref = doc(db, "shopkeepers", auth.currentUser.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();
          setShopName(data.shopName || "");
          setOwnerName(data.ownerName || "");
          setEmail(data.email || auth.currentUser.email || "");
          setPhone(data.phone || "");
          setLocation(data.location || "");
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        Alert.alert("Error", "Failed to load profile.");
      }
    };

    fetchProfile();
  }, []);

  // Save updates to Firestore
  const handleSave = async () => {
    if (!auth.currentUser) return;

    try {
      const ref = doc(db, "shopkeepers", auth.currentUser.uid);

      await setDoc(
        ref,
        {
          shopName,
          ownerName,
          email,
          phone,
          location,
          shopLogo,   // dummy field
          mapDetails, // dummy field
        },
        { merge: true }
      );

      Alert.alert("✅ Profile Updated", "Your profile has been saved.");
      router.back();
    } catch (err) {
      console.error("Error saving profile:", err);
      Alert.alert("❌ Error", "Failed to save profile.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>✏️ Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.form}>
        {/* Shop Logo (dummy) */}
        <View style={styles.logoContainer}>
          <Image
            source={{
              uri:
                shopLogo ||
                "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
            }}
            style={styles.avatar}
          />
          <TouchableOpacity
            style={styles.changeLogoBtn}
            onPress={() => Alert.alert("Dummy", "Logo upload not yet implemented")}
          >
            <Text style={styles.changeLogoText}>Change Logo</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Shop Name</Text>
        <TextInput
          style={styles.input}
          value={shopName}
          onChangeText={setShopName}
        />

        <Text style={styles.label}>Owner Name</Text>
        <TextInput
          style={styles.input}
          value={ownerName}
          onChangeText={setOwnerName}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

        <Text style={styles.label}>Phone</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
        />

        <Text style={styles.label}>Map Details (Dummy)</Text>
        <TextInput
          style={styles.input}
          value={mapDetails}
          onChangeText={setMapDetails}
          placeholder="Not linked to Firebase yet"
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  form: { padding: 20 },
  label: { fontSize: 14, color: "#333", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  saveText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  changeLogoBtn: { marginTop: 8 },
  changeLogoText: { color: "#007AFF", fontSize: 14 },
});
