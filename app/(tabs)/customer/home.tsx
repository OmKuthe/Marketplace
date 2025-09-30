// import { useAuth } from '@/hooks/useAuth';
// import { conversationService } from '@/utils/conversationService';
// import { Ionicons } from '@expo/vector-icons';
// import * as ImagePicker from 'expo-image-picker';
// import { router } from 'expo-router';
// import { useRouter } from "expo-router";
// import { 
//   collection, 
//   doc, 
//   getDoc, 
//   getDocs, 
//   orderBy, 
//   query, 
//   addDoc,
//   updateDoc,
//   where,
//   limit,
//   startAfter,
//   Timestamp
// } from "firebase/firestore";
// import React, { useEffect, useRef, useState } from "react";
// import {
//   Animated,
//   Dimensions,
//   FlatList,
//   Image,
//   Modal,
//   SafeAreaView,
//   ScrollView,
//   Share,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
//   Alert,
//   ActivityIndicator,
//   RefreshControl
// } from "react-native";
// import { db, storage } from "../../../firebaseConfig";

// const { width } = Dimensions.get('window');

// // New color palette
// const colors = {
//   primary: '#405DE6',    // Instagram blue
//   secondary: '#E1306C',  // Instagram pink
//   background: '#FAFAFA', // Light background
//   surface: '#FFFFFF',    // White
//   textPrimary: '#262626',// Dark gray
//   textSecondary: '#8e8e8e', // Medium gray
//   border: '#dbdbdb',     // Light border
//   needCard: '#FFECE6',   // Soft orange for needs
//   offerCard: '#E6F3FF',  // Soft blue for offers
//   success: '#4CAF50',    // Green for success actions
// };

// // Define types
// type ShopkeeperData = {
//   uid: string;
//   email: string;
//   shopName: string;
//   ownerName: string;
//   location: string;
//   phone: string;
//   createdAt: any;
// };

// type Product = {
//   id: string;
//   name: string;
//   description: string;
//   price: number;
//   stock: number;
//   category: string;
//   type: string;
//   imageUrl?: string;
//   createdAt?: any;
//   shopkeeperId?: string;
//   shopId?: string;
// };

// // Customer Post Types
// type PostType = 'NEED' | 'OFFER';
// type PostStatus = 'ACTIVE' | 'FULFILLED' | 'EXPIRED';
// type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH';

// interface CustomerPost {
//   id: string;
//   customerId: string;
//   customerName: string;
//   customerEmail: string;
//   title: string;
//   description: string;
//   price?: number;
//   category: string;
//   type: PostType;
//   imageUrl?: string;
//   location: string;
//   status: PostStatus;
//   createdAt: any;
//   updatedAt: any;
//   tags: string[];
//   contactInfo: {
//     phone?: string;
//     email: string;
//     preferredContact: 'phone' | 'email' | 'message';
//   };
//   urgency: UrgencyLevel;
// }

// interface PostFilter {
//   type?: PostType;
//   category?: string;
//   minPrice?: number;
//   maxPrice?: number;
//   location?: string;
//   urgency?: string;
//   status?: string;
//   searchQuery?: string;
// }

// // Post API Functions

// // Post API Functions - Make sure imageUrl is included in the type
// const createCustomerPost = async (postData: Omit<CustomerPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
//   try {
//     const postWithTimestamps = {
//       ...postData,
//       createdAt: Timestamp.now(),
//       updatedAt: Timestamp.now(),
//       status: 'ACTIVE' as const
//     };

//     console.log('📤 Saving post to Firestore with imageUrl:', postWithTimestamps.imageUrl);
    
//     const docRef = await addDoc(collection(db, "customerPosts"), postWithTimestamps);
    
//     console.log('✅ Post saved with ID:', docRef.id);
//     return docRef.id;
//   } catch (error) {
//     console.error('Error creating post:', error);
//     throw new Error('Failed to create post');
//   }
// };
// // Replace the current uploadPostImage function with this:
// const uploadPostImage = async (imageUri: string): Promise<string | undefined> => {
//   try {
//     console.log('Starting ImgBB upload for post image:', imageUri);
    
//     const IMGBB_API_KEY = '2e6117c9d92bf16f23690049db98971d';
    
//     // Create form data
//     const formData = new FormData();
    
//     // @ts-ignore - React Native FormData handling
//     formData.append('image', {
//       uri: imageUri,
//       type: 'image/jpeg',
//       name: 'post_image.jpg',
//     });

//     console.log('Sending request to ImgBB...');
    
//     const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
//       method: 'POST',
//       body: formData,
//       headers: {
//         'Content-Type': 'multipart/form-data',
//       },
//     });

//     const data = await response.json();
//     console.log('ImgBB response for post:', data);
    
//     if (data.success) {
//       console.log('✅ Post image uploaded to ImgBB:', data.data.url);
//       return data.data.url; // Returns string
//     } else {
//       console.error('❌ ImgBB upload failed for post:', data);
//       return undefined; // Returns undefined instead of null
//     }
//   } catch (error) {
//     console.error('❌ Error uploading post image to ImgBB:', error);
//     return undefined; // Returns undefined instead of null
//   }
// };

// // Enhanced function to fetch customer posts with better error handling
// // Enhanced function to fetch customer posts with better user data fetching
// const getCustomerPosts = async (
//   filters: PostFilter = {}
// ): Promise<{ posts: CustomerPost[]; lastVisible: any }> => {
//   try {
//     console.log('🔍 Fetching customer posts with filters:', filters);
    
//     let q = query(collection(db, "customerPosts"), orderBy('createdAt', 'desc'));

//     console.log('📝 Query created, executing...');

//     const snapshot = await getDocs(q);
//     console.log('✅ Query executed, found documents:', snapshot.size);

//     const posts: CustomerPost[] = [];
    
//     for (const postDoc of snapshot.docs) {
//       const data = postDoc.data();
      
//       console.log('📄 Processing post:', postDoc.id, 'Customer ID:', data.customerId);
//       console.log('📄 Current customerName from post:', data.customerName);
      
//       let customerName = data.customerName;
//       let customerEmail = data.customerEmail;
      
//       // Fetch customer data from the "customers" collection
//       if (data.customerId) {
//         try {
//           console.log('👤 Fetching customer data from customers collection for customerId:', data.customerId);
//           const customerDocRef = doc(db, "customers", data.customerId);
//           const customerDoc = await getDoc(customerDocRef);
          
//           if (customerDoc.exists()) {
//             const customerData = customerDoc.data();
//             console.log('✅ Customer data found:', customerData);
            
//             // Try different possible field names for customer name
//             customerName = customerData.fullName || 
//                           customerData.name || 
//                           customerData.displayName || 
//                           customerData.username || 
//                           customerData.firstName || 
//                           data.customerName || 
//                           'Anonymous Customer';
            
//             customerEmail = customerData.email || data.customerEmail || '';
            
//             console.log('👤 Final customerName from customers collection:', customerName);
//             console.log('📧 Final customerEmail:', customerEmail);
//           } else {
//             console.log('❌ Customer document not found in customers collection for customerId:', data.customerId);
//             // If customer document doesn't exist, use what's in the post or fallback
//             customerName = data.customerName || 'Anonymous Customer';
//           }
//         } catch (customerError) {
//           console.log('⚠️ Could not fetch customer data for post:', postDoc.id, customerError);
//           // If there's an error, use what's already in the post data
//           customerName = data.customerName || 'Anonymous Customer';
//         }
//       } else {
//         console.log('❌ No customerId found in post data');
//         customerName = data.customerName || 'Anonymous Customer';
//       }
      
//       // Create the post object
//       const post: CustomerPost = {
//         id: postDoc.id,
//         customerId: data.customerId || '',
//         customerName: customerName,
//         customerEmail: customerEmail,
//         title: data.title || '',
//         description: data.description || '',
//         price: data.price,
//         category: data.category || 'General',
//         type: data.type || 'NEED',
//         imageUrl: data.imageUrl,
//         location: data.location || 'Unknown Location',
//         status: data.status || 'ACTIVE',
//         createdAt: data.createdAt,
//         updatedAt: data.updatedAt,
//         tags: data.tags || [],
//         contactInfo: data.contactInfo || { 
//           email: customerEmail, 
//           preferredContact: 'message' as const 
//         },
//         urgency: data.urgency || 'MEDIUM'
//       };

//       posts.push(post);
//       console.log('✅ Added post to array. Customer:', post.customerName);
//     }

//     console.log('📦 Final posts array length:', posts.length);
//     console.log('👥 Customer names in posts:', posts.map(p => p.customerName));
    
//     return { posts, lastVisible: null };
//   } catch (error) {
//     console.error('❌ Error fetching posts:', error);
//     return { posts: [], lastVisible: null };
//   }
// };



// const updateCustomerPost = async (postId: string, updates: Partial<CustomerPost>): Promise<void> => {
//   try {
//     const postRef = doc(db, "customerPosts", postId);
//     await updateDoc(postRef, {
//       ...updates,
//       updatedAt: Timestamp.now()
//     });
//   } catch (error) {
//     console.error('Error updating post:', error);
//     throw new Error('Failed to update post');
//   }
// };

// // Animated Product Card Component
// const AnimatedProductCard = ({ 
//   item, 
//   index, 
//   shopkeeperData,
//   onMessagePress 
// }: { 
//   item: Product; 
//   index: number; 
//   shopkeeperData: ShopkeeperData | null;
//   onMessagePress: (product: Product) => void;
// }) => {
//   const fadeAnim = useRef(new Animated.Value(0)).current;
//   const scaleAnim = useRef(new Animated.Value(0.9)).current;
//   const [saved, setSaved] = useState(false);
  
//   useEffect(() => {
//     Animated.parallel([
//       Animated.timing(fadeAnim, {
//         toValue: 1,
//         duration: 600,
//         delay: index * 100,
//         useNativeDriver: true,
//       }),
//       Animated.spring(scaleAnim, {
//         toValue: 1,
//         friction: 7,
//         tension: 40,
//         delay: index * 100,
//         useNativeDriver: true,
//       })
//     ]).start();
//   }, []);

//   const handleSave = () => {
//     setSaved(!saved);
//   };

//   const handleShare = async () => {
//     try {
//       await Share.share({
//         message: `Check out this product: ${item.name} - ${item.description}`,
//         title: item.name,
//       });
//     } catch (error) {
//       console.error('Error sharing:', error);
//     }
//   };

//   return (
//     <Animated.View 
//       style={[
//         styles.instagramCard,
//         {
//           opacity: fadeAnim,
//           transform: [{ scale: scaleAnim }]
//         }
//       ]}
//     >
//       <View style={styles.cardHeader}>
//         <View style={styles.userInfo}>
//           <Image 
//             source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }} 
//             style={styles.avatar}
//           />
//           <View>
//             <Text style={styles.username}>
//               {shopkeeperData?.shopName || 'Unknown Shop'}
//             </Text>
//             <Text style={styles.userLocation}>
//               {shopkeeperData?.location || 'Unknown Location'}
//             </Text>
//           </View>
//         </View>
//         <TouchableOpacity onPress={handleSave}>
//           <Ionicons 
//             name={saved ? "bookmark" : "bookmark-outline"} 
//             size={24} 
//             color={saved ? colors.primary : colors.textPrimary} 
//           />
//         </TouchableOpacity>
//       </View>
      
