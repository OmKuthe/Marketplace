import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig"; 
import React, { useState } from "react";
import { Alert, Button, Text, TextInput, View, Image, StyleSheet } from "react-native";

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
        // User document doesn't exist
        Alert.alert("Error", "User data not found. Please contact support.");
      }
    } catch (err: any) {
      Alert.alert("Login Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Logo Section */}
      <View style={styles.logoContainer}>
        <Image 
          source={require('../assets/images/logo.jpeg')} // Update path to your logo
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.title}>Login</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <Button 
        title={loading ? "Logging in..." : "Login"} 
        onPress={handleLogin} 
        disabled={loading}
      />
      
      <View style={styles.signupButton}>
        <Button title="Go to Signup" onPress={() => router.push("/signup")} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: '#fff',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 10,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  signupButton: {
    marginTop: 20,
  },
});