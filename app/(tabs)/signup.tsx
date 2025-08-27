import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../../marketplace/firebaseConfig"; 

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"customer" | "shopkeeper" | null>(null);

  const handleSignup = async () => {
    if (!role) {
      Alert.alert("Select a role");
      return;
    }

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", userCred.user.uid), {
        uid: userCred.user.uid,
        email,
        role,
      });

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
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Signup</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        style={{
          borderWidth: 1,
          padding: 10,
          marginBottom: 10,
          borderRadius: 5,
        }}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{
          borderWidth: 1,
          padding: 10,
          marginBottom: 20,
          borderRadius: 5,
        }}
      />

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

      <Button title="Signup" onPress={handleSignup} />
    </View>
  );
}