//       <Image 
//         source={{ uri: item.imageUrl || 'https://via.placeholder.com/400x300' }} 
//         style={styles.productImage}
//         resizeMode="cover"
//       />
      
//       <View style={styles.cardFooter}>
//         <View style={styles.actionButtons}> 
//           <TouchableOpacity 
//             style={styles.orderButton}
//             onPress={() => {
//               const shopkeeperId = (item as any).shopId || (item as any).shopkeeperID || (item as any).shopkeeper;
//               router.push({
//                 pathname: '../orders/order-now',
//                 params: { 
//                   product: JSON.stringify({
//                     id: item.id,
//                     name: item.name,
//                     price: item.price,
//                     imageUrl: item.imageUrl,
//                     shopName: shopkeeperData?.shopName || 'Local Store',
//                     shopId: shopkeeperId || 'shop-001',
//                     description: item.description,
//                     stock: item.stock
//                   })
//                 }
//               });
//             }}
//           >
//             <Ionicons name="cart" size={20} color="white" />
//             <Text style={styles.orderButtonText}>Order Now</Text>
//           </TouchableOpacity>
//           <TouchableOpacity 
//             style={styles.messageButton}
//             onPress={() => onMessagePress(item)}
//           >
//             <Ionicons name="chatbubble-ellipses" size={20} color={colors.primary} />
//             <Text style={styles.messageButtonText}>Message</Text>
//           </TouchableOpacity>
//           <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
//             <Ionicons name="share-social" size={20} color={colors.textPrimary} />
//           </TouchableOpacity>
//         </View>
        
//         <View style={styles.productDetails}>
//           <Text style={styles.productName}>{item.name}</Text>
//           <Text style={styles.productDescription} numberOfLines={2}>
//             {item.description}
//           </Text>
//           <View style={styles.priceStockContainer}>
//             <Text style={styles.productPrice}>💰 ${item.price}</Text>
//             <Text style={styles.productStock}>📦 {item.stock} in stock</Text>
//           </View>
//           <Text style={styles.productCategory}>#{item.category}</Text>
//         </View>
        
//         {item.createdAt?.seconds && (
//           <Text style={styles.timestamp}>
//             {new Date(item.createdAt.seconds * 1000).toLocaleDateString()}
//           </Text>
//         )}
//       </View>
//     </Animated.View>
//   );
// };

// // Customer Post Card Component
// const CustomerPostCard = ({ 
//   item, 
//   index,
//   onContactPress
// }: { 
//   item: CustomerPost; 
//   index: number;
//   onContactPress: (post: CustomerPost) => void;
// }) => {
//   const fadeAnim = useRef(new Animated.Value(0)).current;
//   const scaleAnim = useRef(new Animated.Value(0.9)).current;
//   const [saved, setSaved] = useState(false);

//   useEffect(() => {
//     Animated.parallel([
//       Animated.timing(fadeAnim, {
//         toValue: 1,
//         duration: 600,
//         delay: index * 100,
//         useNativeDriver: true,
//       }),
//       Animated.spring(scaleAnim, {
//         toValue: 1,
//         friction: 7,
//         tension: 40,
//         delay: index * 100,
//         useNativeDriver: true,
//       })
//     ]).start();
//   }, []);

//   const getPostColor = () => {
//     return item.type === 'NEED' ? colors.needCard : colors.offerCard;
//   };

//   const getTypeIcon = () => {
//     return item.type === 'NEED' ? 'help-circle' : 'gift';
//   };

//   const getTypeColor = () => {
//     return item.type === 'NEED' ? '#FF6B35' : '#405DE6';
//   };

//   const handleSave = () => {
//     setSaved(!saved);
//   };

//   const handleShare = async () => {
//     try {
//       await Share.share({
//         message: `${item.type === 'NEED' ? 'Looking for' : 'Offering'}: ${item.title} - ${item.description} | Price: ${item.price ? `₹${item.price}` : 'Negotiable'} | Location: ${item.location}`,
//         title: item.title,
//       });
//     } catch (error) {
//       console.error('Error sharing:', error);
//     }
//   };

//   const formatDate = (timestamp: any) => {
//     if (!timestamp) return 'Recent';
//     try {
//       const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
//       return date.toLocaleDateString('en-IN', {
//         day: 'numeric',
//         month: 'short',
//         year: 'numeric'
//       });
//     } catch (error) {
//       return 'Recent';
//     }
//   };

//   return (
//     <Animated.View 
//       style={[
//         styles.postCard,
//         {
//           opacity: fadeAnim,
//           transform: [{ scale: scaleAnim }],
//           backgroundColor: getPostColor()
//         }
//       ]}
//     >
//       <View style={styles.postHeader}>
//         <View style={styles.postUserInfo}>
//           <View style={[styles.postAvatar, { backgroundColor: getTypeColor() }]}>
//             <Ionicons name={getTypeIcon()} size={16} color="white" />
//           </View>
//           <View>
//             <Text style={styles.postUsername}>{item.customerName}</Text>
//             <Text style={[styles.postType, { color: getTypeColor() }]}>
//               {item.type} • {item.category}
//             </Text>
//           </View>
//         </View>
//         <View style={styles.postHeaderActions}>
//           <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
//             <Ionicons 
//               name={saved ? "bookmark" : "bookmark-outline"} 
//               size={20} 
//               color={saved ? colors.primary : colors.textSecondary} 
//             />
//           </TouchableOpacity>
//           <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
//             <Ionicons name="share-outline" size={20} color={colors.textSecondary} />
//           </TouchableOpacity>
//         </View>
//       </View>

//       <View style={styles.urgencyContainer}>
//         <View style={[styles.urgencyBadge, { 
//           backgroundColor: item.urgency === 'HIGH' ? '#FF6B6B' : 
//                           item.urgency === 'MEDIUM' ? '#FFD93D' : '#6BCF7F' 
//         }]}>
//           <Text style={styles.urgencyText}>{item.urgency} URGENCY</Text>
//         </View>
//       </View>

//       {/* Improved Image Display */}
//       {item.imageUrl ? (
//         <Image 
//           source={{ uri: item.imageUrl }} 
//           style={styles.postImage}
//           resizeMode="cover"
//           onError={(error) => console.log('❌ Image load error:', error.nativeEvent.error)}
//         />
//       ) : (
//         <View style={styles.noImagePlaceholder}>
//           <Ionicons name="image-outline" size={40} color={colors.textSecondary} />
//           <Text style={styles.noImageText}>No Image</Text>
//         </View>
//       )}

//       <View style={styles.postContent}>
//         <Text style={styles.postTitle}>{item.title}</Text>
//         <Text style={styles.postDescription}>{item.description}</Text>
        
//         <View style={styles.postDetails}>
//           {item.price && (
//             <Text style={styles.postPrice}>💰 ₹{item.price}</Text>
//           )}
//           <Text style={styles.postLocation}>📍 {item.location}</Text>
//         </View>
        
//         {item.tags && item.tags.length > 0 && (
//           <View style={styles.tagsContainer}>
//             {item.tags.slice(0, 3).map((tag, index) => (
//               <View key={index} style={styles.tag}>
//                 <Text style={styles.tagText}>#{tag}</Text>
//               </View>
//             ))}
//           </View>
//         )}
        
//         <View style={styles.postMeta}>
//           <Text style={styles.postDate}>
//             {formatDate(item.createdAt)}
//           </Text>
//           <Text style={styles.postStatus}>
//             • {item.status}
//           </Text>
//         </View>
//       </View>

//       <View style={styles.postActions}>
//         <TouchableOpacity 
//           style={styles.contactButton}
//           onPress={() => onContactPress(item)}
//         >
//           <Ionicons 
//             name="chatbubble-ellipses" 
//             size={18} 
//             color={colors.primary} 
//           />
//           <Text style={styles.contactButtonText}>Contact</Text>
//         </TouchableOpacity>
        
//         <TouchableOpacity style={styles.moreButton}>
//           <Ionicons name="ellipsis-horizontal" size={18} color={colors.textSecondary} />
//         </TouchableOpacity>
//       </View>
//     </Animated.View>
//   );
// };

// export default function CustomerHome() {
//   const [products, setProducts] = useState<Product[]>([]);
//   const [customerPosts, setCustomerPosts] = useState<CustomerPost[]>([]);
//   const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
//   const [shopkeeperData, setShopkeeperData] = useState<{[key: string]: ShopkeeperData}>({});
//   const [activeTab, setActiveTab] = useState<"all" | "need" | "offer" | "customer-posts">("all");
//   const [sidePanelVisible, setSidePanelVisible] = useState(false);
//   const [createPostModalVisible, setCreatePostModalVisible] = useState(false);
//   const router = useRouter();
//   const { user } = useAuth();
  
//   const [newPost, setNewPost] = useState({
//     title: "",
//     description: "",
//     price: "",
//     category: "",
//     type: "NEED" as PostType,
//     image: null as string | null,
//     location: "",
//     urgency: "MEDIUM" as UrgencyLevel,
//   });
  
//   const [activeFilter, setActiveFilter] = useState<PostFilter>({});
//   const [lastVisible, setLastVisible] = useState<any>(null);
//   const [loadingPosts, setLoadingPosts] = useState(false);
//   const [creatingPost, setCreatingPost] = useState(false);
//   const [refreshing, setRefreshing] = useState(false);

//   // Extract products fetching logic into a separate function
// // Extract products fetching logic into a separate function
// const fetchProductsAndShopkeepers = async () => {
//   try {
//     console.log('🔄 Refreshing products...');
//     const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
//     const snapshot = await getDocs(q);
//     const data = snapshot.docs.map((doc) => ({
//       id: doc.id,
//       ...doc.data(),
//     })) as Product[];
    
//     setProducts(data);
//     setFilteredProducts(data);

//     const shopkeeperMap: {[key: string]: ShopkeeperData} = {};
//     for (const product of data) {
//       const shopkeeperId = (product as any).shopId || (product as any).shopkeeperID || (product as any).shopkeeper;
//       if (shopkeeperId && !shopkeeperMap[shopkeeperId]) {
//         try {
//           const shopkeeperDoc = await getDoc(doc(db, "shopkeepers", shopkeeperId));
//           if (shopkeeperDoc.exists()) {
//             shopkeeperMap[shopkeeperId] = {
//               uid: shopkeeperId,
//               ...shopkeeperDoc.data()
//             } as ShopkeeperData;
//           }
//         } catch (error) {
//           console.error("Error fetching shopkeeper:", error);
//         }
//       }
//     }
//     setShopkeeperData(shopkeeperMap);
    
//     console.log('✅ Products refreshed successfully');
//   } catch (err) {
//     console.log("Error refreshing products:", err);
//   }
// };

