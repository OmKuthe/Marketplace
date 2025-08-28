import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const handleLogin = async () => {
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, "users", userCred.user.uid));

      if (userDoc.exists()) {
        const { role } = userDoc.data();
        if (role === "customer") {
          router.replace("/customer/home");
        } else {
          router.replace("/shopkeeper/home");
        }
      } else {
        Alert.alert("Error", "No role assigned to this user.");
      }
    } catch (err: any) {
      Alert.alert("Login Failed", err.message);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "600", marginBottom: 20 }}>Login</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
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

      <Button title="Login" onPress={handleLogin} />

      <TouchableOpacity onPress={() => router.push("/signup")}>
        <Text style={{ marginTop: 15, textAlign: "center", color: "blue" }}>
          Don’t have an account? Signup
        </Text>
      </TouchableOpacity>
    </View>
  );
}
