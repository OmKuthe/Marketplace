import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from "expo-router";
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Dimensions, FlatList, Image, Keyboard, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { auth, db } from "../../../firebaseConfig";

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

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  category: string;
  stock: string;
  imageUrl: string;
}

const { width } = Dimensions.get('window');

// Define categories with consistent casing
const CATEGORIES = [
  { label: "All", value: "all" },
  { label: "Electronics", value: "electronics" },
  { label: "Clothing", value: "clothing" },
  { label: "Food", value: "food" },
  { label: "Books", value: "books" },
  { label: "Home", value: "home" },
  { label: "Other", value: "other" }
];

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

  const [newProduct, setNewProduct] = useState<ProductFormData>({
    name: "",
    description: "",
    price: "",
    category: "",
    stock: "",
    imageUrl: ""
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  // Fixed filter function with case-insensitive comparison
  const filterProducts = useCallback(() => {
    let filtered = products;

    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (activeCategory !== "all") {
      filtered = filtered.filter(product => 
        product.category.toLowerCase() === activeCategory.toLowerCase()
      );
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
      
      if (productData.imageUrl && (productData.imageUrl.startsWith('file:') || productData.imageUrl.startsWith('content:'))) {
        try {
          const response = await fetch(productData.imageUrl);
          const blob = await response.blob();
          const storageRef = ref(storage, `products/${Date.now()}_${user.uid}.jpg`);
          const uploadResult = await uploadBytes(storageRef, blob);
          downloadURL = await getDownloadURL(uploadResult.ref);
        } catch (uploadError) {
          console.log("Error uploading image:", uploadError);
        }
      }
      
      productToAdd.imageUrl = downloadURL;

      const docRef = await addDoc(collection(db, "products"), productToAdd);

      setProducts(prevProducts => [
        { id: docRef.id, ...productToAdd, createdAt: new Date() },
        ...prevProducts
      ]);

      Alert.alert("Success", "Product added successfully");
      setAddModalVisible(false);
      resetForm();
      Keyboard.dismiss();
    } catch (err) {
      console.log("Error adding product:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProduct = async (productData: ProductFormData) => {
    if (!selectedProduct) return;

    try {
      setUploading(true);
      const productRef = doc(db, "products", selectedProduct.id);
      
      let imageUrl = productData.imageUrl||"";
      
      if (productData.imageUrl && (productData.imageUrl.startsWith('file:') || productData.imageUrl.startsWith('content:'))) {
        try {
          const storage = getStorage();
          const user = auth.currentUser;
          const response = await fetch(productData.imageUrl);
          const blob = await response.blob();
          const storageRef = ref(storage, `products/${Date.now()}_${user?.uid}.jpg`);
          const uploadResult = await uploadBytes(storageRef, blob);
          imageUrl = await getDownloadURL(uploadResult.ref);
        } catch (uploadError) {
          console.log("Error uploading image:", uploadError);
          if (selectedProduct.imageUrl) {
            imageUrl = selectedProduct.imageUrl;
          } else {
            imageUrl = "";
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
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please grant camera roll permissions to upload images');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
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

  // Fixed Category Filter Component with consistent casing
  const CategoryFilters = () => (
    <View style={styles.categoryContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScrollContent}
      >
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.value}
            style={[
              styles.categoryFilter,
              activeCategory === category.value && styles.activeCategoryFilter
            ]}
            onPress={() => setActiveCategory(category.value)}
          >
            <Text
              style={[
                styles.categoryFilterText,
                activeCategory === category.value && styles.activeCategoryFilterText
              ]}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const ProductModal = React.memo(({ isEdit = false, visible, onClose, onSubmit, newProduct, setNewProduct, pickImage, uploading }: any) => {
    const [localProduct, setLocalProduct] = useState<ProductFormData>(newProduct);
    const [errors, setErrors] = useState<Record<string, string>>({});

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
        setNewProduct(localProduct);
        onSubmit(localProduct);
      }
    };

    const handleChange = (field: keyof ProductFormData, value: string) => {
      setLocalProduct({
        ...localProduct,
        [field]: value
      });
      
      if (errors[field]) {
        setErrors({
          ...errors,
          [field]: ""
        });
      }
    };

    // Filter categories for modal (exclude "All")
    const modalCategories = CATEGORIES.filter(cat => cat.value !== 'all');

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
                />

                <View>
                  <TextInput
                    style={[styles.input, errors.price && styles.inputError]}
                    placeholder="Price *"
                    value={localProduct.price}
                    onChangeText={(text) => handleChange('price', text.replace(/[^0-9.]/g, ''))}
                    keyboardType="decimal-pad"
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
                  />
                  {errors.stock && <Text style={styles.errorText}>{errors.stock}</Text>}
                </View>

                <View>
                  <Text style={styles.label}>Category *</Text>
                  {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
                  <View style={styles.modalCategoryContainer}>
                    {modalCategories.map((category) => (
                      <TouchableOpacity
                        key={category.value}
                        style={[
                          styles.modalCategoryButton,
                          localProduct.category.toLowerCase() === category.value.toLowerCase() && 
                          styles.activeModalCategoryButton
                        ]}
                        onPress={() => handleChange('category', category.label)}
                      >
                        <Text
                          style={[
                            styles.modalCategoryText,
                            localProduct.category.toLowerCase() === category.value.toLowerCase() && 
                            styles.activeModalCategoryText
                          ]}
                        >
                          {category.label}
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
      {uploading && (
        <Modal transparent={true} animationType="fade">
          <View style={styles.loaderOverlay}>
            <View style={styles.loaderBox}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loaderText}>
                {editModalVisible ? "Updating product..." : "Adding product..."}
              </Text>
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

      {/* Fixed Category Filters */}
      <CategoryFilters />

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
                <Ionicons name="cube-outline" size={40} color="#ccc" />
              </View>
            )}
            
            <View style={styles.productContent}>
              <View style={styles.productHeader}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productPrice}>${item.price}</Text>
              </View>
              
              <Text style={styles.productDescription} numberOfLines={2}>
                {item.description}
              </Text>
              
              <View style={styles.productFooter}>
                <View style={styles.productInfo}>
                  <Text style={styles.productCategory}>#{item.category}</Text>
                  <Text style={styles.productStock}>{item.stock} in stock</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
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
  categoryContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryScrollContent: {
    paddingHorizontal: 16,
  },
  categoryFilter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  activeCategoryFilter: {
    backgroundColor: '#007AFF',
  },
  categoryFilterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeCategoryFilterText: {
    color: '#fff',
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 200,
  },
  productImagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productContent: {
    padding: 16,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productCategory: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginBottom: 4,
  },
  productStock: {
    fontSize: 14,
    color: '#666',
  },
  productActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  addFirstButton: {
    marginTop: 16,
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addFirstButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
    shadowOffset: { width: 2, height: 0 },
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalScroll: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  imagePicker: {
    width: '100%',
    height: 120,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  imagePlaceholder: {
    alignItems: 'center',
  },
  imagePlaceholderText: {
    marginTop: 8,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: -12,
    marginBottom: 16,
  },
  modalCategoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  modalCategoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 4,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
  },
  activeModalCategoryButton: {
    backgroundColor: '#007AFF',
  },
  modalCategoryText: {
    fontSize: 12,
    color: '#666',
  },
  activeModalCategoryText: {
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  loaderOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
} as const);