//   const fetchCustomerPosts = async (filters: PostFilter = {}) => {
//     try {
//       console.log('🚀 Starting to fetch customer posts...');
//       setLoadingPosts(true);
//       const result = await getCustomerPosts(filters);
      
//       console.log('📊 Fetch result:', result);
      
//       setCustomerPosts(result.posts);
//       setLastVisible(null); // No pagination
      
//       console.log('✅ Posts set to state, count:', result.posts.length);
//     } catch (error) {
//       console.error('❌ Error in fetchCustomerPosts:', error);
//       Alert.alert('Error', 'Failed to load posts');
//     } finally {
//       setLoadingPosts(false);
//     }
//   };

//   // Refresh function for pull-to-refresh
//   const onRefresh = async () => {
//     setRefreshing(true);
//     await fetchCustomerPosts(activeFilter);
//     setRefreshing(false);
//   };

//   const handleCreatePost = async () => {
//     if (!user) {
//       Alert.alert('Error', 'Please log in to create a post');
//       return;
//     }
  
//     if (!newPost.title.trim() || !newPost.description.trim()) {
//       Alert.alert('Error', 'Please fill in title and description');
//       return;
//     }
  
//     try {
//       setCreatingPost(true);
      
//       // Fetch user data from Firestore users collection
//       let customerName = 'Anonymous Customer';
//       let customerEmail = user.email || '';
  
//       try {
//         console.log('👤 Fetching customer data for:', user.uid);
//         const customerDocRef = doc(db, "customers", user.uid);
//         const customerDoc = await getDoc(customerDocRef);
        
//         if (customerDoc.exists()) {
//           const customerData = customerDoc.data();
//           console.log('✅ Customer data found:', customerData);
          
//           // Try all possible name fields in customers collection
//           customerName = customerData.fullName || 
//                         customerData.customerName || 
//                         user.displayName || 
//                         'Anonymous Customer';
          
//           customerEmail = customerData.email || user.email || '';
          
//           console.log('✅ Customer data fetched - Name:', customerName, 'Email:', customerEmail);
//         } else {
//           console.log('❌ Customer document not found in customers collection, using displayName');
//           customerName = user.displayName || 'Anonymous Customer';
//         }
//       } catch (customerError) {
//         console.log('⚠️ Could not fetch customer data:', customerError);
//         customerName = user.displayName || 'Anonymous Customer';
//       }
  
//       let imageUrl: string | undefined = undefined; // Change to undefined instead of null
  
//       // Upload image to ImgBB FIRST, before creating the post
//       if (newPost.image) {
//         try {
//           console.log('🖼️ Uploading post image to ImgBB...');
//           const uploadedUrl = await uploadPostImage(newPost.image);
          
//           if (uploadedUrl) {
//             imageUrl = uploadedUrl; // This is now string | undefined
//             console.log('✅ Post image uploaded successfully:', imageUrl);
//           } else {
//             console.warn('⚠️ Image upload failed, creating post without image');
//           }
//         } catch (imageError) {
//           console.warn('⚠️ Image upload failed, but post will be created:', imageError);
//         }
//       }
  
//       // Create the post data WITH the image URL
//       const postData = {
//         customerId: user.uid,
//         customerName: customerName,
//         customerEmail: customerEmail,
//         title: newPost.title,
//         description: newPost.description,
//         price: newPost.price ? parseFloat(newPost.price) : undefined,
//         category: newPost.category || 'General',
//         type: newPost.type,
//         imageUrl: imageUrl, // This matches the CustomerPost interface (string | undefined)
//         location: newPost.location || 'Unknown Location',
//         urgency: newPost.urgency,
//         status: 'ACTIVE' as PostStatus,
//         contactInfo: {
//           email: customerEmail,
//           preferredContact: 'message' as const
//         },
//         tags: newPost.category ? [newPost.category.toLowerCase()] : ['general'],
//       };
  
//       console.log('📝 Creating post with data (including imageUrl):', postData);
//       const postId = await createCustomerPost(postData);
//       console.log('✅ Post created with ID:', postId);
  
//       Alert.alert('Success', 'Post created successfully!');
      
//       setCreatePostModalVisible(false);
//       setNewPost({
//         title: "",
//         description: "",
//         price: "",
//         category: "",
//         type: "NEED",
//         image: null,
//         location: "",
//         urgency: "MEDIUM",
//       });
      
//       // Refresh posts
//       fetchCustomerPosts(activeFilter);
      
//     } catch (error) {
//       console.error('Error creating post:', error);
//       Alert.alert('Error', 'Failed to create post. Please try again.');
//     } finally {
//       setCreatingPost(false);
//     }
//   };

//   const pickImage = async () => {
//     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (status !== 'granted') {
//       alert('Sorry, we need camera roll permissions to make this work!');
//       return;
//     }

//     let result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       allowsEditing: true,
//       aspect: [4, 3],
//       quality: 1,
//     });

//     if (!result.canceled) {
//       setNewPost({...newPost, image: result.assets[0].uri});
//     }
//   };

//   const handleContactPost = (post: CustomerPost) => {
//     if (!user) {
//       Alert.alert('Error', 'Please log in to contact the poster');
//       return;
//     }

