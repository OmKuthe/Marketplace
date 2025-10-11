import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from "expo-router";
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Dimensions, FlatList, Image, Keyboard, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { auth, db } from "../../../firebaseConfig";
import { uploadToImgBB } from '../../../lib/storage';

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
  { label: "All", value: "all", icon: "grid" },
  { label: "Electronics", value: "electronics", icon: "phone-portrait" },
  { label: "Clothing", value: "clothing", icon: "shirt" },
  { label: "Food", value: "food", icon: "fast-food" },
  { label: "Books", value: "books", icon: "book" },
  { label: "Home", value: "home", icon: "home" },
  { label: "Other", value: "other", icon: "cube" }
];

// Enhanced color constants with better usage
const COLORS = {
  primary: 'rgba(15, 177, 234, 1)',
  primaryLight: 'rgba(15, 177, 234, 0.15)',
  primaryDark: 'rgba(12, 142, 187, 1)',
  secondary: 'rgba(9, 68, 89, 1)',
  secondaryLight: 'rgba(9, 68, 89, 0.7)',
  accent: 'rgba(247, 206, 38, 1)', // Yellow - now properly used
  accentLight: 'rgba(247, 206, 38, 0.15)',
  danger: 'rgba(255, 49, 49, 1)', // Red - now properly used
  dangerLight: 'rgba(255, 49, 49, 0.15)',
  success: 'rgba(76, 175, 80, 1)',
  background: '#FFFFFF',
  cardBackground: '#FFFFFF',
  border: '#E0E0E0', // Darker border for better visibility
  borderLight: '#F0F0F0',
  textPrimary: 'rgba(9, 68, 89, 1)',
  textSecondary: 'rgba(9, 68, 89, 0.7)',
  textMuted: '#999',
  inputBackground: '#F8F9FA',
  overlay: 'rgba(9, 68, 89, 0.08)',
  warning: 'rgba(255, 152, 0, 1)'
};

