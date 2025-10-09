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
            <Text style={styles.title}>Setup Your Shop</Text>
            <Text style={styles.subtitle}>
              Complete your business profile to start serving customers
            </Text>
          </View>

          {/* Shop Profile Form Card */}
          <View style={styles.card}>
            {/* Shop Name Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Shop Name</Text>
              <TextInput
                placeholder="Enter your shop/business name"
                placeholderTextColor="rgba(9, 68, 89, 0.5)"
                value={shopName}
                onChangeText={setShopName}
                style={styles.input}
                autoCapitalize="words"
              />
            </View>

            {/* Owner Name Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Owner Name</Text>
              <TextInput
                placeholder="Enter owner's full name"
                placeholderTextColor="rgba(9, 68, 89, 0.5)"
                value={ownerName}
                onChangeText={setOwnerName}
                style={styles.input}
                autoCapitalize="words"
              />
            </View>

            {/* Location Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Shop Location</Text>
              <TextInput
                placeholder="Enter complete shop address"
                placeholderTextColor="rgba(9, 68, 89, 0.5)"
                value={location}
                onChangeText={setLocation}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                style={[styles.input, styles.textArea]}
              />
            </View>

            {/* Phone Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Contact Number</Text>
              <TextInput
                placeholder="Enter shop contact number"
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
                (!shopName || !ownerName || !location || !phone || loading) && styles.profileButtonDisabled
              ]}
              onPress={handleProfileSetup}
              disabled={!shopName || !ownerName || !location || !phone || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.profileButtonText}>Complete Shop Setup</Text>
              )}
            </TouchableOpacity>

            {/* Business Info Text */}
            <View style={styles.businessInfoContainer}>
              <Text style={styles.businessInfoTitle}>📋 Business Information</Text>
              <Text style={styles.businessInfoText}>
                This information will be visible to customers. Make sure it's accurate and up-to-date.
              </Text>
            </View>

            {/* Features List */}
            <View style={styles.featuresContainer}>
              <Text style={styles.featuresTitle}>🎯 After completing your profile:</Text>
              <View style={styles.featureItem}>
                <Text style={styles.featureDot}>•</Text>
                <Text style={styles.featureText}>Start accepting orders from customers</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureDot}>•</Text>
                <Text style={styles.featureText}>Manage your product catalog</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureDot}>•</Text>
                <Text style={styles.featureText}>Track your sales and revenue</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureDot}>•</Text>
                <Text style={styles.featureText}>Build your customer base</Text>
              </View>
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
    minHeight: 80,
    textAlignVertical: 'top',
  },
  profileButton: {
    backgroundColor: 'rgba(15, 177, 234, 1)',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 25,
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
  businessInfoContainer: {
    backgroundColor: 'rgba(247, 206, 38, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: 'rgba(247, 206, 38, 1)',
    marginBottom: 20,
  },
  businessInfoTitle: {
    color: 'rgba(9, 68, 89, 1)',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  businessInfoText: {
    color: 'rgba(9, 68, 89, 0.8)',
    fontSize: 14,
    lineHeight: 20,
  },
  featuresContainer: {
    backgroundColor: 'rgba(15, 177, 234, 0.05)',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(15, 177, 234, 0.2)',
  },
  featuresTitle: {
    color: 'rgba(9, 68, 89, 1)',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  featureDot: {
    color: 'rgba(255, 49, 49, 1)',
    fontSize: 16,
    marginRight: 8,
    marginTop: 2,
  },
  featureText: {
    color: 'rgba(9, 68, 89, 0.8)',
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
});