//     Alert.alert(
//       'Contact Poster',
//       `Would you like to contact ${post.customerName} about their ${post.type.toLowerCase()}?`,
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { 
//           text: 'Message', 
//           onPress: () => {
//             // Navigate to chat or show contact options
//             Alert.alert('Contact', `Email: ${post.contactInfo.email}\nPreferred contact: ${post.contactInfo.preferredContact}`);
//           }
//         }
//       ]
//     );
//   };

//   const handleMessageButton = async (product: Product) => {
//     if (!user) {
//       alert('Please log in to send messages');
//       return;
//     }

//     try {
//       const shopkeeperId = (product as any).shopId || (product as any).shopkeeperID || (product as any).shopkeeper;
      
//       if (!shopkeeperId) {
//         alert('Unable to identify the shopkeeper');
//         return;
//       }

//       alert('Starting conversation...');
//       const conversationId = await conversationService.findOrCreateConversation(user.uid, shopkeeperId);
//       await conversationService.sendInitialMessage(conversationId, user.uid, product);
//       router.push(`/chat/${conversationId}`);
      
//     } catch (error) {
//       console.error('Error starting conversation:', error);
//       alert('Failed to start conversation. Please try again.');
//     }
//   };

//   // Fetch products and shopkeepers
//   useEffect(() => {
//     const fetchProductsAndShopkeepers = async () => {
//       try {
//         const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
//         const snapshot = await getDocs(q);
//         const data = snapshot.docs.map((doc) => ({
//           id: doc.id,
//           ...doc.data(),
//         })) as Product[];
        
//         setProducts(data);
//         setFilteredProducts(data);

//         const shopkeeperMap: {[key: string]: ShopkeeperData} = {};
//         for (const product of data) {
//           const shopkeeperId = (product as any).shopId || (product as any).shopkeeperID || (product as any).shopkeeper;
//           if (shopkeeperId && !shopkeeperMap[shopkeeperId]) {
//             try {
//               const shopkeeperDoc = await getDoc(doc(db, "shopkeepers", shopkeeperId));
//               if (shopkeeperDoc.exists()) {
//                 shopkeeperMap[shopkeeperId] = {
//                   uid: shopkeeperId,
//                   ...shopkeeperDoc.data()
//                 } as ShopkeeperData;
//               }
//             } catch (error) {
//               console.error("Error fetching shopkeeper:", error);
//             }
//           }
//         }
//         setShopkeeperData(shopkeeperMap);
//       } catch (err) {
//         console.log("Error fetching products:", err);
//       }
//     };

//     fetchProductsAndShopkeepers();
//     fetchCustomerPosts(); // Load customer posts on mount
//   }, []);

//   useEffect(() => {
//     if (activeTab === "all") {
//       setFilteredProducts(products);
//     } else if (activeTab === "customer-posts") {
//       // Customer posts are handled separately
//     } else {
//       setFilteredProducts(products.filter(product => product.type === activeTab.toUpperCase()));
//     }
//   }, [activeTab, products]);

//   const applyFilter = (filter: PostFilter) => {
//     const newFilter = { ...activeFilter, ...filter };
//     setActiveFilter(newFilter);
//     fetchCustomerPosts(newFilter);
//   };

//   const FilterBar = () => (
//     <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
//       <TouchableOpacity 
//         style={[styles.filterButton, activeFilter.type === undefined && styles.activeFilterButton]}
//         onPress={() => applyFilter({ type: undefined })}
//       >
//         <Text style={styles.filterButtonText}>All Posts</Text>
//       </TouchableOpacity>
//       <TouchableOpacity 
//         style={[styles.filterButton, activeFilter.type === 'NEED' && styles.activeFilterButton]}
//         onPress={() => applyFilter({ type: 'NEED' })}
//       >
//         <Text style={styles.filterButtonText}>Needs</Text>
//       </TouchableOpacity>
//       <TouchableOpacity 
//         style={[styles.filterButton, activeFilter.type === 'OFFER' && styles.activeFilterButton]}
//         onPress={() => applyFilter({ type: 'OFFER' })}
//       >
//         <Text style={styles.filterButtonText}>Offers</Text>
//       </TouchableOpacity>
//       <TouchableOpacity 
//         style={[styles.filterButton, activeFilter.urgency === 'HIGH' && styles.activeFilterButton]}
//         onPress={() => applyFilter({ urgency: 'HIGH' })}
//       >
//         <Text style={styles.filterButtonText}>Urgent</Text>
//       </TouchableOpacity>
//     </ScrollView>
//   );

//   const SidePanel = () => (
//     <View style={styles.sidePanel}>
//       <TouchableOpacity style={styles.sidePanelClose} onPress={() => setSidePanelVisible(false)}>
//         <Ionicons name="close" size={24} color={colors.textPrimary} />
//       </TouchableOpacity>
      
//       <View style={styles.sidePanelHeader}>
//         <Text style={styles.sidePanelTitle}>Menu</Text>
//       </View>
      
//       {['Home', 'Search', 'Messages', 'Orders', 'Profile'].map((item) => (
//         <TouchableOpacity key={item} style={styles.menuItem} onPress={() => setSidePanelVisible(false)}>
//           <Ionicons name={
//             item === 'Home' ? 'home' : 
//             item === 'Search' ? 'search' : 
//             item === 'Messages' ? 'chatbubbles' : 
//             item === 'Orders' ? 'list' : 'person'
//           } size={22} color={colors.primary} />
//           <Text style={styles.menuItemText}>{item}</Text>
//         </TouchableOpacity>
//       ))}
//     </View>
//   );

// const renderContent = () => {
//   console.log('🎯 Active Tab:', activeTab);
//   console.log('📋 All Customer Posts Count:', customerPosts.length);
//   console.log('📦 Filtered Products Count:', filteredProducts.length);

//   // Common refresh function for all tabs
//   const handleRefresh = async () => {
//     setRefreshing(true);
    
//     if (activeTab === "need" || activeTab === "offer") {
//       // Refresh customer posts
//       await fetchCustomerPosts(activeFilter);
//     } else {
//       // Refresh products
//       await fetchProductsAndShopkeepers();
//     }
    
//     setRefreshing(false);
//   };

//   if (activeTab === "need") {
//     // Filter and show only NEED posts
//     const needPosts = customerPosts.filter(post => post.type === 'NEED');
//     console.log('🔄 Rendering NEED posts:', needPosts.length);
    
//     return (
//       <FlatList
//         data={needPosts}
//         keyExtractor={(item) => item.id}
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={{ paddingBottom: 25 }}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={handleRefresh}
//             colors={[colors.primary]}
//           />
//         }
//         renderItem={({ item, index }) => {
//           console.log('🎨 Rendering NEED post:', item.id, item.title);
//           return (
//             <CustomerPostCard 
//               item={item} 
//               index={index} 
//               onContactPress={handleContactPost}
//             />
//           );
//         }}
//         ListEmptyComponent={
//           <View style={styles.emptyState}>
//             <Ionicons name="document-text-outline" size={64} color={colors.textSecondary} />
//             <Text style={styles.emptyStateText}>No needs posted yet</Text>
//             <Text style={styles.emptyStateSubtext}>Be the first to post what you need!</Text>
//             <TouchableOpacity 
//               style={styles.createFirstPostButton}
//               onPress={() => setCreatePostModalVisible(true)}
//             >
//               <Text style={styles.createFirstPostText}>Post Your Need</Text>
//             </TouchableOpacity>
//           </View>
//         }
//         ListFooterComponent={
//           loadingPosts ? (
//             <View style={styles.loadingMore}>
//               <ActivityIndicator size="small" color={colors.primary} />
//               <Text style={styles.loadingText}>Loading more posts...</Text>
//             </View>
//           ) : null
//         }
//         onEndReached={() => {
//           if (lastVisible && !loadingPosts) {
//             fetchCustomerPosts(activeFilter);
//           }
//         }}
//         onEndReachedThreshold={0.5}
//       />
//     );
//   }

//   if (activeTab === "offer") {
//     // Filter and show only OFFER posts
//     const offerPosts = customerPosts.filter(post => post.type === 'OFFER');
//     console.log('🔄 Rendering OFFER posts:', offerPosts.length);
    
//     return (
//       <FlatList
//         data={offerPosts}
//         keyExtractor={(item) => item.id}
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={{ paddingBottom: 25 }}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={handleRefresh}
//             colors={[colors.primary]}
//           />
//         }
//         renderItem={({ item, index }) => {
//           console.log('🎨 Rendering OFFER post:', item.id, item.title);
//           return (
//             <CustomerPostCard 
//               item={item} 
//               index={index} 
//               onContactPress={handleContactPost}
//             />
//           );
//         }}
//         ListEmptyComponent={
//           <View style={styles.emptyState}>
//             <Ionicons name="gift-outline" size={64} color={colors.textSecondary} />
//             <Text style={styles.emptyStateText}>No offers posted yet</Text>
//             <Text style={styles.emptyStateSubtext}>Be the first to offer something!</Text>
//             <TouchableOpacity 
//               style={styles.createFirstPostButton}
//               onPress={() => {
//                 setNewPost(prev => ({ ...prev, type: "OFFER" }));
//                 setCreatePostModalVisible(true);
//               }}
//             >
//               <Text style={styles.createFirstPostText}>Post Your Offer</Text>
//             </TouchableOpacity>
//           </View>
//         }
//         ListFooterComponent={
//           loadingPosts ? (
//             <View style={styles.loadingMore}>
//               <ActivityIndicator size="small" color={colors.primary} />
//               <Text style={styles.loadingText}>Loading more posts...</Text>
//             </View>
//           ) : null
//         }
//         onEndReached={() => {
//           if (lastVisible && !loadingPosts) {
//             fetchCustomerPosts(activeFilter);
//           }
//         }}
//         onEndReachedThreshold={0.5}
//       />
//     );
//   }

//   // For "all" tab, show products with refresh control
//   console.log('🔄 Rendering products for ALL tab:', activeTab);
//   return (
//     <FlatList
//       data={filteredProducts}
//       keyExtractor={(item) => item.id}
//       showsVerticalScrollIndicator={false}
//       contentContainerStyle={{ paddingBottom: 25 }}
//       refreshControl={
//         <RefreshControl
//           refreshing={refreshing}
//           onRefresh={handleRefresh}
//           colors={[colors.primary]}
//         />
//       }
//       renderItem={({ item, index }) => {
//         const shopkeeperId = (item as any).shopId || (item as any).shopkeeperID || (item as any).shopkeeper;
//         const shopkeeper = shopkeeperId ? shopkeeperData[shopkeeperId] : null;
        
//         return (
//           <AnimatedProductCard 
//             item={item} 
//             index={index} 
//             shopkeeperData={shopkeeper}
//             onMessagePress={handleMessageButton}
//           />
//         );
//       }}
//       ListEmptyComponent={
//         <View style={styles.emptyState}>
//           <Ionicons name="cube-outline" size={64} color={colors.textSecondary} />
//           <Text style={styles.emptyStateText}>No products available</Text>
//           <Text style={styles.emptyStateSubtext}>Check back later for new products</Text>
//         </View>
//       }
//     />
//   );
// };
//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => setSidePanelVisible(true)}>
//           <Ionicons name="menu" size={28} color={colors.textPrimary} />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>🛒 Customer Dashboard</Text>
//         <TouchableOpacity style={styles.createButton} onPress={() => setCreatePostModalVisible(true)}>
//           <Ionicons name="add-circle" size={26} color={colors.primary} />
//         </TouchableOpacity>
//       </View>

//       {sidePanelVisible && <SidePanel />}

//       <View style={styles.tabContainer}>
//         <TouchableOpacity 
//           style={[styles.tab, activeTab === "all" && styles.activeTab]}
//           onPress={() => setActiveTab("all")}
//         >
//           <Text style={[styles.tabText, activeTab === "all" && styles.activeTabText]}>All Products</Text>
//         </TouchableOpacity>
//         <TouchableOpacity 
//           style={[styles.tab, activeTab === "need" && styles.activeTab]}
//           onPress={() => setActiveTab("need")}
//         >
//           <Text style={[styles.tabText, activeTab === "need" && styles.activeTabText]}>Needs</Text>
//         </TouchableOpacity>
//         <TouchableOpacity 
//           style={[styles.tab, activeTab === "offer" && styles.activeTab]}
//           onPress={() => setActiveTab("offer")}
//         >
//           <Text style={[styles.tabText, activeTab === "offer" && styles.activeTabText]}>Offers</Text>
//         </TouchableOpacity>
//       </View>

//       {activeTab === "customer-posts" && <FilterBar />}

//       {renderContent()}

//       <Modal visible={createPostModalVisible} animationType="slide" transparent={true}>
//         <View style={styles.modalContainer}>
//           <ScrollView contentContainerStyle={styles.modalScrollContent}>
//             <View style={styles.modalContent}>
//               <View style={styles.modalHeader}>
//                 <Text style={styles.modalTitle}>Create New Post</Text>
//                 <TouchableOpacity onPress={() => setCreatePostModalVisible(false)}>
//                   <Ionicons name="close" size={24} color={colors.textPrimary} />
//                 </TouchableOpacity>
//               </View>
              
//               <View style={styles.postTypeSelector}>
//                 <TouchableOpacity 
//                   style={[styles.typeButton, newPost.type === "NEED" && styles.activeTypeButton]}
//                   onPress={() => setNewPost({...newPost, type: "NEED"})}
//                 >
//                   <Text style={[styles.typeButtonText, newPost.type === "NEED" && styles.activeTypeButtonText]}>I Need</Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity 
//                   style={[styles.typeButton, newPost.type === "OFFER" && styles.activeTypeButton]}
//                   onPress={() => setNewPost({...newPost, type: "OFFER"})}
//                 >
//                   <Text style={[styles.typeButtonText, newPost.type === "OFFER" && styles.activeTypeButtonText]}>I Offer</Text>
//                 </TouchableOpacity>
//               </View>
              
//               <TouchableOpacity style={styles.imageUploadSection} onPress={pickImage}>
//                 {newPost.image ? (
//                   <Image source={{ uri: newPost.image }} style={styles.selectedImage} />
//                 ) : (
//                   <View style={styles.imagePlaceholder}>
//                     <Ionicons name="image-outline" size={40} color={colors.textSecondary} />
//                     <Text style={styles.imagePlaceholderText}>Add Image</Text>
//                   </View>
//                 )}
//               </TouchableOpacity>
              
//               <TextInput
//                 style={styles.formInput}
//                 placeholder="Post Title *"
//                 value={newPost.title}
//                 onChangeText={(text) => setNewPost({...newPost, title: text})}
//               />
              
//               <TextInput
//                 style={[styles.formInput, styles.textArea]}
//                 multiline
//                 placeholder="Description *"
//                 value={newPost.description}
//                 onChangeText={(text) => setNewPost({...newPost, description: text})}
//               />
              
//               <View style={styles.rowInputs}>
//                 <TextInput
//                   style={[styles.formInput, styles.halfInput]}
//                   placeholder="Price (₹)"
//                   keyboardType="numeric"
//                   value={newPost.price}
//                   onChangeText={(text) => setNewPost({...newPost, price: text})}
//                 />
//                 <TextInput
//                   style={[styles.formInput, styles.halfInput]}
//                   placeholder="Category"
//                   value={newPost.category}
//                   onChangeText={(text) => setNewPost({...newPost, category: text})}
//                 />
//               </View>
              
//               <TextInput
//                 style={styles.formInput}
//                 placeholder="Location"
//                 value={newPost.location}
//                 onChangeText={(text) => setNewPost({...newPost, location: text})}
//               />
              
//               <View style={styles.urgencySelector}>
//                 <Text style={styles.urgencyLabel}>Urgency:</Text>
//                 {(['LOW', 'MEDIUM', 'HIGH'] as UrgencyLevel[]).map((level) => (
//                   <TouchableOpacity
//                     key={level}
//                     style={[styles.urgencyOption, newPost.urgency === level && styles.activeUrgencyOption]}
//                     onPress={() => setNewPost({...newPost, urgency: level})}
//                   >
//                     <Text style={[styles.urgencyOptionText, newPost.urgency === level && styles.activeUrgencyOptionText]}>
//                       {level}
//                     </Text>
//                   </TouchableOpacity>
//                 ))}
//               </View>
              
//               <View style={styles.modalButtons}>
//                 <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setCreatePostModalVisible(false)}>
//                   <Text style={styles.cancelButtonText}>Cancel</Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity 
//                   style={[styles.modalButton, styles.submitButton, creatingPost && styles.disabledButton]}
//                   onPress={handleCreatePost}
//                   disabled={creatingPost}
//                 >
//                   {creatingPost ? (
//                     <ActivityIndicator color="white" />
//                   ) : (
//                     <Text style={styles.submitButtonText}>Create Post</Text>
//                   )}
//                 </TouchableOpacity>
//               </View>
//             </View>
//           </ScrollView>
//         </View>
//       </Modal>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: colors.background,
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     backgroundColor: colors.surface,
//     borderBottomWidth: 1,
//     borderBottomColor: colors.border,
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: colors.textPrimary,
//   },
//   createButton: {
//     padding: 4,
//   },
//   tabContainer: {
//     flexDirection: 'row',
//     backgroundColor: colors.surface,
//     borderBottomWidth: 1,
//     borderBottomColor: colors.border,
//   },
//   tab: {
//     flex: 1,
//     paddingVertical: 12,
//     alignItems: 'center',
//   },
//   activeTab: {
//     borderBottomWidth: 2,
//     borderBottomColor: colors.primary,
//   },
//   tabText: {
//     fontSize: 14,
//     color: colors.textSecondary,
//     fontWeight: '500',
//   },
//   activeTabText: {
//     color: colors.primary,
//     fontWeight: 'bold',
//   },
//   filterBar: {
//     flexDirection: 'row',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     backgroundColor: colors.surface,
//     borderBottomWidth: 1,
//     borderBottomColor: colors.border,
//   },
//   filterButton: {
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 20,
//     backgroundColor: colors.background,
//     marginRight: 8,
//   },
//   activeFilterButton: {
//     backgroundColor: colors.primary,
//   },
//   filterButtonText: {
//     fontSize: 14,
//     color: colors.textSecondary,
//     fontWeight: '500',
//   },
//   // Post Card Styles
//   postCard: {
//     backgroundColor: colors.surface,
//     marginHorizontal: 12,
//     marginVertical: 6,
//     borderRadius: 12,
//     padding: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   postHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'flex-start',
//     marginBottom: 12,
//   },
//   postUserInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//   },
//   postAvatar: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 8,
//   },
//   postUsername: {
//     fontSize: 14,
//     fontWeight: 'bold',
//     color: colors.textPrimary,
//   },
//   postType: {
//     fontSize: 12,
//     color: colors.textSecondary,
//     marginTop: 2,
//   },
//   postHeaderActions: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   saveButton: {
//     padding: 4,
//     marginLeft: 8,
//   },
//   shareButton: {
//     padding: 4,
//     marginLeft: 4,
//   },
//   urgencyContainer: {
//     marginBottom: 12,
//   },
//   urgencyBadge: {
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 12,
//     alignSelf: 'flex-start',
//   },
//   urgencyText: {
//     fontSize: 10,
//     fontWeight: 'bold',
//     color: '#fff',
//   },
//   noImagePlaceholder: {
//     width: '100%',
//     height: 150,
//     backgroundColor: colors.background,
//     borderRadius: 8,
//     marginBottom: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: colors.border,
//     borderStyle: 'dashed',
//   },
//   noImageText: {
//     fontSize: 14,
//     color: colors.textSecondary,
//     marginTop: 8,
//   },
//   postImage: {
//     width: '100%',
//     height: 200,
//     borderRadius: 8,
//     marginBottom: 12,
//   },
//   postContent: {
//     marginBottom: 12,
//   },
//   postTitle: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: colors.textPrimary,
//     marginBottom: 6,
//   },
//   postDescription: {
//     fontSize: 14,
//     color: colors.textPrimary,
//     lineHeight: 20,
//     marginBottom: 8,
//   },
//   postDetails: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   postPrice: {
//     fontSize: 14,
//     fontWeight: 'bold',
//     color: colors.success,
//   },
//   postLocation: {
//     fontSize: 12,
//     color: colors.textSecondary,
//   },
//   tagsContainer: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     marginBottom: 8,
//   },
//   tag: {
//     backgroundColor: colors.background,
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 12,
//     marginRight: 6,
//     marginBottom: 4,
//   },
//   tagText: {
//     fontSize: 10,
//     color: colors.textSecondary,
//   },
//   postMeta: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   postDate: {
//     fontSize: 11,
//     color: colors.textSecondary,
//   },
//   postStatus: {
//     fontSize: 11,
//     color: colors.success,
//     fontWeight: '500',
//   },
//   postActions: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     borderTopWidth: 1,
//     borderTopColor: colors.border,
//     paddingTop: 12,
//   },
//   contactButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     backgroundColor: colors.background,
//     borderRadius: 20,
//     flex: 1,
//     marginRight: 8,
//     justifyContent: 'center',
//   },
//   contactButtonText: {
//     fontSize: 14,
//     fontWeight: '500',
//     color: colors.primary,
//     marginLeft: 6,
//   },
//   moreButton: {
//     padding: 8,
//   },
//   // Modal Styles
//   modalContainer: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.5)',
//     justifyContent: 'center',
//   },
//   modalScrollContent: {
//     flexGrow: 1,
//     justifyContent: 'center',
//   },
//   modalContent: {
//     backgroundColor: colors.surface,
//     marginHorizontal: 20,
//     borderRadius: 16,
//     padding: 20,
//     maxHeight: '90%',
//   },
//   modalHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   modalTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: colors.textPrimary,
//   },
//   postTypeSelector: {
//     flexDirection: 'row',
//     marginBottom: 16,
//     backgroundColor: colors.background,
//     borderRadius: 12,
//     padding: 4,
//   },
//   typeButton: {
//     flex: 1,
//     paddingVertical: 12,
//     alignItems: 'center',
//     borderRadius: 8,
//   },
//   activeTypeButton: {
//     backgroundColor: colors.surface,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   typeButtonText: {
//     fontSize: 14,
//     fontWeight: '500',
//     color: colors.textSecondary,
//   },
//   activeTypeButtonText: {
//     color: colors.primary,
//     fontWeight: 'bold',
//   },
//   imageUploadSection: {
//     height: 120,
//     backgroundColor: colors.background,
//     borderRadius: 12,
//     marginBottom: 16,
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: colors.border,
//     borderStyle: 'dashed',
//   },
//   selectedImage: {
//     width: '100%',
//     height: '100%',
//     borderRadius: 12,
//   },
//   imagePlaceholder: {
//     alignItems: 'center',
//   },
//   imagePlaceholderText: {
//     fontSize: 14,
//     color: colors.textSecondary,
//     marginTop: 8,
//   },
//   formInput: {
//     backgroundColor: colors.background,
//     borderRadius: 12,
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     fontSize: 16,
//     color: colors.textPrimary,
//     marginBottom: 12,
//     borderWidth: 1,
//     borderColor: colors.border,
//   },
//   textArea: {
//     height: 80,
//     textAlignVertical: 'top',
//   },
//   rowInputs: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
//   halfInput: {
//     width: '48%',
//   },
//   urgencySelector: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   urgencyLabel: {
//     fontSize: 14,
//     fontWeight: '500',
//     color: colors.textPrimary,
//     marginRight: 12,
//   },
//   urgencyOption: {
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 8,
//     backgroundColor: colors.background,
//     marginRight: 8,
//   },
//   activeUrgencyOption: {
//     backgroundColor: colors.primary,
//   },
//   urgencyOptionText: {
//     fontSize: 12,
//     fontWeight: '500',
//     color: colors.textSecondary,
//   },
//   activeUrgencyOptionText: {
//     color: colors.surface,
//   },
//   modalButtons: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
//   modalButton: {
//     flex: 1,
//     paddingVertical: 14,
//     borderRadius: 12,
//     alignItems: 'center',
//     marginHorizontal: 6,
//   },
//   cancelButton: {
//     backgroundColor: colors.background,
//   },
//   submitButton: {
//     backgroundColor: colors.primary,
//   },
//   disabledButton: {
//     opacity: 0.6,
//   },
//   cancelButtonText: {
//     fontSize: 16,
//     fontWeight: '500',
//     color: colors.textSecondary,
//   },
//   submitButtonText: {
//     fontSize: 16,
//     fontWeight: '500',
//     color: colors.surface,
//   },
//   // Empty State Styles
//   emptyState: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 60,
//     paddingHorizontal: 40,
//   },
//   emptyStateText: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: colors.textPrimary,
//     marginTop: 16,
//     marginBottom: 8,
//   },
//   emptyStateSubtext: {
//     fontSize: 14,
//     color: colors.textSecondary,
//     textAlign: 'center',
//     marginBottom: 24,
//   },
//   createFirstPostButton: {
//     backgroundColor: colors.primary,
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 20,
//   },
//   createFirstPostText: {
//     color: colors.surface,
//     fontSize: 16,
//     fontWeight: '500',
//   },
//   loadingMore: {
//     paddingVertical: 20,
//     alignItems: 'center',
//   },
//   loadingText: {
//     fontSize: 14,
//     color: colors.textSecondary,
//     marginTop: 8,
//   },
//   // Side Panel Styles (keep your existing styles)
//   sidePanel: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     bottom: 0,
//     width: width * 0.75,
//     backgroundColor: colors.surface,
//     zIndex: 1000,
//     paddingTop: 60,
//     paddingHorizontal: 20,
//   },
//   sidePanelClose: {
//     position: 'absolute',
//     top: 40,
//     right: 20,
//   },
//   sidePanelHeader: {
//     marginBottom: 30,
//   },
//   sidePanelTitle: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: colors.textPrimary,
//   },
//   menuItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: colors.border,
//   },
//   menuItemText: {
//     fontSize: 16,
//     color: colors.textPrimary,
//     marginLeft: 12,
//   },
//   // Instagram Card Styles (keep your existing styles)
//   instagramCard: {
//     backgroundColor: colors.surface,
//     marginHorizontal: 12,
//     marginVertical: 6,
//     borderRadius: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   cardHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     padding: 12,
//   },
//   userInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   avatar: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     marginRight: 8,
//   },
//   username: {
//     fontSize: 14,
//     fontWeight: 'bold',
//     color: colors.textPrimary,
//   },
//   userLocation: {
//     fontSize: 12,
//     color: colors.textSecondary,
//   },
//   productImage: {
//     width: '100%',
//     height: 300,
//   },
//   cardFooter: {
//     padding: 12,
//   },
//   actionButtons: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   orderButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: colors.primary,
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 20,
//     flex: 2,
//     marginRight: 8,
//     justifyContent: 'center',
//   },
//   orderButtonText: {
//     color: colors.surface,
//     fontWeight: '500',
//     marginLeft: 6,
//   },
//   messageButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: colors.background,
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 20,
//     flex: 2,
//     marginRight: 8,
//     justifyContent: 'center',
//     borderWidth: 1,
//     borderColor: colors.border,
//   },
//   messageButtonText: {
//     color: colors.primary,
//     fontWeight: '500',
//     marginLeft: 6,
//   },
//   // shareButton: {
//   //   padding: 8,
//   //   backgroundColor: colors.background,
//   //   borderRadius: 20,
//   //   borderWidth: 1,
//   //   borderColor: colors.border,
//   // },
//   productDetails: {
//     marginBottom: 8,
//   },
//   productName: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: colors.textPrimary,
//     marginBottom: 4,
//   },
//   productDescription: {
//     fontSize: 14,
//     color: colors.textPrimary,
//     lineHeight: 20,
//     marginBottom: 8,
//   },
//   priceStockContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   productPrice: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: colors.success,
//   },
//   productStock: {
//     fontSize: 14,
//     color: colors.textSecondary,
//   },
//   productCategory: {
//     fontSize: 12,
//     color: colors.textSecondary,
//   },
//   timestamp: {
//     fontSize: 11,
//     color: colors.textSecondary,
//   },
// });


import { useAuth } from '@/hooks/useAuth';
import { conversationService } from '@/utils/conversationService';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useRouter } from "expo-router";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  orderBy, 
  query, 
  addDoc,
  updateDoc,
  where,
  limit,
  startAfter,
  Timestamp
} from "firebase/firestore";
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
  View,
  Alert,
  ActivityIndicator,
  RefreshControl
} from "react-native";
import { db, storage } from "../../../firebaseConfig";

