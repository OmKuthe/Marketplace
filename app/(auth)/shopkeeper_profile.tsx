import { useRouter } from "expo-router";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import React, { useState } from "react";
import { Alert, Button, ScrollView, Text, TextInput, View } from "react-native";

export default function ShopkeeperProfileSetup() {
  const router = useRouter();
  const [shopName, setShopName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleProfileSetup = async () => {
    if (!shopName || !ownerName || !location || !phone) {
      Alert.alert("Missing Information", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "User not authenticated");
        return;
      }

      // Create shopkeeper profile
      await setDoc(doc(db, "shopkeepers", user.uid), {
        uid: user.uid,
        email: user.email,
        shopName,
        ownerName,
        location,
        phone,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // ✅ CRITICAL FIX: Update user document to mark profile as completed
      await updateDoc(doc(db, "users", user.uid), {
        profileCompleted: true,
      });

      console.log("✅ Shopkeeper profile completed successfully!");
      
      // Navigate directly to shopkeeper home
      router.replace("/(tabs)/shopkeeper/home");
    } catch (err: any) {
      console.error("❌ Profile setup error:", err);
      Alert.alert("Profile Setup Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20, justifyContent: "center" }}>
      <Text style={{ fontSize: 24, marginBottom: 20, textAlign: "center" }}>
        Complete Your Shop Profile
      </Text>

      <TextInput
        placeholder="Shop Name"
        value={shopName}
        onChangeText={setShopName}
        style={{
          borderWidth: 1,
          padding: 10,
          marginBottom: 15,
          borderRadius: 5,
        }}
      />

      <TextInput
        placeholder="Owner Name"
        value={ownerName}
        onChangeText={setOwnerName}
        style={{
          borderWidth: 1,
          padding: 10,
          marginBottom: 15,
          borderRadius: 5,
        }}
      />

      <TextInput
        placeholder="Shop Location"
        value={location}
        onChangeText={setLocation}
        style={{
          borderWidth: 1,
          padding: 10,
          marginBottom: 15,
          borderRadius: 5,
        }}
      />

      <TextInput
        placeholder="Phone Number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        style={{
          borderWidth: 1,
          padding: 10,
          marginBottom: 20,
          borderRadius: 5,
        }}
      />

      <Button 
        title={loading ? "Setting up..." : "Complete Profile"} 
        onPress={handleProfileSetup} 
        disabled={loading}
      />
    </ScrollView>
  );
}