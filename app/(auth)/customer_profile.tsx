import { useRouter } from "expo-router";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import React, { useState } from "react";
import { Alert, Button, ScrollView, Text, TextInput, View } from "react-native";

export default function CustomerProfileSetup() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleProfileSetup = async () => {
    if (!fullName || !address || !phone) {
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

      // Create customer profile
      await setDoc(doc(db, "customers", user.uid), {
        uid: user.uid,
        email: user.email,
        fullName,
        address,
        phone,
        createdAt: new Date(),
      });

      // ✅ CRITICAL FIX: Update user document to mark profile as completed
      await updateDoc(doc(db, "users", user.uid), {
        profileCompleted: true,
      });

      console.log("✅ Customer profile completed successfully!");
      
      // Navigate directly to customer home
      router.replace("/(tabs)/customer/home");
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
        Complete Your Profile
      </Text>

      <TextInput
        placeholder="Full Name"
        value={fullName}
        onChangeText={setFullName}
        style={{
          borderWidth: 1,
          padding: 10,
          marginBottom: 15,
          borderRadius: 5,
        }}
      />

      <TextInput
        placeholder="Address"
        value={address}
        onChangeText={setAddress}
        multiline
        style={{
          borderWidth: 1,
          padding: 10,
          marginBottom: 15,
          borderRadius: 5,
          minHeight: 80,
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