const { width } = Dimensions.get('window');

// Updated color palette to match previous code
const colors = {
  primary: 'rgba(23, 104, 217, 1)',      // Bright blue for primary actions
  secondary: 'rgba(144, 186, 242, 1)',   // Light blue for secondary elements
  background: '#ffffff',                 // White background
  surface: '#ffffff',                    // White surface
  textPrimary: 'rgba(4, 18, 36, 1)',    // Dark navy for main text
  textSecondary: 'rgba(4, 18, 36, 0.7)', // Medium gray for secondary text
  border: 'rgba(144, 186, 242, 0.3)',   // Light blue border
  needCard: 'rgba(255, 236, 230, 0.3)', // Soft orange for needs
  offerCard: 'rgba(230, 243, 255, 0.3)', // Soft blue for offers
  success: 'rgba(23, 104, 217, 1)',     // Blue for success actions
  lightBackground: 'rgba(208, 226, 250, 0.3)', // Very light blue background
};

// Define types (keep your existing types)
type ShopkeeperData = {
  uid: string;
  email: string;
  shopName: string;
  ownerName: string;
  location: string;
  phone: string;
  createdAt: any;
};

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  type: string;
  imageUrl?: string;
  createdAt?: any;
  shopkeeperId?: string;
  shopId?: string;
};

