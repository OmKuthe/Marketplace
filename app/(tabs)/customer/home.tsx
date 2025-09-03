import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from "expo-router";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { db } from "../../../firebaseConfig";

const { width } = Dimensions.get('window');

// New color palette
const colors = {
  primary: '#405DE6',    // Instagram blue
  secondary: '#E1306C',  // Instagram pink
  background: '#FAFAFA', // Light background
  surface: '#FFFFFF',    // White
  textPrimary: '#262626',// Dark gray
  textSecondary: '#8e8e8e', // Medium gray
  border: '#dbdbdb',     // Light border
  needCard: '#FFECE6',   // Soft orange for needs
  offerCard: '#E6F3FF',  // Soft blue for offers
  success: '#4CAF50',    // Green for success actions
};

// Animated Product Card Component
const AnimatedProductCard = ({ item, index }: any) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Staggered animation based on index
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 40,
        delay: index * 100,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handleSave = () => {
    setSaved(!saved);
    // Add save functionality here
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this product: ${item.name} - ${item.description}`,
        title: item.name,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <Animated.View 
      style={[
        styles.instagramCard,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      {/* Card Header with User Info */}
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <Image 
            source={{ uri: 'https://randomuser.me/api/portraits/men/1.jpg' }} 
            style={styles.avatar}
          />
          <View>
            <Text style={styles.username}>john_doe</Text>
            <Text style={styles.userLocation}>New York, NY</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleSave}>
          <Ionicons 
            name={saved ? "bookmark" : "bookmark-outline"} 
            size={24} 
            color={saved ? colors.primary : colors.textPrimary} 
          />
        </TouchableOpacity>
      </View>
      
      {/* Product Image */}
      <Image 
        source={{ uri: item.imageUrl || 'https://via.placeholder.com/400x300' }} 
        style={styles.productImage}
        resizeMode="cover"
      />
      
      {/* Card Footer with Details */}
      <View style={styles.cardFooter}>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.orderButton}>
            <Ionicons name="cart" size={20} color="white" />
            <Text style={styles.orderButtonText}>Order Now</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.messageButton}>
            <Ionicons name="chatbubble-ellipses" size={20} color={colors.primary} />
            <Text style={styles.messageButtonText}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-social" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.productDetails}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productDescription} numberOfLines={2}>
            {item.description}
          </Text>
          <View style={styles.priceStockContainer}>
            <Text style={styles.productPrice}>💰 ${item.price}</Text>
            <Text style={styles.productStock}>📦 {item.stock} in stock</Text>
          </View>
          <Text style={styles.productCategory}>#{item.category}</Text>
        </View>
        
        {item.createdAt?.seconds && (
          <Text style={styles.timestamp}>
            {new Date(item.createdAt.seconds * 1000).toLocaleDateString()}
          </Text>
        )}
      </View>
    </Animated.View>
  );
};

export default function CustomerHome() {
  const [posts, setPosts] = useState<any[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [sidePanelVisible, setSidePanelVisible] = useState(false);
  const [createPostModalVisible, setCreatePostModalVisible] = useState(false);
  const [postType, setPostType] = useState("NEED");
  const router = useRouter();
  
  // New state for enhanced create post form
  const [newPost, setNewPost] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category: "",
    type: "NEED",
    image: null as string | null,
  });
  
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const q = query(
          collection(db, "products"),
          orderBy("createdAt", "desc")
        );
  
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPosts(data);
        setFilteredPosts(data);
      } catch (err) {
        console.log("Error fetching products:", err);
      }
    };
  
    fetchProducts();
  }, []);
  
  useEffect(() => {
    if (activeTab === "all") {
      setFilteredPosts(posts);
    } else {
      setFilteredPosts(posts.filter(post => post.type === activeTab.toUpperCase()));
    }
  }, [activeTab, posts]);

  const handleCreatePost = async () => {
    // Add your Firebase logic to save the post here
    console.log("Creating post:", newPost);
    
    // For now, just close the modal and reset the form
    setCreatePostModalVisible(false);
    setNewPost({
      name: "",
      description: "",
      price: "",
      stock: "",
      category: "",
      type: "NEED",
      image: null,
    });
  };

  const pickImage = async () => {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }

    // Launch image picker
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setNewPost({...newPost, image: result.assets[0].uri});
    }
  };

  const SidePanel = () => (
    <View style={styles.sidePanel}>
      <TouchableOpacity 
        style={styles.sidePanelClose} 
        onPress={() => setSidePanelVisible(false)}
      >
        <Ionicons name="close" size={24} color={colors.textPrimary} />
      </TouchableOpacity>
      
      <View style={styles.sidePanelHeader}>
        <Text style={styles.sidePanelTitle}>Menu</Text>
      </View>
      
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => {
          setSidePanelVisible(false);
          router.push("/customer/home");
        }}
      >
        <Ionicons name="home" size={22} color={colors.primary} />
        <Text style={styles.menuItemText}>Home</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => {
          setSidePanelVisible(false);
          router.push("/customer/search");
        }}
      >
        <Ionicons name="search" size={22} color={colors.primary} />
        <Text style={styles.menuItemText}>Search</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => {
          setSidePanelVisible(false);
          router.push("/customer/messages");
        }}
      >
        <Ionicons name="chatbubbles" size={22} color={colors.primary} />
        <Text style={styles.menuItemText}>Messages</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => {
          setSidePanelVisible(false);
          router.push("/customer/myorders");
        }}
      >
        <Ionicons name="list" size={22} color={colors.primary} />
        <Text style={styles.menuItemText}>Orders</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => {
          setSidePanelVisible(false);
          router.push("/customer/profile");
        }}
      >
        <Ionicons name="person" size={22} color={colors.primary} />
        <Text style={styles.menuItemText}>Profile</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with menu button and create post button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSidePanelVisible(true)}>
          <Ionicons name="menu" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🛒 Customer Dashboard</Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => setCreatePostModalVisible(true)}
        >
          <Ionicons name="add-circle" size={26} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Side Panel */}
      {sidePanelVisible && <SidePanel />}

      {/* Post Type Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "all" && styles.activeTab]}
          onPress={() => setActiveTab("all")}
        >
          <Text style={[styles.tabText, activeTab === "all" && styles.activeTabText]}>All Posts</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "need" && styles.activeTab]}
          onPress={() => setActiveTab("need")}
        >
          <Text style={[styles.tabText, activeTab === "need" && styles.activeTabText]}>Needs</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "offer" && styles.activeTab]}
          onPress={() => setActiveTab("offer")}
        >
          <Text style={[styles.tabText, activeTab === "offer" && styles.activeTabText]}>Offers</Text>
        </TouchableOpacity>
      </View>

      {/* Posts List with Instagram-style cards */}
      <FlatList
        data={filteredPosts}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 25 }}
        renderItem={({ item, index }) => (
          <AnimatedProductCard item={item} index={index} />
        )}
      />

      {/* Enhanced Create Post Modal */}
      <Modal
        visible={createPostModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCreatePostModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create New Post</Text>
                <TouchableOpacity 
                  onPress={() => setCreatePostModalVisible(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.postTypeSelector}>
                <TouchableOpacity 
                  style={[styles.typeButton, newPost.type === "NEED" && styles.activeTypeButton]}
                  onPress={() => setNewPost({...newPost, type: "NEED"})}
                >
                  <Text style={[styles.typeButtonText, newPost.type === "NEED" && styles.activeTypeButtonText]}>Need</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.typeButton, newPost.type === "OFFER" && styles.activeTypeButton]}
                  onPress={() => setNewPost({...newPost, type: "OFFER"})}
                >
                  <Text style={[styles.typeButtonText, newPost.type === "OFFER" && styles.activeTypeButtonText]}>Offer</Text>
                </TouchableOpacity>
              </View>
              
              {/* Image Upload Section */}
              <TouchableOpacity style={styles.imageUploadSection} onPress={pickImage}>
                {newPost.image ? (
                  <Image source={{ uri: newPost.image }} style={styles.selectedImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="image-outline" size={40} color={colors.textSecondary} />
                    <Text style={styles.imagePlaceholderText}>Tap to add an image</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              {/* Form Fields */}
              <TextInput
                style={styles.formInput}
                placeholder="Product Name"
                value={newPost.name}
                onChangeText={(text) => setNewPost({...newPost, name: text})}
              />
              
              <TextInput
                style={[styles.formInput, styles.textArea]}
                multiline
                numberOfLines={3}
                placeholder="Description"
                value={newPost.description}
                onChangeText={(text) => setNewPost({...newPost, description: text})}
              />
              
              <View style={styles.rowInputs}>
                <TextInput
                  style={[styles.formInput, styles.halfInput]}
                  placeholder="Price ($)"
                  keyboardType="numeric"
                  value={newPost.price}
                  onChangeText={(text) => setNewPost({...newPost, price: text})}
                />
                <TextInput
                  style={[styles.formInput, styles.halfInput]}
                  placeholder="Stock"
                  keyboardType="numeric"
                  value={newPost.stock}
                  onChangeText={(text) => setNewPost({...newPost, stock: text})}
                />
              </View>
              
              <TextInput
                style={styles.formInput}
                placeholder="Category"
                value={newPost.category}
                onChangeText={(text) => setNewPost({...newPost, category: text})}
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setCreatePostModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={handleCreatePost}
                  disabled={!newPost.name.trim() || !newPost.description.trim()}
                >
                  <Text style={styles.submitButtonText}>Create Post</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  createButton: {
    padding: 6,
  },
  sidePanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width * 0.75,
    height: '100%',
    backgroundColor: colors.surface,
    zIndex: 100,
    paddingVertical: 40,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sidePanelClose: {
    alignSelf: 'flex-end',
    marginBottom: 30,
  },
  sidePanelHeader: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 20,
    marginBottom: 25,
  },
  sidePanelTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 15,
    color: colors.textPrimary,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: 'white',
  },
  instagramCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginHorizontal: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  username: {
    fontWeight: '600',
    color: colors.textPrimary,
    fontSize: 14,
  },
  userLocation: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  productImage: {
    width: '100%',
    aspectRatio: 4 / 3, // keeps 4:3 ratio no matter what
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  cardFooter: {
    padding: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  orderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 2,
    marginRight: 10,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  orderButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 14,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 2,
    marginRight: 10,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  messageButtonText: {
    color: colors.textPrimary,
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 14,
  },
  shareButton: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  productDetails: {
    marginBottom: 12,
  },
  productName: {
    fontWeight: '700',
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  productDescription: {
    color: colors.textPrimary,
    marginBottom: 10,
    lineHeight: 20,
    fontSize: 14,
  },
  priceStockContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  productPrice: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 15,
  },
  productStock: {
    color: colors.textPrimary,
    fontSize: 14,
  },
  productCategory: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  modalContent: {
    width: width * 0.9,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalCloseButton: {
    padding: 4,
  },
  postTypeSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTypeButton: {
    backgroundColor: colors.primary,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeTypeButtonText: {
    color: 'white',
  },
  imageUploadSection: {
    height: 200,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    marginBottom: 20,
    overflow: 'hidden',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  imagePlaceholderText: {
    marginTop: 10,
    color: colors.textSecondary,
  },
  formInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 14,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  submitButton: {
    backgroundColor: colors.primary,
  },
  cancelButtonText: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});