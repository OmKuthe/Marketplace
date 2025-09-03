import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, serverTimestamp } from "firebase/firestore";
import React, { useEffect, useState, useCallback } from "react";
import { FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View, TextInput, ActivityIndicator, Dimensions, Modal, Image, Alert, ScrollView, Keyboard } from "react-native";
import { db, auth } from "../../../firebaseConfig";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import * as ImagePicker from 'expo-image-picker';
import { TouchableWithoutFeedback } from "react-native";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as FileSystem from "expo-file-system";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl?: string;
  createdAt: any;
  shopId: string;
};

// Add interface for product form data
interface ProductFormData {
  name: string;
  description: string;
  price: string;
  category: string;
  stock: string;
  imageUrl: string;
}

const { width } = Dimensions.get('window');

export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidePanelVisible, setSidePanelVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  // New product form state
  const [newProduct, setNewProduct] = useState<ProductFormData>({
    name: "",
    description: "",
    price: "",
    category: "",
    stock: "",
    imageUrl: ""
  });

  const categories = ["Electronics", "Clothing", "Food", "Books", "Home", "Other"];

  useEffect(() => {
    fetchProducts();
  }, []);

  // Use useCallback to memoize the filter function
  const filterProducts = useCallback(() => {
    let filtered = products;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (activeCategory !== "all") {
      filtered = filtered.filter(product => product.category === activeCategory);
    }

    setFilteredProducts(filtered);
  }, [products, searchQuery, activeCategory]);

  useEffect(() => {
    filterProducts();
  }, [filterProducts]);

  const fetchProducts = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const q = query(
        collection(db, "products"),
        where("shopId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];

      setProducts(data);
    } catch (err: any) {
      console.log("Error fetching products:", err);
      Alert.alert("Error", "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  // Add proper type to productData parameter
  const handleAddProduct = async (productData: ProductFormData) => {
    const storage = getStorage();
    
    if (!productData.name || !productData.price || !productData.category) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "You must be logged in to add products");
        return;
      }

      setUploading(true);

      // Create the new product object
      const productToAdd = {
        name: productData.name,
        description: productData.description,
        price: parseFloat(productData.price),
        category: productData.category,
        stock: parseInt(productData.stock) || 0,
        imageUrl: productData.imageUrl,
        shopId: user.uid,
        createdAt: serverTimestamp()
      };

      let downloadURL = productData.imageUrl;
      
      // Only upload to storage if it's a local file URI
      if (productData.imageUrl && (productData.imageUrl.startsWith('file:') || productData.imageUrl.startsWith('content:'))) {
        try {
          // Convert image to blob for upload
          const response = await fetch(productData.imageUrl);
          const blob = await response.blob();
          
          // Create a reference to the file in Firebase Storage
          const storageRef = ref(storage, `products/${Date.now()}_${user.uid}.jpg`);
          
          // Upload the file to Firebase Storage
          const uploadResult = await uploadBytes(storageRef, blob);
          
          // Get the download URL
          downloadURL = await getDownloadURL(uploadResult.ref);
        } catch (uploadError) {
          console.log("Error uploading image:", uploadError);
          //Alert.alert("Warning", "Failed to upload image, but product will be added without image");
          //return if we want to pause the uploading
        }
      }
      
      productToAdd.imageUrl = downloadURL;

      // Add to Firestore
      const docRef = await addDoc(collection(db, "products"), productToAdd);

      // Update local state immediately with the new product
      setProducts(prevProducts => [
        { id: docRef.id, ...productToAdd, createdAt: new Date() },
        ...prevProducts
      ]);

      Alert.alert("Success", "Product added successfully");
      setAddModalVisible(false);
      resetForm();
      
      // Dismiss keyboard if it's open
      Keyboard.dismiss();
    } catch (err) {
      console.log("Error adding product:", err);
      //Alert.alert("Error", "Failed to add product");
    } finally {
      setUploading(false);
    }
  };

  // Add proper type to productData parameter
  const handleUpdateProduct = async (productData: ProductFormData) => {
    if (!selectedProduct) return;

    try {
      setUploading(true);
      const productRef = doc(db, "products", selectedProduct.id);
      
      let imageUrl = productData.imageUrl||"";
      
      // Only upload to storage if it's a local file URI (new image selected)
      if (productData.imageUrl && (productData.imageUrl.startsWith('file:') || productData.imageUrl.startsWith('content:'))) {
        try {
          const storage = getStorage();
          const user = auth.currentUser;
          
          // Convert image to blob for upload
          const response = await fetch(productData.imageUrl);
          const blob = await response.blob();
          
          // Create a reference to the file in Firebase Storage
          const storageRef = ref(storage, `products/${Date.now()}_${user?.uid}.jpg`);
          
          // Upload the file to Firebase Storage
          const uploadResult = await uploadBytes(storageRef, blob);
          
          // Get the download URL
          imageUrl = await getDownloadURL(uploadResult.ref);
        } catch (uploadError) {
          console.log("Error uploading image:", uploadError);
          //Alert.alert("Warning", "Failed to upload image, but product will be updated without new image");
          // Keep the existing image URL if upload fails
          if (selectedProduct.imageUrl) {
            imageUrl = selectedProduct.imageUrl;
          } else {
            imageUrl = ""; // fallback if product had no image
          }
        }
      }
      
      const updatedProduct = {
        name: productData.name,
        description: productData.description,
        price: parseFloat(productData.price),
        category: productData.category,
        stock: parseInt(productData.stock),
        imageUrl: imageUrl
      };

      await updateDoc(productRef, updatedProduct);

      // Update local state immediately
      setProducts(prevProducts =>
        prevProducts.map(product =>
          product.id === selectedProduct.id
            ? { ...product, ...updatedProduct }
            : product
        )
      );

      Alert.alert("Success", "Product updated successfully");
      setEditModalVisible(false);
      resetForm();
      
      // Dismiss keyboard if it's open
      Keyboard.dismiss();
    } catch (err) {
      console.log("Error updating product:", err);
      Alert.alert("Error", "Failed to update product");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this product?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "products", productId));
              
              // Update local state immediately
              setProducts(prevProducts =>
                prevProducts.filter(product => product.id !== productId)
              );
              
              Alert.alert("Success", "Product deleted successfully");
            } catch (err) {
              console.log("Error deleting product:", err);
              Alert.alert("Error", "Failed to delete product");
            }
          }
        }
      ]
    );
  };

  const pickImage = async () => {
    // Request permissions first
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please grant camera roll permissions to upload images');
      return;
    }

    // Use the updated method for image picking
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8, // Slightly reduced quality for faster uploads
    });

    if (!result.canceled) {
      setNewProduct({
        ...newProduct,
        imageUrl: result.assets[0].uri
      });
    }
  };

  const resetForm = () => {
    setNewProduct({
      name: "",
      description: "",
      price: "",
      category: "",
      stock: "",
      imageUrl: ""
    });
    setSelectedProduct(null);
  };

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setNewProduct({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      category: product.category,
      stock: product.stock.toString(),
      imageUrl: product.imageUrl || ""
    });
    setEditModalVisible(true);
  };

  // Create a separate component for the ProductModal to prevent re-renders
  const ProductModal = React.memo(({ isEdit = false, visible, onClose, onSubmit, newProduct, setNewProduct, pickImage, uploading }: any) => {
    const [localProduct, setLocalProduct] = useState<ProductFormData>(newProduct);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Sync with parent state when modal opens/closes
    useEffect(() => {
      if (visible) {
        setLocalProduct(newProduct);
        setErrors({});
      }
    }, [visible, newProduct]);

    const validateForm = () => {
      const newErrors: Record<string, string> = {};

      if (!localProduct.name.trim()) {
        newErrors.name = "Product name is required";
      }

      if (!localProduct.price.trim()) {
        newErrors.price = "Price is required";
      } else if (isNaN(parseFloat(localProduct.price)) || parseFloat(localProduct.price) <= 0) {
        newErrors.price = "Please enter a valid price";
      }

      if (!localProduct.category) {
        newErrors.category = "Category is required";
      }

      if (localProduct.stock && (isNaN(parseInt(localProduct.stock)) || parseInt(localProduct.stock) < 0)) {
        newErrors.stock = "Please enter a valid stock quantity";
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
      if (validateForm()) {
        // Update parent state and submit with the local product data
        setNewProduct(localProduct);
        onSubmit(localProduct);
      }
    };

    const handleChange = (field: keyof ProductFormData, value: string) => {
      setLocalProduct({
        ...localProduct,
        [field]: value
      });
      
      // Clear error when user starts typing
      if (errors[field]) {
        setErrors({
          ...errors,
          [field]: ""
        });
      }
    };

    return (


      

      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {isEdit ? "Edit Product" : "Add New Product"}
              </Text>

              <ScrollView
                style={styles.modalScroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >

              <Text style={styles.label}>Product Image</Text>
                <TouchableOpacity style={styles.imagePicker} onPress={pickImage} disabled={uploading}>
                  {localProduct.imageUrl ? (
                    <Image source={{ uri: localProduct.imageUrl }} style={styles.imagePreview} />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Ionicons name="camera" size={24} color="#666" />
                      <Text style={styles.imagePlaceholderText}>Select Image</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <View>
                  <TextInput
                    style={[styles.input, errors.name && styles.inputError]}
                    placeholder="Product Name *"
                    value={localProduct.name}
                    onChangeText={(text) => handleChange('name', text)}
                    blurOnSubmit={false}     // 👈 prevents triggering form-like submit
                    onSubmitEditing={() => {}} // 👈 no-op handler so Enter doesn’t refresh
                  />
                  {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                </View>

                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Description"
                  value={localProduct.description}
                  onChangeText={(text) => handleChange('description', text)}
                  multiline
                  numberOfLines={3}
                  blurOnSubmit={false}     // 👈 prevents triggering form-like submit
                  onSubmitEditing={() => {}} // 👈 no-op handler so Enter doesn’t refresh
                />

                <View>
                  <TextInput
                    style={[styles.input, errors.price && styles.inputError]}
                    placeholder="Price *"
                    value={localProduct.price}
                    onChangeText={(text) => handleChange('price', text.replace(/[^0-9.]/g, ''))}
                    keyboardType="decimal-pad"
                    blurOnSubmit={false}     // 👈 prevents triggering form-like submit
                    onSubmitEditing={() => {}} // 👈 no-op handler so Enter doesn’t refresh
                  />
                  {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
                </View>

                <View>
                  <TextInput
                    style={[styles.input, errors.stock && styles.inputError]}
                    placeholder="Stock Quantity"
                    value={localProduct.stock}
                    onChangeText={(text) => handleChange('stock', text.replace(/[^0-9]/g, ''))}
                    keyboardType="numeric"
                    blurOnSubmit={false}     // 👈 prevents triggering form-like submit
                    onSubmitEditing={() => {}} // 👈 no-op handler so Enter doesn’t refresh
                  />
                  {errors.stock && <Text style={styles.errorText}>{errors.stock}</Text>}
                </View>

                <View>
                  <Text style={styles.label}>Category *</Text>
                  {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
                  <View style={styles.categoryContainer}>
                    {categories.map((category) => (
                      <TouchableOpacity
                        key={category}
                        style={[
                          styles.categoryButton,
                          localProduct.category === category && styles.activeCategoryButton
                        ]}
                        onPress={() => handleChange('category', category)}
                      >
                        <Text
                          style={[
                            styles.categoryText,
                            localProduct.category === category && styles.activeCategoryText
                          ]}
                        >
                          {category}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={onClose}
                    disabled={uploading}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.submitButton, uploading && styles.disabledButton]}
                    onPress={handleSubmit}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={styles.submitButtonText}>
                        {isEdit ? "Update" : "Add"} Product
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  });

  const SidePanel = () => (
    <View style={styles.sidePanel}>
      <TouchableOpacity
        style={styles.sidePanelClose}
        onPress={() => setSidePanelVisible(false)}
      >
        <Ionicons name="close" size={24} color="#333" />
      </TouchableOpacity>

      <View style={styles.sidePanelHeader}>
        <Text style={styles.sidePanelTitle}>Shop Menu</Text>
      </View>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => {
          setSidePanelVisible(false);
          router.push("/shopkeeper/home");
        }}
      >
        <Ionicons name="home" size={20} color="#007AFF" />
        <Text style={styles.menuItemText}>Dashboard</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.menuItem, styles.activeMenuItem]}
        onPress={() => setSidePanelVisible(false)}
      >
        <Ionicons name="cube" size={20} color="#007AFF" />
        <Text style={styles.menuItemText}>Products</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => {
          setSidePanelVisible(false);
          router.push("/shopkeeper/myorders");
        }}
      >
        <Ionicons name="list" size={20} color="#007AFF" />
        <Text style={styles.menuItemText}>Orders</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => {
          setSidePanelVisible(false);
          router.push("/shopkeeper/analytics");
        }}
      >
        <Ionicons name="stats-chart" size={20} color="#007AFF" />
        <Text style={styles.menuItemText}>Analytics</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => {
          setSidePanelVisible(false);
          router.push("/shopkeeper/profile");
        }}
      >
        <Ionicons name="person" size={20} color="#007AFF" />
        <Text style={styles.menuItemText}>Profile</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  return (
    

    <SafeAreaView style={styles.container}>
      {/* Fullscreen Loader while uploading */}
{uploading && (
  <Modal transparent={true} animationType="fade">
    <View style={styles.loaderOverlay}>
      <View style={styles.loaderBox}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loaderText}>Adding product...</Text>
      </View>
    </View>
  </Modal>
)}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSidePanelVisible(true)}>
          <Ionicons name="menu" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📦 My Products</Text>
        <TouchableOpacity onPress={() => setAddModalVisible(true)}>
          <Ionicons name="add" size={28} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Side Panel */}
      {sidePanelVisible && <SidePanel />}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#777" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Category Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
      >
        <TouchableOpacity
          style={[
            styles.categoryFilter,
            activeCategory === "all" && styles.activeCategoryFilter
          ]}
          onPress={() => setActiveCategory("all")}
        >
          <Text
            style={[
              styles.categoryFilterText,
              activeCategory === "all" && styles.activeCategoryFilterText
            ]}
          >
            All
          </Text>
        </TouchableOpacity>

        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryFilter,
              activeCategory === category && styles.activeCategoryFilter
            ]}
            onPress={() => setActiveCategory(category)}
          >
            <Text
              style={[
                styles.categoryFilterText,
                activeCategory === category && styles.activeCategoryFilterText
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Products List */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={50} color="#ccc" />
            <Text style={styles.emptyText}>No products found</Text>
            <Text style={styles.emptySubText}>
              {searchQuery || activeCategory !== "all"
                ? "Try changing your search or filters"
                : "Add your first product to get started"
              }
            </Text>
            {!searchQuery && activeCategory === "all" && (
              <TouchableOpacity
                style={styles.addFirstButton}
                onPress={() => setAddModalVisible(true)}
              >
                <Text style={styles.addFirstButtonText}>Add First Product</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.productCard}>
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
            ) : (
              <View style={styles.productImagePlaceholder}>
                <Ionicons name="cube-outline" size={24} color="#ccc" />
              </View>
            )}
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productDescription} numberOfLines={2}>
                {item.description}
              </Text>
              <View style={styles.productMeta}>
                <Text style={styles.productPrice}>${item.price}</Text>
                <Text style={styles.productStock}>
                  {item.stock} in stock
                </Text>
              </View>
              <Text style={styles.productCategory}>{item.category}</Text>
            </View>
            <View style={styles.productActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => openEditModal(item)}
              >
                <Ionicons name="create-outline" size={20} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDeleteProduct(item.id)}
              >
                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Add Product Modal */}
      <ProductModal
        isEdit={false}
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSubmit={handleAddProduct}
        newProduct={newProduct}
        setNewProduct={setNewProduct}
        pickImage={pickImage}
        uploading={uploading}
      />

      {/* Edit Product Modal */}
      <ProductModal
        isEdit={true}
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        onSubmit={handleUpdateProduct}
        newProduct={newProduct}
        setNewProduct={setNewProduct}
        pickImage={pickImage}
        uploading={uploading}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create(
  
  {loaderOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },  
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  sidePanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width * 0.7,
    height: '100%',
    backgroundColor: '#fff',
    zIndex: 100,
    padding: 20,
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
    marginBottom: 20,
  },
  sidePanelHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 15,
    marginBottom: 20,
  },
  sidePanelTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activeMenuItem: {
    backgroundColor: '#f0f7ff',
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 15,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
  },
  categoryScroll: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  categoryFilter: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  activeCategoryFilter: {
    backgroundColor: '#007AFF',
  },
  categoryFilterText: {
    fontSize: 14,
    color: '#666',
  },
  activeCategoryFilterText: {
    color: '#fff',
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  productImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  productStock: {
    fontSize: 14,
    color: '#666',
  },
  productCategory: {
    fontSize: 12,
    color: '#999',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  productActions: {
    justifyContent: 'space-between',
    paddingLeft: 10,
  },
  actionButton: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 5,
  },
  emptySubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  addFirstButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 15,
  },
  addFirstButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  modalScroll: {
    maxHeight: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    marginBottom: 8,
  },
  activeCategoryButton: {
    backgroundColor: '#007AFF',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  activeCategoryText: {
    color: '#fff',
  },
  imagePicker: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    height: 120,
    marginBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  imagePlaceholder: {
    alignItems: 'center',
  },
  imagePlaceholderText: {
    marginTop: 8,
    color: '#666',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 15,
  },
});