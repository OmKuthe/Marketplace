import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import { 
  Alert, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View, 
  Image, 
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator
} from "react-native";
import { auth, db } from "../firebaseConfig";

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"customer" | "shopkeeper" | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!role) {
      Alert.alert("Select a role");
      return;
    }

    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    setLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      
      // Save basic user doc with role only
      await setDoc(doc(db, "users", userCred.user.uid), {
        uid: userCred.user.uid,
        email,
        role,
        profileCompleted: false,
        createdAt: new Date(),
      });

      console.log("Signup successful - redirecting to profile setup");
      if (role === "customer") {
        router.replace("/(auth)/customer_profile");
      } else {
        router.replace("/(auth)/shopkeeper_profile");
      }
    } catch (err: any) {
      Alert.alert("Signup Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Background Image */}
      <Image 
        source={require('../assets/images/TownMart_bg.png')}
        style={styles.backgroundImage}
        blurRadius={2}
      />
      
      {/* Overlay */}
      <View style={styles.overlay} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <View style={styles.logoBackground}>
              <Image 
                source={require('../assets/images/TownMart.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Signup Card */}
          <View style={styles.card}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join us today</Text>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                placeholder="Enter your email"
                placeholderTextColor="rgba(9, 68, 89, 0.5)"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                style={styles.input}
                keyboardType="email-address"
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                placeholder="Create a password"
                placeholderTextColor="rgba(9, 68, 89, 0.5)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={styles.input}
              />
            </View>

            {/* Role Selection */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>I want to join as:</Text>
              <View style={styles.roleContainer}>
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    role === "customer" && styles.roleButtonSelected
                  ]}
                  onPress={() => setRole("customer")}
                >
                  <Text style={[
                    styles.roleButtonText,
                    role === "customer" && styles.roleButtonTextSelected
                  ]}>
                    Customer
                  </Text>
                  {role === "customer" && (
                    <View style={styles.selectedIndicator} />
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    role === "shopkeeper" && styles.roleButtonSelected
                  ]}
                  onPress={() => setRole("shopkeeper")}
                >
                  <Text style={[
                    styles.roleButtonText,
                    role === "shopkeeper" && styles.roleButtonTextSelected
                  ]}>
                    Shopkeeper
                  </Text>
                  {role === "shopkeeper" && (
                    <View style={styles.selectedIndicator} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Signup Button */}
            <TouchableOpacity 
              style={[
                styles.signupButton, 
                (!role || loading) && styles.signupButtonDisabled
              ]}
              onPress={handleSignup}
              disabled={!role || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.signupButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Login Redirect */}
            <TouchableOpacity 
              style={styles.loginRedirectButton}
              onPress={() => router.push("/")}
            >
              <Text style={styles.loginRedirectText}>
                Already have an account? <Text style={styles.loginRedirectHighlight}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
  },
  overlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    top: 0,
    left: 0,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoBackground: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    shadowColor: 'rgba(9, 68, 89, 0.3)',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logo: {
    width: 80,
    height: 80,
  },
  card: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 20,
    shadowColor: 'rgba(9, 68, 89, 0.2)',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(15, 177, 234, 0.1)',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'rgba(9, 68, 89, 1)',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: 'rgba(9, 68, 89, 0.7)',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(9, 68, 89, 1)',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    borderWidth: 2,
    borderColor: 'rgba(15, 177, 234, 0.3)',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    fontSize: 16,
    color: 'rgba(9, 68, 89, 1)',
    fontWeight: '500',
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(15, 177, 234, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(15, 177, 234, 0.3)',
    position: 'relative',
  },
  roleButtonSelected: {
    backgroundColor: 'rgba(15, 177, 234, 0.2)',
    borderColor: 'rgba(15, 177, 234, 1)',
  },
  roleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(9, 68, 89, 0.8)',
  },
  roleButtonTextSelected: {
    color: 'rgba(9, 68, 89, 1)',
    fontWeight: 'bold',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(247, 206, 38, 1)',
  },
  signupButton: {
    backgroundColor: 'rgba(15, 177, 234, 1)',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: 'rgba(15, 177, 234, 0.4)',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  signupButtonDisabled: {
    backgroundColor: 'rgba(15, 177, 234, 0.4)',
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(9, 68, 89, 0.2)',
  },
  dividerText: {
    color: 'rgba(9, 68, 89, 0.6)',
    paddingHorizontal: 15,
    fontSize: 14,
    fontWeight: '500',
  },
  loginRedirectButton: {
    alignItems: 'center',
    padding: 10,
  },
  loginRedirectText: {
    color: 'rgba(9, 68, 89, 0.8)',
    fontSize: 15,
    fontWeight: '500',
  },
  loginRedirectHighlight: {
    color: 'rgba(255, 49, 49, 1)',
    fontWeight: 'bold',
  },
});