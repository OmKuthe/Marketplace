import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig"; 
import React, { useState } from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    setLoading(true);
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, "users", userCred.user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const role = userData.role;
        const profileCompleted = userData.profileCompleted || false;

        console.log("Login successful - Profile completed:", profileCompleted);

        if (profileCompleted) {
          // Profile is completed, go directly to home
          if (role === "customer") {
            router.replace("/(tabs)/customer/home");
          } else {
            router.replace("/(tabs)/shopkeeper/home");
          }
        } else {
          // Profile not completed, go to profile setup
          if (role === "customer") {
            router.replace("/(auth)/customer_profile");
          } else {
            router.replace("/(auth)/shopkeeper_profile");
          }
        }
      } else {
        // User document doesn't exist (shouldn't happen for existing users)
        Alert.alert("Error", "User data not found. Please contact support.");
      }
    } catch (err: any) {
      Alert.alert("Login Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Login</Text>

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

      <Button 
        title={loading ? "Logging in..." : "Login"} 
        onPress={handleLogin} 
        disabled={loading}
      />
      <View style={{ marginTop: 20 }}>
        <Button title="Go to Signup" onPress={() => router.push("/signup")} />
      </View>
    </View>
  );
}