export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
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
  
      let imageUrl = productData.imageUrl;
  
      if (productData.imageUrl && (productData.imageUrl.startsWith('file:') || productData.imageUrl.startsWith('content:'))) {
        console.log('Uploading local image to ImgBB:', productData.imageUrl);
        
        const imgbbUrl = await uploadToImgBB(productData.imageUrl);
        if (imgbbUrl) {
          imageUrl = imgbbUrl;
          console.log('✅ Image uploaded to ImgBB:', imgbbUrl);
        } else {
          Alert.alert('Error', 'Failed to upload image to ImgBB. Please try again.');
          setUploading(false);
          return;
        }
      } else if (productData.imageUrl) {
        console.log('Image is already a URL:', productData.imageUrl);
      }
  
      const productToAdd = {
        name: productData.name,
        description: productData.description,
        price: parseFloat(productData.price),
        category: productData.category,
        stock: parseInt(productData.stock) || 0,
        imageUrl: imageUrl,
        shopId: user.uid,
        createdAt: serverTimestamp()
      };
  
      console.log('Saving product to Firestore with imageUrl:', imageUrl);
  
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
      Alert.alert("Error", "Failed to add product");
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProduct = async (productData: ProductFormData) => {
    if (!selectedProduct) return;
  
    try {
      setUploading(true);
      const productRef = doc(db, "products", selectedProduct.id);
      
      let imageUrl = productData.imageUrl || "";
      
      if (productData.imageUrl && (productData.imageUrl.startsWith('file:') || productData.imageUrl.startsWith('content:'))) {
        console.log('Uploading new local image to ImgBB:', productData.imageUrl);
        
        const imgbbUrl = await uploadToImgBB(productData.imageUrl);
        if (imgbbUrl) {
          imageUrl = imgbbUrl;
          console.log('✅ Image uploaded to ImgBB:', imgbbUrl);
        } else {
          imageUrl = selectedProduct.imageUrl || "";
          Alert.alert('Warning', 'Failed to upload new image, keeping previous image');
        }
      } else if (productData.imageUrl && productData.imageUrl.startsWith('https://i.ibb.co')) {
        console.log('Image is already ImgBB URL, keeping it');
        imageUrl = productData.imageUrl;
      } else {
        imageUrl = selectedProduct.imageUrl || "";
      }
      
      const updatedProduct = {
        name: productData.name,
        description: productData.description,
        price: parseFloat(productData.price),
        category: productData.category,
        stock: parseInt(productData.stock),
        imageUrl: imageUrl
      };
  
      console.log('Updating product with imageUrl:', imageUrl);
  
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

  // Enhanced Category Filters with better yellow accent
  const CategoryFilters = () => (
    <View style={styles.categoryContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScrollContent}
      >
        {CATEGORIES.map((category) => {
          const isActive = activeCategory === category.value;
          return (
            <TouchableOpacity
              key={category.value}
              style={[
                styles.categoryFilter,
                isActive && styles.activeCategoryFilter,
                isActive && styles.categoryFilterShadow
              ]}
              onPress={() => setActiveCategory(category.value)}
            >
              <View style={[
                styles.categoryIconContainer,
                isActive && styles.activeCategoryIconContainer
              ]}>
                <Ionicons 
                  name={category.icon as any} 
                  size={16} 
                  color={isActive ? COLORS.accent : COLORS.primary} 
                />
              </View>
              <Text
                style={[
                  styles.categoryFilterText,
                  isActive && styles.activeCategoryFilterText
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  // Enhanced Product Modal Component with better button styling
  const ProductModal = ({ isEdit = false, visible, onClose, onSubmit, newProduct, setNewProduct, pickImage, uploading }: {
    isEdit?: boolean;
    visible: boolean;
    onClose: () => void;
    onSubmit: (data: ProductFormData) => void;
    newProduct: ProductFormData;
    setNewProduct: (data: ProductFormData) => void;
    pickImage: () => void;
    uploading: boolean;
  }) => {
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
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleContainer}>
                  <Ionicons name="cube" size={24} color={COLORS.primary} style={styles.modalTitleIcon} />
                  <Text style={styles.modalTitle}>
                    {isEdit ? "Edit Product" : "Add New Product"}
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalScroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.label}>Product Image</Text>
                <TouchableOpacity style={styles.imagePicker} onPress={pickImage} disabled={uploading}>
                  {localProduct.imageUrl ? (
                    <View style={styles.imagePreviewContainer}>
                      <Image source={{ uri: localProduct.imageUrl }} style={styles.imagePreview} />
                      <View style={styles.imageOverlay}>
                        <Ionicons name="camera" size={24} color="#fff" />
                        <Text style={styles.imageOverlayText}>Change Image</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Ionicons name="camera" size={32} color={COLORS.textSecondary} />
                      <Text style={styles.imagePlaceholderText}>Tap to select image</Text>
                      <Text style={styles.imagePlaceholderSubtext}>Recommended: 4:3 ratio</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Product Name *</Text>
                  <TextInput
                    style={[styles.input, errors.name && styles.inputError]}
                    placeholder="Enter product name"
                    value={localProduct.name}
                    onChangeText={(text) => handleChange('name', text)}
                  />
                  {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Describe your product..."
                    value={localProduct.description}
                    onChangeText={(text) => handleChange('description', text)}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>Price *</Text>
                    <View style={styles.priceInputContainer}>
                      <Text style={styles.currencySymbol}>$</Text>
                      <TextInput
                        style={[styles.input, styles.priceInput, errors.price && styles.inputError]}
                        placeholder="0.00"
                        value={localProduct.price}
                        onChangeText={(text) => handleChange('price', text.replace(/[^0-9.]/g, ''))}
                        keyboardType="decimal-pad"
                      />
                    </View>
                    {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
                  </View>

                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.label}>Stock</Text>
                    <TextInput
                      style={[styles.input, errors.stock && styles.inputError]}
                      placeholder="0"
                      value={localProduct.stock}
                      onChangeText={(text) => handleChange('stock', text.replace(/[^0-9]/g, ''))}
                      keyboardType="numeric"
                    />
                    {errors.stock && <Text style={styles.errorText}>{errors.stock}</Text>}
                  </View>
                </View>

                <View style={styles.inputGroup}>
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
                        <Ionicons 
                          name={category.icon as any} 
                          size={16} 
                          color={localProduct.category.toLowerCase() === category.value.toLowerCase() ? COLORS.accent : COLORS.primary} 
                        />
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
                    <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} style={styles.buttonIcon} />
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.submitButton, uploading && styles.disabledButton]}
                    onPress={handleSubmit}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <>
                        <Ionicons 
                          name={isEdit ? "checkmark-circle" : "add-circle"} 
                          size={20} 
                          color="#fff" 
                          style={styles.buttonIcon}
                        />
                        <Text style={styles.submitButtonText}>
                          {isEdit ? "Update" : "Add Product"}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingAnimation}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading your products...</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {uploading && (
        <Modal transparent={true} animationType="fade">
          <View style={styles.loaderOverlay}>
            <View style={styles.loaderBox}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loaderText}>
                {editModalVisible ? "Updating product..." : "Adding product..."}
              </Text>
            </View>
          </View>
        </Modal>
      )}

      {/* E-commerce Style Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.push('/shopkeeper/home')}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>My Products</Text>
            <Text style={styles.headerSubtitle}>Manage your inventory</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setAddModalVisible(true)}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add New</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.headerStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{products.length}</Text>
            <Text style={styles.statLabel}>Total Products</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {products.filter(p => p.stock > 0).length}
            </Text>
            <Text style={styles.statLabel}>In Stock</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {products.filter(p => p.stock === 0).length}
            </Text>
            <Text style={styles.statLabel}>Out of Stock</Text>
          </View>
        </View>
      </View>

      {/* Enhanced Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products by name or description..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.textMuted}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Enhanced Category Filters */}
      <CategoryFilters />

      {/* Enhanced Products List */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIllustration}>
              <Ionicons name="cube-outline" size={80} color={COLORS.textMuted} />
            </View>
            <Text style={styles.emptyText}>
              {searchQuery || activeCategory !== "all"
                ? "No products match your search"
                : "No products yet"
              }
            </Text>
            <Text style={styles.emptySubText}>
              {searchQuery || activeCategory !== "all"
                ? "Try adjusting your search or filters"
                : "Start by adding your first product"
              }
            </Text>
            {!searchQuery && activeCategory === "all" && (
              <TouchableOpacity
                style={styles.addFirstButton}
                onPress={() => setAddModalVisible(true)}
              >
                <Ionicons name="add" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.addFirstButtonText}>Add First Product</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.productCard}>
            <View style={styles.productImageContainer}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
              ) : (
                <View style={styles.productImagePlaceholder}>
                  <Ionicons name="cube-outline" size={40} color={COLORS.textMuted} />
                </View>
              )}
              <View style={[
                styles.productBadge,
                item.stock === 0 && styles.outOfStockBadge
              ]}>
                <Text style={styles.productBadgeText}>
                  {item.stock === 0 ? "Out of Stock" : item.category}
                </Text>
              </View>
              {item.stock === 0 && (
                <View style={styles.outOfStockOverlay}>
                  <Text style={styles.outOfStockText}>Out of Stock</Text>
                </View>
              )}
            </View>
            
            <View style={styles.productContent}>
              <View style={styles.productHeader}>
                <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.productPrice}>${item.price}</Text>
              </View>
              
              <Text style={styles.productDescription} numberOfLines={2}>
                {item.description || "No description provided"}
              </Text>
              
              <View style={styles.productFooter}>
                <View style={styles.stockContainer}>
                  <Ionicons 
                    name="pricetag" 
                    size={14} 
                    color={item.stock > 0 ? COLORS.success : COLORS.danger} 
                  />
                  <Text style={[
                    styles.productStock,
                    item.stock === 0 && styles.outOfStockText
                  ]}>
                    {item.stock} in stock
                  </Text>
                </View>
                <View style={styles.productActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => openEditModal(item)}
                  >
                    <Ionicons name="create-outline" size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteProduct(item.id)}
                  >
                    <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
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
    backgroundColor: "#f8f9fa",
    marginTop: 27,
  },
  // Enhanced Header Styles - E-commerce style
  header: {
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  categoryContainer: {
    backgroundColor: COLORS.background,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoryScrollContent: {
    paddingHorizontal: 16,
  },
  categoryFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    backgroundColor: COLORS.inputBackground,
    borderRadius: 12,
    minWidth: 100,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeCategoryFilter: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryFilterShadow: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryIconContainer: {
    marginRight: 6,
    padding: 4,
    borderRadius: 6,
    backgroundColor: COLORS.accentLight,
  },
  activeCategoryIconContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  categoryFilterText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  activeCategoryFilterText: {
    color: '#fff',
    fontWeight: '700',
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  productCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  productImageContainer: {
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 180,
  },
  productImagePlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: COLORS.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  productBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  outOfStockBadge: {
    backgroundColor: COLORS.dangerLight,
    borderColor: COLORS.danger,
  },
  productBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,49,49,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    color: COLORS.danger,
    fontWeight: '600',
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
    color: COLORS.textPrimary,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  productDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productStock: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  productActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 10,
    borderRadius: 10,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  editButton: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  deleteButton: {
    backgroundColor: COLORS.dangerLight,
    borderColor: COLORS.danger,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIllustration: {
    padding: 20,
    backgroundColor: COLORS.inputBackground,
    borderRadius: 40,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyText: {
    fontSize: 20,
    color: COLORS.textSecondary,
    marginTop: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primaryDark,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addFirstButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(9, 68, 89, 0.6)',
    padding: 10,
    
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderRadius: 20,
    width: '99%',
    maxHeight: '99%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.primaryLight,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitleIcon: {
    marginRight: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  modalScroll: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: COLORS.textPrimary,
  },
  inputGroup: {
    marginBottom: 16,
  },
  imagePicker: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  imagePreviewContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlayText: {
    color: '#fff',
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  imagePlaceholderText: {
    marginTop: 8,
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  imagePlaceholderSubtext: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: COLORS.inputBackground,
    color: COLORS.textPrimary,
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  priceInput: {
    paddingLeft: 32,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    marginTop: 4,
  },
  modalCategoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  modalCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    margin: 4,
    backgroundColor: COLORS.inputBackground,
    borderRadius: 12,
    flex: 1,
    minWidth: '30%',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeModalCategoryButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  modalCategoryText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginLeft: 6,
  },
  activeModalCategoryText: {
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 8,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cancelButton: {
    backgroundColor: COLORS.inputBackground,
    borderColor: COLORS.border,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryDark,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: COLORS.textMuted,
    borderColor: COLORS.textMuted,
    shadowOpacity: 0,
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingAnimation: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  loaderOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 68, 89, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderBox: {
    backgroundColor: COLORS.background,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  loaderText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
} as const);