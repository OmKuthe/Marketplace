import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  SafeAreaView,
  Platform
} from "react-native";
import * as ImagePicker from 'expo-image-picker';
import { db } from "../../../firebaseConfig";
import { uploadToImgBB } from "../../../lib/storage";
import DateTimePicker from '@react-native-community/datetimepicker';
import { getAuth } from 'firebase/auth';

const COLORS = {
  primary: 'rgba(15, 177, 234, 1)',
  primaryLight: 'rgba(15, 177, 234, 0.15)',
  secondary: 'rgba(9, 68, 89, 1)',
  accent: 'rgba(247, 206, 38, 1)',
  background: '#FFFFFF',
  textPrimary: 'rgba(9, 68, 89, 1)',
  textSecondary: 'rgba(9, 68, 89, 0.7)',
  border: '#E0E0E0',
  inputBackground: '#F8F9FA',
  danger: 'rgba(255, 49, 49, 1)',
  success: 'rgba(76, 175, 80, 1)',
  textMuted: '#999999',
};

export default function AddOffer() {
  const router = useRouter();
  const auth = getAuth();
  const user = auth.currentUser;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    originalPrice: '',
    discountPrice: '',
    category: '',
    terms: '',
  });
  const [image, setImage] = useState<string | null>(null);
  const [expiryDate, setExpiryDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Sorry, we need camera roll permissions to make this work!');
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const validateForm = (): string | null => {
    if (!formData.title.trim()) return 'Offer title is required';
    if (!formData.description.trim()) return 'Description is required';
    if (!formData.discountPrice.trim()) return 'Discounted price is required';
    if (isNaN(parseFloat(formData.discountPrice))) return 'Discounted price must be a valid number';
    if (expiryDate <= new Date()) return 'Expiry date must be in the future';
    return null;
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create an offer');
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      Alert.alert('Error', validationError);
      return;
    }

    setLoading(true);
    try {
      console.log('Starting offer creation...');
      
      let imageUrl: string | null = null;
      
      if (image) {
        console.log('Uploading image to ImgBB...');
        setUploadingImage(true);
        imageUrl = await uploadToImgBB(image);
        setUploadingImage(false);
        
        if (imageUrl) {
          console.log('Image uploaded successfully:', imageUrl);
        } else {
          console.log('Image upload failed, continuing without image');
        }
      }

      // Get shopkeeper data to include in the offer
      let shopkeeperName = "Your Shop";
      let shopName = "Your Shop Name";
      let location = "Your Location";

      try {
        const shopkeeperDoc = await getDoc(doc(db, "shopkeepers", user.uid));
        if (shopkeeperDoc.exists()) {
          const shopkeeperData = shopkeeperDoc.data();
          shopkeeperName = shopkeeperData.ownerName || "Your Shop";
          shopName = shopkeeperData.shopName || "Your Shop Name";
          location = shopkeeperData.location || "Your Location";
        }
      } catch (error) {
        console.log('Error fetching shopkeeper data:', error);
      }

      // ✅ CHANGED: Save to "offers" collection instead of "products"
      const offerData = {
        shopkeeperId: user.uid,
        shopkeeperName: shopkeeperName,
        shopName: shopName,
        title: formData.title,
        description: formData.description,
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
        discountPrice: parseFloat(formData.discountPrice),
        category: formData.category || 'General',
        terms: formData.terms || '',
        imageUrl: imageUrl,
        expiryDate: expiryDate,
        status: 'ACTIVE',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isExpired: false,
        location: location,
        tags: formData.category ? [formData.category.toLowerCase()] : [],
      };

      console.log('Adding document to OFFERS collection...', offerData);
      
      // ✅ CHANGED: Save to "offers" collection
      const docRef = await addDoc(collection(db, "offers"), offerData);
      console.log('✅ Offer created with ID:', docRef.id);
      
      Alert.alert('Success', 'Special offer created successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('❌ Error creating offer:', error);
      setUploadingImage(false);
      
      let errorMessage = 'Failed to create offer. Please try again.';
      
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please check Firebase security rules for the "offers" collection.';
      } else if (error.code === 'unavailable') {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setExpiryDate(selectedDate);
    }
  };

  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Special Offer</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Image Upload */}
        <View style={styles.imageSection}>
          <Text style={styles.sectionLabel}>Offer Image {!image && '(Optional)'}</Text>
          <TouchableOpacity 
            style={styles.imageUpload} 
            onPress={pickImage}
            disabled={uploadingImage}
          >
            {image ? (
              <View style={styles.imagePreview}>
                <Image source={{ uri: image }} style={styles.uploadedImage} />
                {uploadingImage && (
                  <View style={styles.uploadingOverlay}>
                    <Ionicons name="cloud-upload" size={40} color="white" />
                    <Text style={styles.uploadingText}>Uploading Image...</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Ionicons name="camera" size={40} color={COLORS.textSecondary} />
                <Text style={styles.uploadText}>Add Offer Image</Text>
                <Text style={styles.uploadSubtext}>Tap to select from gallery</Text>
              </View>
            )}
          </TouchableOpacity>
          {image && !uploadingImage && (
            <TouchableOpacity 
              style={styles.changeImageButton}
              onPress={pickImage}
            >
              <Text style={styles.changeImageText}>Change Image</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Offer Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Summer Sale - 50% Off"
              value={formData.title}
              onChangeText={(text) => setFormData({...formData, title: text})}
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your special offer..."
              value={formData.description}
              onChangeText={(text) => setFormData({...formData, description: text})}
              multiline
              numberOfLines={4}
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfInput]}>
              <Text style={styles.label}>Original Price (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="₹999"
                value={formData.originalPrice}
                onChangeText={(text) => setFormData({...formData, originalPrice: text})}
                keyboardType="numeric"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            <View style={[styles.inputGroup, styles.halfInput]}>
              <Text style={styles.label}>Discounted Price *</Text>
              <TextInput
                style={styles.input}
                placeholder="₹499"
                value={formData.discountPrice}
                onChangeText={(text) => setFormData({...formData, discountPrice: text})}
                keyboardType="numeric"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Electronics, Fashion, Food"
              value={formData.category}
              onChangeText={(text) => setFormData({...formData, category: text})}
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Terms & Conditions (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Any special terms for this offer..."
              value={formData.terms}
              onChangeText={(text) => setFormData({...formData, terms: text})}
              multiline
              numberOfLines={3}
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Expiry Date *</Text>
            <TouchableOpacity 
              style={styles.datePickerButton}
              onPress={showDatePickerModal}
            >
              <Text style={styles.dateText}>
                {expiryDate.toLocaleDateString()}
              </Text>
              <Ionicons name="calendar" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={expiryDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}

          <TouchableOpacity 
            style={[styles.submitButton, (loading || uploadingImage) && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={loading || uploadingImage}
          >
            {loading ? (
              <Text style={styles.submitButtonText}>
                {uploadingImage ? 'Uploading Image...' : 'Creating Offer...'}
              </Text>
            ) : (
              <>
                <Ionicons name="flash" size={20} color="white" />
                <Text style={styles.submitButtonText}>Create Special Offer</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.note}>
            * Required fields. Offers will be automatically marked as expired after the expiry date.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  imageSection: {
    margin: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  imageUpload: {
    height: 200,
    borderRadius: 12,
    backgroundColor: COLORS.inputBackground,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    color: 'white',
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  uploadPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    marginTop: 8,
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  uploadSubtext: {
    marginTop: 4,
    color: COLORS.textMuted,
    fontSize: 12,
  },
  changeImageButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 6,
  },
  changeImageText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  form: {
    padding: 16,
    paddingTop: 0,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
  },
  dateText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  note: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
});