// Customer Post Types (keep your existing types)
type PostType = 'NEED' | 'OFFER';
type PostStatus = 'ACTIVE' | 'FULFILLED' | 'EXPIRED';
type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH';

interface CustomerPost {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  title: string;
  description: string;
  price?: number;
  category: string;
  type: PostType;
  imageUrl?: string;
  location: string;
  status: PostStatus;
  createdAt: any;
  updatedAt: any;
  tags: string[];
  contactInfo: {
    phone?: string;
    email: string;
    preferredContact: 'phone' | 'email' | 'message';
  };
  urgency: UrgencyLevel;
}

interface PostFilter {
  type?: PostType;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  urgency?: string;
  status?: string;
  searchQuery?: string;
}

// Post API Functions (keep your existing functions)
const createCustomerPost = async (postData: Omit<CustomerPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const postWithTimestamps = {
      ...postData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      status: 'ACTIVE' as const
    };

    console.log('📤 Saving post to Firestore with imageUrl:', postWithTimestamps.imageUrl);
    
    const docRef = await addDoc(collection(db, "customerPosts"), postWithTimestamps);
    
    console.log('✅ Post saved with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating post:', error);
    throw new Error('Failed to create post');
  }
};

const uploadPostImage = async (imageUri: string): Promise<string | undefined> => {
  try {
    console.log('Starting ImgBB upload for post image:', imageUri);
    
    const IMGBB_API_KEY = '2e6117c9d92bf16f23690049db98971d';
    
    const formData = new FormData();
    
    // @ts-ignore - React Native FormData handling
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'post_image.jpg',
    });

    console.log('Sending request to ImgBB...');
    
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = await response.json();
    console.log('ImgBB response for post:', data);
    
    if (data.success) {
      console.log('✅ Post image uploaded to ImgBB:', data.data.url);
      return data.data.url;
    } else {
      console.error('❌ ImgBB upload failed for post:', data);
      return undefined;
    }
  } catch (error) {
    console.error('❌ Error uploading post image to ImgBB:', error);
    return undefined;
  }
};

const getCustomerPosts = async (
  filters: PostFilter = {}
): Promise<{ posts: CustomerPost[]; lastVisible: any }> => {
  try {
    console.log('🔍 Fetching customer posts with filters:', filters);
    
    let q = query(collection(db, "customerPosts"), orderBy('createdAt', 'desc'));

    console.log('📝 Query created, executing...');

    const snapshot = await getDocs(q);
    console.log('✅ Query executed, found documents:', snapshot.size);

    const posts: CustomerPost[] = [];
    
    for (const postDoc of snapshot.docs) {
      const data = postDoc.data();
      
      console.log('📄 Processing post:', postDoc.id, 'Customer ID:', data.customerId);
      console.log('📄 Current customerName from post:', data.customerName);
      
      let customerName = data.customerName;
      let customerEmail = data.customerEmail;
      
      if (data.customerId) {
        try {
          console.log('👤 Fetching customer data from customers collection for customerId:', data.customerId);
          const customerDocRef = doc(db, "customers", data.customerId);
          const customerDoc = await getDoc(customerDocRef);
          
          if (customerDoc.exists()) {
            const customerData = customerDoc.data();
            console.log('✅ Customer data found:', customerData);
            
            customerName = customerData.fullName || 
                          customerData.name || 
                          customerData.displayName || 
                          customerData.username || 
                          customerData.firstName || 
                          data.customerName || 
                          'Anonymous Customer';
            
            customerEmail = customerData.email || data.customerEmail || '';
            
            console.log('👤 Final customerName from customers collection:', customerName);
            console.log('📧 Final customerEmail:', customerEmail);
          } else {
            console.log('❌ Customer document not found in customers collection for customerId:', data.customerId);
            customerName = data.customerName || 'Anonymous Customer';
          }
        } catch (customerError) {
          console.log('⚠️ Could not fetch customer data for post:', postDoc.id, customerError);
          customerName = data.customerName || 'Anonymous Customer';
        }
      } else {
        console.log('❌ No customerId found in post data');
        customerName = data.customerName || 'Anonymous Customer';
      }
      
      const post: CustomerPost = {
        id: postDoc.id,
        customerId: data.customerId || '',
        customerName: customerName,
        customerEmail: customerEmail,
        title: data.title || '',
        description: data.description || '',
        price: data.price,
        category: data.category || 'General',
        type: data.type || 'NEED',
        imageUrl: data.imageUrl,
        location: data.location || 'Unknown Location',
        status: data.status || 'ACTIVE',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        tags: data.tags || [],
        contactInfo: data.contactInfo || { 
          email: customerEmail, 
          preferredContact: 'message' as const 
        },
        urgency: data.urgency || 'MEDIUM'
      };

      posts.push(post);
      console.log('✅ Added post to array. Customer:', post.customerName);
    }

    console.log('📦 Final posts array length:', posts.length);
    console.log('👥 Customer names in posts:', posts.map(p => p.customerName));
    
    return { posts, lastVisible: null };
  } catch (error) {
    console.error('❌ Error fetching posts:', error);
    return { posts: [], lastVisible: null };
  }
};

