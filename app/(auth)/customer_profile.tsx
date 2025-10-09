import { useRouter } from "expo-router";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import React, { useState } from "react";
import { 
  Alert, 
  ScrollView, 
  Text, 
  TextInput, 
  View, 
  Image, 
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from "react-native";

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
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Background Image */}
      <Image 
        source={require('../../assets/images/TownMart_bg.png')}
        style={styles.backgroundImage}
        blurRadius={2}
      />
      
      {/* Overlay */}
      <View style={styles.overlay} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../assets/images/TownMart.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>
              Tell us a bit about yourself to get started
            </Text>
          </View>

          {/* Profile Form Card */}
          <View style={styles.card}>
            {/* Full Name Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                placeholder="Enter your full name"
                placeholderTextColor="rgba(9, 68, 89, 0.5)"
                value={fullName}
                onChangeText={setFullName}
                style={styles.input}
                autoCapitalize="words"
              />
            </View>

            {/* Address Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                placeholder="Enter your complete address"
                placeholderTextColor="rgba(9, 68, 89, 0.5)"
                value={address}
                onChangeText={setAddress}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                style={[styles.input, styles.textArea]}
              />
            </View>

            {/* Phone Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                placeholder="Enter your phone number"
                placeholderTextColor="rgba(9, 68, 89, 0.5)"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                style={styles.input}
              />
            </View>

            {/* Complete Profile Button */}
            <TouchableOpacity 
              style={[
                styles.profileButton,
                (!fullName || !address || !phone || loading) && styles.profileButtonDisabled
              ]}
              onPress={handleProfileSetup}
              disabled={!fullName || !address || !phone || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.profileButtonText}>Complete Profile</Text>
              )}
            </TouchableOpacity>

            {/* Help Text */}
            <View style={styles.helpContainer}>
              <Text style={styles.helpText}>
                🎉 You're almost there! Complete your profile to start using all features.
              </Text>
            </View>
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
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 20,
    shadowColor: 'rgba(9, 68, 89, 0.3)',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 20,
  },
  logo: {
    width: 60,
    height: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'rgba(9, 68, 89, 1)',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: 'rgba(9, 68, 89, 0.7)',
    lineHeight: 22,
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
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
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
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  profileButton: {
    backgroundColor: 'rgba(15, 177, 234, 1)',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    shadowColor: 'rgba(15, 177, 234, 0.4)',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  profileButtonDisabled: {
    backgroundColor: 'rgba(15, 177, 234, 0.4)',
  },
  profileButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  helpContainer: {
    backgroundColor: 'rgba(247, 206, 38, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: 'rgba(247, 206, 38, 1)',
  },
  helpText: {
    color: 'rgba(9, 68, 89, 0.8)',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});