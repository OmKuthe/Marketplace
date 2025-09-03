import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import { Alert, Button, Text, TextInput, TouchableOpacity, View, ScrollView } from "react-native";
import { auth, db } from "../firebaseConfig";

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"customer" | "shopkeeper" | null>(null);

  // shopkeeper fields
  const [shopName, setShopName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");

  // customer fields
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const handleSignup = async () => {
    if (!role) {
      Alert.alert("Select a role");
      return;
    }

    if (role === "shopkeeper" && (!shopName || !ownerName || !location || !phone)) {
      Alert.alert("Missing Info", "Please fill in all shopkeeper details");
      return;
    }

    if (role === "customer" && (!fullName || !address || !customerPhone)) {
      Alert.alert("Missing Info", "Please fill in all customer details");
      return;
    }

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);

      // Save basic user doc
      await setDoc(doc(db, "users", userCred.user.uid), {
        uid: userCred.user.uid,
        email,
        role,
      });

      if (role === "shopkeeper") {
        await setDoc(doc(db, "shopkeepers", userCred.user.uid), {
          uid: userCred.user.uid,
          email,
          shopName,
          ownerName,
          location,
          phone,
          createdAt: new Date(),
        });
      } else {
        await setDoc(doc(db, "customers", userCred.user.uid), {
          uid: userCred.user.uid,
          email,
          fullName,
          address,
          phone: customerPhone,
          createdAt: new Date(),
        });
      }

      // Redirect
      if (role === "customer") {
        router.replace("/customer/home");
      } else {
        router.replace("/shopkeeper/home");
      }
    } catch (err: any) {
      Alert.alert("Signup Failed", err.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Signup</Text>

      {/* Common fields */}
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        style={{ borderWidth: 1, padding: 10, marginBottom: 10, borderRadius: 5 }}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, padding: 10, marginBottom: 20, borderRadius: 5 }}
      />

      {/* Role selection */}
      <Text style={{ marginBottom: 10 }}>Select Role:</Text>
      <View style={{ flexDirection: "row", marginBottom: 20 }}>
        <TouchableOpacity
          style={{
            flex: 1,
            padding: 10,
            backgroundColor: role === "customer" ? "#4CAF50" : "#ddd",
            marginRight: 5,
            alignItems: "center",
            borderRadius: 5,
          }}
          onPress={() => setRole("customer")}
        >
          <Text>Customer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            flex: 1,
            padding: 10,
            backgroundColor: role === "shopkeeper" ? "#4CAF50" : "#ddd",
            marginLeft: 5,
            alignItems: "center",
            borderRadius: 5,
          }}
          onPress={() => setRole("shopkeeper")}
        >
          <Text>Shopkeeper</Text>
        </TouchableOpacity>
      </View>

      {/* Extra fields for shopkeeper */}
      {role === "shopkeeper" && (
        <>
          <TextInput placeholder="Shop Name" value={shopName} onChangeText={setShopName}
            style={{ borderWidth: 1, padding: 10, marginBottom: 10, borderRadius: 5 }} />
          <TextInput placeholder="Owner Name" value={ownerName} onChangeText={setOwnerName}
            style={{ borderWidth: 1, padding: 10, marginBottom: 10, borderRadius: 5 }} />
          <TextInput placeholder="Location" value={location} onChangeText={setLocation}
            style={{ borderWidth: 1, padding: 10, marginBottom: 10, borderRadius: 5 }} />
          <TextInput placeholder="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad"
            style={{ borderWidth: 1, padding: 10, marginBottom: 20, borderRadius: 5 }} />
        </>
      )}

      {/* Extra fields for customer */}
      {role === "customer" && (
        <>
          <TextInput placeholder="Full Name" value={fullName} onChangeText={setFullName}
            style={{ borderWidth: 1, padding: 10, marginBottom: 10, borderRadius: 5 }} />
          <TextInput placeholder="Address" value={address} onChangeText={setAddress}
            style={{ borderWidth: 1, padding: 10, marginBottom: 10, borderRadius: 5 }} />
          <TextInput placeholder="Phone Number" value={customerPhone} onChangeText={setCustomerPhone} keyboardType="phone-pad"
            style={{ borderWidth: 1, padding: 10, marginBottom: 20, borderRadius: 5 }} />
        </>
      )}

      <Button title="Signup" onPress={handleSignup} />
    </ScrollView>
  );
}
