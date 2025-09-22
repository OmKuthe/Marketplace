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



import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Image,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";

export default function EditProfileScreen() {
  const router = useRouter();
  const [shopName, setShopName] = useState("Fresh Grocery Mart");
  const [ownerName, setOwnerName] = useState("Rajesh Kumar");
  const [phone, setPhone] = useState("+91 9876543210");
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [location, setLocation] = useState("Mumbai, India");
  const [locationModalVisible, setLocationModalVisible] = useState(false);

  // Dummy Logo Picker
  const handlePickLogo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled) {
      setLogoUri(result.assets[0].uri);
    }
  };

  // Dummy Save (no Firebase)
  const handleSave = () => {
    Alert.alert(
      "Profile Updated",
      "Your profile changes (dummy save) have been applied."
    );
    router.back();
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
        {/* Logo */}
        <TouchableOpacity onPress={handlePickLogo} style={styles.logoWrapper}>
          <Image
            source={{
              uri:
                logoUri ||
                "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
            }}
            style={styles.logo}
          />
          <Text style={styles.changeLogo}>Change Shop Logo (dummy)</Text>
        </TouchableOpacity>

        {/* Shop Name */}
        <Text style={styles.label}>Shop Name</Text>
        <TextInput
          style={styles.input}
          value={shopName}
          onChangeText={setShopName}
        />

        {/* Owner Name */}
        <Text style={styles.label}>Owner Name</Text>
        <TextInput
          style={styles.input}
          value={ownerName}
          onChangeText={setOwnerName}
        />

        {/* Phone */}
        <Text style={styles.label}>Phone</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        {/* Dummy Location Picker */}
        <Text style={styles.label}>Location</Text>
        <TouchableOpacity
          style={styles.locationButton}
          onPress={() => setLocationModalVisible(true)}
        >
          <Ionicons name="location" size={20} color="#007AFF" />
          <Text style={styles.locationText}>{location}</Text>
        </TouchableOpacity>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Dummy Location Modal */}
      <Modal visible={locationModalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Pick Shop Location (Dummy)</Text>
          <TouchableOpacity
            style={styles.modalOption}
            onPress={() => {
              setLocation("Mumbai, India");
              setLocationModalVisible(false);
            }}
          >
            <Text>Mumbai, India</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.modalOption}
            onPress={() => {
              setLocation("Delhi, India");
              setLocationModalVisible(false);
            }}
          >
            <Text>Delhi, India</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.modalOption}
            onPress={() => {
              setLocation("Bengaluru, India");
              setLocationModalVisible(false);
            }}
          >
            <Text>Bengaluru, India</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.closeModalBtn}
            onPress={() => setLocationModalVisible(false)}
          >
            <Text style={{ color: "#fff" }}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
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
  logoWrapper: { alignItems: "center", marginBottom: 20 },
  logo: { width: 100, height: 100, borderRadius: 50 },
  changeLogo: { marginTop: 6, color: "#007AFF" },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#ddd",
    marginBottom: 16,
  },
  locationText: { marginLeft: 10 },
  modalContainer: { flex: 1, justifyContent: "center", padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 20 },
  modalOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  closeModalBtn: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
});