const updateCustomerPost = async (postId: string, updates: Partial<CustomerPost>): Promise<void> => {
  try {
    const postRef = doc(db, "customerPosts", postId);
    await updateDoc(postRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating post:', error);
    throw new Error('Failed to update post');
  }
};

// Animated Product Card Component with updated colors
const AnimatedProductCard = ({ 
  item, 
  index, 
  shopkeeperData,
  onMessagePress 
}: { 
  item: Product; 
  index: number; 
  shopkeeperData: ShopkeeperData | null;
  onMessagePress: (product: Product) => void;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const [saved, setSaved] = useState(false);
  
  useEffect(() => {
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
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <Image 
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }} 
            style={styles.avatar}
          />
          <View>
            <Text style={styles.username}>
              {shopkeeperData?.shopName || 'Unknown Shop'}
            </Text>
            <Text style={styles.userLocation}>
              {shopkeeperData?.location || 'Unknown Location'}
            </Text>
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
      
      <Image 
        source={{ uri: item.imageUrl || 'https://via.placeholder.com/400x300' }} 
        style={styles.productImage}
        resizeMode="cover"
      />
      
      <View style={styles.cardFooter}>
        <View style={styles.actionButtons}> 
          <TouchableOpacity 
            style={styles.orderButton}
            onPress={() => {
              const shopkeeperId = (item as any).shopId || (item as any).shopkeeperID || (item as any).shopkeeper;
              router.push({
                pathname: '../orders/order-now',
                params: { 
                  product: JSON.stringify({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    imageUrl: item.imageUrl,
                    shopName: shopkeeperData?.shopName || 'Local Store',
                    shopId: shopkeeperId || 'shop-001',
                    description: item.description,
                    stock: item.stock
                  })
                }
              });
            }}
          >
            <Ionicons name="cart" size={20} color="white" />
            <Text style={styles.orderButtonText}>Order Now</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.messageButton}
            onPress={() => onMessagePress(item)}
          >
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

// Customer Post Card Component with updated colors
const CustomerPostCard = ({ 
  item, 
  index,
  onContactPress
}: { 
  item: CustomerPost; 
  index: number;
  onContactPress: (post: CustomerPost) => void;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const [saved, setSaved] = useState(false);

  useEffect(() => {
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

  const getPostColor = () => {
    return item.type === 'NEED' ? colors.needCard : colors.offerCard;
  };

  const getTypeIcon = () => {
    return item.type === 'NEED' ? 'help-circle' : 'gift';
  };

  const getTypeColor = () => {
    return item.type === 'NEED' ? '#FF6B35' : colors.primary;
  };

  const handleSave = () => {
    setSaved(!saved);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${item.type === 'NEED' ? 'Looking for' : 'Offering'}: ${item.title} - ${item.description} | Price: ${item.price ? `₹${item.price}` : 'Negotiable'} | Location: ${item.location}`,
        title: item.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Recent';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return 'Recent';
    }
  };

  return (
    <Animated.View 
      style={[
        styles.postCard,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          backgroundColor: getPostColor()
        }
      ]}
    >
      <View style={styles.postHeader}>
        <View style={styles.postUserInfo}>
          <View style={[styles.postAvatar, { backgroundColor: getTypeColor() }]}>
            <Ionicons name={getTypeIcon()} size={16} color="white" />
          </View>
          <View>
            <Text style={styles.postUsername}>{item.customerName}</Text>
            <Text style={[styles.postType, { color: getTypeColor() }]}>
              {item.type} • {item.category}
            </Text>
          </View>
        </View>
        <View style={styles.postHeaderActions}>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Ionicons 
              name={saved ? "bookmark" : "bookmark-outline"} 
              size={20} 
              color={saved ? colors.primary : colors.textSecondary} 
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
            <Ionicons name="share-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.urgencyContainer}>
        <View style={[styles.urgencyBadge, { 
          backgroundColor: item.urgency === 'HIGH' ? '#FF6B6B' : 
                          item.urgency === 'MEDIUM' ? '#FFD93D' : '#6BCF7F' 
        }]}>
          <Text style={styles.urgencyText}>{item.urgency} URGENCY</Text>
        </View>
      </View>

      {item.imageUrl ? (
        <Image 
          source={{ uri: item.imageUrl }} 
          style={styles.postImage}
          resizeMode="cover"
          onError={(error) => console.log('❌ Image load error:', error.nativeEvent.error)}
        />
      ) : (
        <View style={styles.noImagePlaceholder}>
          <Ionicons name="image-outline" size={40} color={colors.textSecondary} />
          <Text style={styles.noImageText}>No Image</Text>
        </View>
      )}

      <View style={styles.postContent}>
        <Text style={styles.postTitle}>{item.title}</Text>
        <Text style={styles.postDescription}>{item.description}</Text>
        
        <View style={styles.postDetails}>
          {item.price && (
            <Text style={styles.postPrice}>💰 ₹{item.price}</Text>
          )}
          <Text style={styles.postLocation}>📍 {item.location}</Text>
        </View>
        
        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {item.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}
        
        <View style={styles.postMeta}>
          <Text style={styles.postDate}>
            {formatDate(item.createdAt)}
          </Text>
          <Text style={styles.postStatus}>
            • {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.postActions}>
        <TouchableOpacity 
          style={styles.contactButton}
          onPress={() => onContactPress(item)}
        >
          <Ionicons 
            name="chatbubble-ellipses" 
            size={18} 
            color={colors.primary} 
          />
          <Text style={styles.contactButtonText}>Contact</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export default function CustomerHome() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customerPosts, setCustomerPosts] = useState<CustomerPost[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [shopkeeperData, setShopkeeperData] = useState<{[key: string]: ShopkeeperData}>({});
  const [activeTab, setActiveTab] = useState<"all" | "need" | "offer" | "customer-posts">("all");
  const [sidePanelVisible, setSidePanelVisible] = useState(false);
  const [createPostModalVisible, setCreatePostModalVisible] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  
  const [newPost, setNewPost] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    type: "NEED" as PostType,
    image: null as string | null,
    location: "",
    urgency: "MEDIUM" as UrgencyLevel,
  });
  
  const [activeFilter, setActiveFilter] = useState<PostFilter>({});
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [creatingPost, setCreatingPost] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Keep all your existing functions (fetchProductsAndShopkeepers, fetchCustomerPosts, etc.)
  // ... (all your existing functions remain the same)

  const fetchProductsAndShopkeepers = async () => {
    try {
      console.log('🔄 Refreshing products...');
      const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];
      
      setProducts(data);
      setFilteredProducts(data);

      const shopkeeperMap: {[key: string]: ShopkeeperData} = {};
      for (const product of data) {
        const shopkeeperId = (product as any).shopId || (product as any).shopkeeperID || (product as any).shopkeeper;
        if (shopkeeperId && !shopkeeperMap[shopkeeperId]) {
          try {
            const shopkeeperDoc = await getDoc(doc(db, "shopkeepers", shopkeeperId));
            if (shopkeeperDoc.exists()) {
              shopkeeperMap[shopkeeperId] = {
                uid: shopkeeperId,
                ...shopkeeperDoc.data()
              } as ShopkeeperData;
            }
          } catch (error) {
            console.error("Error fetching shopkeeper:", error);
          }
        }
      }
      setShopkeeperData(shopkeeperMap);
      
      console.log('✅ Products refreshed successfully');
    } catch (err) {
      console.log("Error refreshing products:", err);
    }
  };

  const fetchCustomerPosts = async (filters: PostFilter = {}) => {
    try {
      console.log('🚀 Starting to fetch customer posts...');
      setLoadingPosts(true);
      const result = await getCustomerPosts(filters);
      
      console.log('📊 Fetch result:', result);
      
      setCustomerPosts(result.posts);
      setLastVisible(null);
      
      console.log('✅ Posts set to state, count:', result.posts.length);
    } catch (error) {
      console.error('❌ Error in fetchCustomerPosts:', error);
      Alert.alert('Error', 'Failed to load posts');
    } finally {
      setLoadingPosts(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCustomerPosts(activeFilter);
    setRefreshing(false);
  };

  const handleCreatePost = async () => {
    if (!user) {
      Alert.alert('Error', 'Please log in to create a post');
      return;
    }
  
    if (!newPost.title.trim() || !newPost.description.trim()) {
      Alert.alert('Error', 'Please fill in title and description');
      return;
    }
  
    try {
      setCreatingPost(true);
      
      let customerName = 'Anonymous Customer';
      let customerEmail = user.email || '';
  
      try {
        console.log('👤 Fetching customer data for:', user.uid);
        const customerDocRef = doc(db, "customers", user.uid);
        const customerDoc = await getDoc(customerDocRef);
        
        if (customerDoc.exists()) {
          const customerData = customerDoc.data();
          console.log('✅ Customer data found:', customerData);
          
          customerName = customerData.fullName || 
                        customerData.customerName || 
                        user.displayName || 
                        'Anonymous Customer';
          
          customerEmail = customerData.email || user.email || '';
          
          console.log('✅ Customer data fetched - Name:', customerName, 'Email:', customerEmail);
        } else {
          console.log('❌ Customer document not found in customers collection, using displayName');
          customerName = user.displayName || 'Anonymous Customer';
        }
      } catch (customerError) {
        console.log('⚠️ Could not fetch customer data:', customerError);
        customerName = user.displayName || 'Anonymous Customer';
      }
  
      let imageUrl: string | undefined = undefined;

      if (newPost.image) {
        try {
          console.log('🖼️ Uploading post image to ImgBB...');
          const uploadedUrl = await uploadPostImage(newPost.image);
          
          if (uploadedUrl) {
            imageUrl = uploadedUrl;
            console.log('✅ Post image uploaded successfully:', imageUrl);
          } else {
            console.warn('⚠️ Image upload failed, creating post without image');
          }
        } catch (imageError) {
          console.warn('⚠️ Image upload failed, but post will be created:', imageError);
        }
      }

      const postData = {
        customerId: user.uid,
        customerName: customerName,
        customerEmail: customerEmail,
        title: newPost.title,
        description: newPost.description,
        price: newPost.price ? parseFloat(newPost.price) : undefined,
        category: newPost.category || 'General',
        type: newPost.type,
        imageUrl: imageUrl,
        location: newPost.location || 'Unknown Location',
        urgency: newPost.urgency,
        status: 'ACTIVE' as PostStatus,
        contactInfo: {
          email: customerEmail,
          preferredContact: 'message' as const
        },
        tags: newPost.category ? [newPost.category.toLowerCase()] : ['general'],
      };
  
      console.log('📝 Creating post with data (including imageUrl):', postData);
      const postId = await createCustomerPost(postData);
      console.log('✅ Post created with ID:', postId);
  
      Alert.alert('Success', 'Post created successfully!');
      
      setCreatePostModalVisible(false);
      setNewPost({
        title: "",
        description: "",
        price: "",
        category: "",
        type: "NEED",
        image: null,
        location: "",
        urgency: "MEDIUM",
      });
      
      fetchCustomerPosts(activeFilter);
      
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setCreatingPost(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }

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

  const handleContactPost = (post: CustomerPost) => {
    if (!user) {
      Alert.alert('Error', 'Please log in to contact the poster');
      return;
    }

    Alert.alert(
      'Contact Poster',
      `Would you like to contact ${post.customerName} about their ${post.type.toLowerCase()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Message', 
          onPress: () => {
            Alert.alert('Contact', `Email: ${post.contactInfo.email}\nPreferred contact: ${post.contactInfo.preferredContact}`);
          }
        }
      ]
    );
  };

  const handleMessageButton = async (product: Product) => {
    if (!user) {
      alert('Please log in to send messages');
      return;
    }

    try {
      const shopkeeperId = (product as any).shopId || (product as any).shopkeeperID || (product as any).shopkeeper;
      
      if (!shopkeeperId) {
        alert('Unable to identify the shopkeeper');
        return;
      }

      alert('Starting conversation...');
      const conversationId = await conversationService.findOrCreateConversation(user.uid, shopkeeperId);
      await conversationService.sendInitialMessage(conversationId, user.uid, product);
      router.push(`/chat/${conversationId}`);
      
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert('Failed to start conversation. Please try again.');
    }
  };

  useEffect(() => {
    const fetchProductsAndShopkeepers = async () => {
      try {
        const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];
        
        setProducts(data);
        setFilteredProducts(data);

        const shopkeeperMap: {[key: string]: ShopkeeperData} = {};
        for (const product of data) {
          const shopkeeperId = (product as any).shopId || (product as any).shopkeeperID || (product as any).shopkeeper;
          if (shopkeeperId && !shopkeeperMap[shopkeeperId]) {
            try {
              const shopkeeperDoc = await getDoc(doc(db, "shopkeepers", shopkeeperId));
              if (shopkeeperDoc.exists()) {
                shopkeeperMap[shopkeeperId] = {
                  uid: shopkeeperId,
                  ...shopkeeperDoc.data()
                } as ShopkeeperData;
              }
            } catch (error) {
              console.error("Error fetching shopkeeper:", error);
            }
          }
        }
        setShopkeeperData(shopkeeperMap);
      } catch (err) {
        console.log("Error fetching products:", err);
      }
    };

    fetchProductsAndShopkeepers();
    fetchCustomerPosts();
  }, []);

  useEffect(() => {
    if (activeTab === "all") {
      setFilteredProducts(products);
    } else if (activeTab === "customer-posts") {
      // Customer posts are handled separately
    } else {
      setFilteredProducts(products.filter(product => product.type === activeTab.toUpperCase()));
    }
  }, [activeTab, products]);

  const applyFilter = (filter: PostFilter) => {
    const newFilter = { ...activeFilter, ...filter };
    setActiveFilter(newFilter);
    fetchCustomerPosts(newFilter);
  };

  const FilterBar = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
      <TouchableOpacity 
        style={[styles.filterButton, activeFilter.type === undefined && styles.activeFilterButton]}
        onPress={() => applyFilter({ type: undefined })}
      >
        <Text style={styles.filterButtonText}>All Posts</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.filterButton, activeFilter.type === 'NEED' && styles.activeFilterButton]}
        onPress={() => applyFilter({ type: 'NEED' })}
      >
        <Text style={styles.filterButtonText}>Needs</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.filterButton, activeFilter.type === 'OFFER' && styles.activeFilterButton]}
        onPress={() => applyFilter({ type: 'OFFER' })}
      >
        <Text style={styles.filterButtonText}>Offers</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.filterButton, activeFilter.urgency === 'HIGH' && styles.activeFilterButton]}
        onPress={() => applyFilter({ urgency: 'HIGH' })}
      >
        <Text style={styles.filterButtonText}>Urgent</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const SidePanel = () => (
    <View style={styles.sidePanel}>
      <TouchableOpacity style={styles.sidePanelClose} onPress={() => setSidePanelVisible(false)}>
        <Ionicons name="close" size={24} color={colors.textPrimary} />
      </TouchableOpacity>
      
      <View style={styles.sidePanelHeader}>
        <Text style={styles.sidePanelTitle}>Menu</Text>
      </View>
      
      {['Home', 'Search', 'Messages', 'Orders', 'Profile'].map((item) => (
        <TouchableOpacity key={item} style={styles.menuItem} onPress={() => setSidePanelVisible(false)}>
          <Ionicons name={
            item === 'Home' ? 'home' : 
            item === 'Search' ? 'search' : 
            item === 'Messages' ? 'chatbubbles' : 
            item === 'Orders' ? 'list' : 'person'
          } size={22} color={colors.primary} />
          <Text style={styles.menuItemText}>{item}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderContent = () => {
    console.log('🎯 Active Tab:', activeTab);
    console.log('📋 All Customer Posts Count:', customerPosts.length);
    console.log('📦 Filtered Products Count:', filteredProducts.length);

    const handleRefresh = async () => {
      setRefreshing(true);
      
      if (activeTab === "need" || activeTab === "offer") {
        await fetchCustomerPosts(activeFilter);
      } else {
        await fetchProductsAndShopkeepers();
      }
      
      setRefreshing(false);
    };

    if (activeTab === "need") {
      const needPosts = customerPosts.filter(post => post.type === 'NEED');
      console.log('🔄 Rendering NEED posts:', needPosts.length);
      
      return (
        <FlatList
          data={needPosts}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 25 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
            />
          }
          renderItem={({ item, index }) => {
            console.log('🎨 Rendering NEED post:', item.id, item.title);
            return (
              <CustomerPostCard 
                item={item} 
                index={index} 
                onContactPress={handleContactPost}
              />
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyStateText}>No needs posted yet</Text>
              <Text style={styles.emptyStateSubtext}>Be the first to post what you need!</Text>
              <TouchableOpacity 
                style={styles.createFirstPostButton}
                onPress={() => setCreatePostModalVisible(true)}
              >
                <Text style={styles.createFirstPostText}>Post Your Need</Text>
              </TouchableOpacity>
            </View>
          }
          ListFooterComponent={
            loadingPosts ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingText}>Loading more posts...</Text>
              </View>
            ) : null
          }
          onEndReached={() => {
            if (lastVisible && !loadingPosts) {
              fetchCustomerPosts(activeFilter);
            }
          }}
          onEndReachedThreshold={0.5}
        />
      );
    }

    if (activeTab === "offer") {
      const offerPosts = customerPosts.filter(post => post.type === 'OFFER');
      console.log('🔄 Rendering OFFER posts:', offerPosts.length);
      
      return (
        <FlatList
          data={offerPosts}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 25 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
            />
          }
          renderItem={({ item, index }) => {
            console.log('🎨 Rendering OFFER post:', item.id, item.title);
            return (
              <CustomerPostCard 
                item={item} 
                index={index} 
                onContactPress={handleContactPost}
              />
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="gift-outline" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyStateText}>No offers posted yet</Text>
              <Text style={styles.emptyStateSubtext}>Be the first to offer something!</Text>
              <TouchableOpacity 
                style={styles.createFirstPostButton}
                onPress={() => {
                  setNewPost(prev => ({ ...prev, type: "OFFER" }));
                  setCreatePostModalVisible(true);
                }}
              >
                <Text style={styles.createFirstPostText}>Post Your Offer</Text>
              </TouchableOpacity>
            </View>
          }
          ListFooterComponent={
            loadingPosts ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingText}>Loading more posts...</Text>
              </View>
            ) : null
          }
          onEndReached={() => {
            if (lastVisible && !loadingPosts) {
              fetchCustomerPosts(activeFilter);
            }
          }}
          onEndReachedThreshold={0.5}
        />
      );
    }

    console.log('🔄 Rendering products for ALL tab:', activeTab);
    return (
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 25 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
        renderItem={({ item, index }) => {
          const shopkeeperId = (item as any).shopId || (item as any).shopkeeperID || (item as any).shopkeeper;
          const shopkeeper = shopkeeperId ? shopkeeperData[shopkeeperId] : null;
          
          return (
            <AnimatedProductCard 
              item={item} 
              index={index} 
              shopkeeperData={shopkeeper}
              onMessagePress={handleMessageButton}
            />
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyStateText}>No products available</Text>
            <Text style={styles.emptyStateSubtext}>Check back later for new products</Text>
          </View>
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSidePanelVisible(true)}>
          <Ionicons name="menu" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🛒 Customer Dashboard</Text>
        <TouchableOpacity style={styles.createButton} onPress={() => setCreatePostModalVisible(true)}>
          <Ionicons name="add-circle" size={26} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {sidePanelVisible && <SidePanel />}

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "all" && styles.activeTab]}
          onPress={() => setActiveTab("all")}
        >
          <Text style={[styles.tabText, activeTab === "all" && styles.activeTabText]}>All Products</Text>
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

      {activeTab === "customer-posts" && <FilterBar />}

      {renderContent()}

      <Modal visible={createPostModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create New Post</Text>
                <TouchableOpacity onPress={() => setCreatePostModalVisible(false)}>
                  <Ionicons name="close" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.postTypeSelector}>
                <TouchableOpacity 
                  style={[styles.typeButton, newPost.type === "NEED" && styles.activeTypeButton]}
                  onPress={() => setNewPost({...newPost, type: "NEED"})}
                >
                  <Text style={[styles.typeButtonText, newPost.type === "NEED" && styles.activeTypeButtonText]}>I Need</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.typeButton, newPost.type === "OFFER" && styles.activeTypeButton]}
                  onPress={() => setNewPost({...newPost, type: "OFFER"})}
                >
                  <Text style={[styles.typeButtonText, newPost.type === "OFFER" && styles.activeTypeButtonText]}>I Offer</Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity style={styles.imageUploadSection} onPress={pickImage}>
                {newPost.image ? (
                  <Image source={{ uri: newPost.image }} style={styles.selectedImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="image-outline" size={40} color={colors.textSecondary} />
                    <Text style={styles.imagePlaceholderText}>Add Image</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              <TextInput
                style={styles.formInput}
                placeholder="Post Title *"
                value={newPost.title}
                onChangeText={(text) => setNewPost({...newPost, title: text})}
              />
              
              <TextInput
                style={[styles.formInput, styles.textArea]}
                multiline
                placeholder="Description *"
                value={newPost.description}
                onChangeText={(text) => setNewPost({...newPost, description: text})}
              />
              
              <View style={styles.rowInputs}>
                <TextInput
                  style={[styles.formInput, styles.halfInput]}
                  placeholder="Price (₹)"
                  keyboardType="numeric"
                  value={newPost.price}
                  onChangeText={(text) => setNewPost({...newPost, price: text})}
                />
                <TextInput
                  style={[styles.formInput, styles.halfInput]}
                  placeholder="Category"
                  value={newPost.category}
                  onChangeText={(text) => setNewPost({...newPost, category: text})}
                />
              </View>
              
              <TextInput
                style={styles.formInput}
                placeholder="Location"
                value={newPost.location}
                onChangeText={(text) => setNewPost({...newPost, location: text})}
              />
              
              <View style={styles.urgencySelector}>
                <Text style={styles.urgencyLabel}>Urgency:</Text>
                {(['LOW', 'MEDIUM', 'HIGH'] as UrgencyLevel[]).map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[styles.urgencyOption, newPost.urgency === level && styles.activeUrgencyOption]}
                    onPress={() => setNewPost({...newPost, urgency: level})}
                  >
                    <Text style={[styles.urgencyOptionText, newPost.urgency === level && styles.activeUrgencyOptionText]}>
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setCreatePostModalVisible(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.submitButton, creatingPost && styles.disabledButton]}
                  onPress={handleCreatePost}
                  disabled={creatingPost}
                >
                  {creatingPost ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.submitButtonText}>Create Post</Text>
                  )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  createButton: {
    padding: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.lightBackground,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeFilterButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  postCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 16,
    padding: 16,
    shadowColor: 'rgba(4, 18, 36, 0.15)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  postUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  postAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  postUsername: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  postType: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  postHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveButton: {
    padding: 4,
    marginLeft: 8,
  },
  shareButton: {
    padding: 4,
    marginLeft: 4,
  },
  urgencyContainer: {
    marginBottom: 12,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  noImagePlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: colors.lightBackground,
    borderRadius: 12,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  noImageText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  postContent: {
    marginBottom: 12,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  postDescription: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
    marginBottom: 8,
  },
  postDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  postPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.success,
  },
  postLocation: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tag: {
    backgroundColor: colors.lightBackground,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postDate: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  postStatus: {
    fontSize: 11,
    color: colors.success,
    fontWeight: '500',
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.lightBackground,
    borderRadius: 20,
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
    marginLeft: 6,
  },
  moreButton: {
    padding: 8,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(4, 18, 36, 0.5)',
    justifyContent: 'center',
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  postTypeSelector: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: colors.lightBackground,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTypeButton: {
    backgroundColor: colors.surface,
    shadowColor: 'rgba(4, 18, 36, 0.15)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  activeTypeButtonText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  imageUploadSection: {
    height: 120,
    backgroundColor: colors.lightBackground,
    borderRadius: 12,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  imagePlaceholder: {
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  formInput: {
    backgroundColor: colors.lightBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  urgencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  urgencyLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    marginRight: 12,
  },
  urgencyOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.lightBackground,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeUrgencyOption: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  urgencyOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  activeUrgencyOptionText: {
    color: colors.surface,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: colors.lightBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  submitButton: {
    backgroundColor: colors.primary,
  },
  disabledButton: {
    opacity: 0.6,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.surface,
  },
  // Empty State Styles
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  createFirstPostButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  createFirstPostText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '500',
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  // Side Panel Styles
  sidePanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: width * 0.75,
    backgroundColor: colors.surface,
    zIndex: 1000,
    paddingTop: 60,
    paddingHorizontal: 20,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  sidePanelClose: {
    position: 'absolute',
    top: 40,
    right: 20,
  },
  sidePanelHeader: {
    marginBottom: 30,
  },
  sidePanelTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemText: {
    fontSize: 16,
    color: colors.textPrimary,
    marginLeft: 12,
  },
  // Instagram Card Styles
  instagramCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 16,
    shadowColor: 'rgba(4, 18, 36, 0.15)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  username: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  userLocation: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  productImage: {
    width: '100%',
    height: 300,
  },
  cardFooter: {
    padding: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flex: 2,
    marginRight: 8,
    justifyContent: 'center',
  },
  orderButtonText: {
    color: colors.surface,
    fontWeight: '500',
    marginLeft: 6,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightBackground,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flex: 2,
    marginRight: 8,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageButtonText: {
    color: colors.primary,
    fontWeight: '500',
    marginLeft: 6,
  },
  shareButton: {
    padding: 8,
    backgroundColor: colors.lightBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  productDetails: {
    marginBottom: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
    marginBottom: 8,
  },
  priceStockContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.success,
  },
  productStock: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  productCategory: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  timestamp: {
    fontSize: 11,
    color: colors.textSecondary,
  },
});