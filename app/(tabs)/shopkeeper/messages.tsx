import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  where
} from 'firebase/firestore';
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { db } from '../../../firebaseConfig';
import { useAuth } from '../../../hooks/useAuth';

const { width } = Dimensions.get('window');

// Enhanced color constants with better usage
const COLORS = {
  primary: 'rgba(15, 177, 234, 1)',
  primaryLight: 'rgba(15, 177, 234, 0.15)',
  primaryDark: 'rgba(12, 142, 187, 1)',
  secondary: 'rgba(9, 68, 89, 1)',
  secondaryLight: 'rgba(9, 68, 89, 0.7)',
  accent: 'rgba(247, 206, 38, 1)', // Yellow - properly used
  accentLight: 'rgba(247, 206, 38, 0.15)',
  danger: 'rgba(255, 49, 49, 1)', // Red - properly used
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

type User = {
  id: string;
  name: string;
  avatar?: string;
  role: 'customer' | 'shopkeeper';
};

type Message = {
  id: string;
  text: string;
  timestamp: Date;
  senderId: string;
  read: boolean;
};

type Conversation = {
  id: string;
  participants: User[];
  lastMessage: Message;
  unreadCount: number;
  updatedAt: Date;
};

export default function ShopkeeperMessagesScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  // Function to fetch user details from both users and shopkeepers collections
  const fetchUserDetails = async (participantId: string): Promise<User> => {
    try {
      console.log('🔍 Fetching details for participant:', participantId);
      
      // First try the users collection
      console.log('📁 Checking users collection...');
      const userDoc = await getDoc(doc(db, 'users', participantId));
      console.log('📄 Users doc exists:', userDoc.exists());
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('✅ Found in users collection - data:', userData);
        
        // Check if userData has name field, if not use email or fallback
        let userName = userData?.name;
        
        if (!userName) {
          // If no name field, try to use email username part or fallback
          if (userData?.email) {
            userName = userData.email.split('@')[0]; // Use part before @ from email
            console.log('📧 Using email username as name:', userName);
          } else {
            userName = 'Customer';
            console.log('❌ No name or email found, using fallback');
          }
        }
        
        return {
          id: participantId,
          name: userName,
          avatar: userData?.avatar,
          role: (userData?.role === 'shopkeeper' ? 'shopkeeper' : 'customer') as 'customer' | 'shopkeeper'
        };
      }
      
      // If not found in users, try the shopkeepers collection
      console.log('📁 Checking shopkeepers collection...');
      const shopkeeperDoc = await getDoc(doc(db, 'shopkeepers', participantId));
      console.log('📄 Shopkeepers doc exists:', shopkeeperDoc.exists());
      
      if (shopkeeperDoc.exists()) {
        const shopkeeperData = shopkeeperDoc.data();
        console.log('✅ Found in shopkeepers collection - data:', shopkeeperData);
        
        // Use ownerName, shopName, or fallback
        const userName = shopkeeperData?.ownerName || shopkeeperData?.shopName || 'Shopkeeper';
        
        return {
          id: participantId,
          name: userName,
          avatar: shopkeeperData?.shopLogo,
          role: 'shopkeeper'
        };
      }
      
      // If not found in either collection
      console.log('❌ User not found in any collection for ID:', participantId);
      return {
        id: participantId,
        name: 'Customer',
        role: 'customer'
      };
      
    } catch (error) {
      console.error('❌ Error fetching user details:', error);
      return {
        id: participantId,
        name: 'Customer',
        role: 'customer'
      };
    }
  };

  // Fetch real conversations from Firestore
  useEffect(() => {
    if (!user) return;

    const conversationsRef = collection(db, 'conversations');
    
    // Query conversations where current shopkeeper is a participant
    const q = query(
      conversationsRef, 
      where('participants', 'array-contains', user.uid)
    );

    console.log('Querying conversations for shopkeeper:', user.uid);

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        console.log('Snapshot received, docs count:', snapshot.docs.length);
        
        if (snapshot.empty) {
          console.log('No conversations found in the collection');
          setConversations([]);
          setLoading(false);
          return;
        }
        
        const conversationsData: Conversation[] = [];
        
        for (const docSnapshot of snapshot.docs) {
          const data = docSnapshot.data();
          console.log('Conversation data:', data);
          
          if (!data.participants || !Array.isArray(data.participants)) {
            console.log('Invalid participants data:', data.participants);
            continue;
          }
          
          // Get participant details (find the customer)
          const participantDetails: User[] = [];
          for (const participantId of data.participants) {
            if (participantId !== user.uid) { // This is the customer
              const userDetails = await fetchUserDetails(participantId);
              participantDetails.push(userDetails);
            }
          }

          // Handle case where all participants are the current user
          if (participantDetails.length === 0) {
            console.log('No other participants found, skipping conversation');
            continue;
          }

          // Calculate unread count for shopkeeper (messages sent by customer that are unread)
          const unreadCount = data.lastMessage && 
                            data.lastMessage.senderId !== user.uid && 
                            !data.lastMessage.read ? 1 : 0;

          conversationsData.push({
            id: docSnapshot.id,
            participants: participantDetails,
            lastMessage: {
              id: 'last',
              text: data.lastMessage?.text || 'No messages yet',
              timestamp: data.lastMessage?.timestamp?.toDate() || data.updatedAt?.toDate() || new Date(),
              senderId: data.lastMessage?.senderId || '',
              read: data.lastMessage?.read || true
            },
            unreadCount,
            updatedAt: data.updatedAt?.toDate() || new Date()
          });
        }

        // Sort by updatedAt (newest first)
        conversationsData.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        setConversations(conversationsData);
        setLoading(false);
      } catch (error) {
        console.error('Error processing conversations:', error);
        setLoading(false);
      }
    }, (error) => {
      console.error('Error listening to conversations:', error);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  // Debug conversations state
  useEffect(() => {
    if (conversations.length > 0) {
      console.log('🎯 Current conversations state:', conversations);
      conversations.forEach((conv, index) => {
        console.log(`💬 Conversation ${index}:`, {
          id: conv.id,
          participantCount: conv.participants.length,
          participantNames: conv.participants.map(p => p.name),
          lastMessage: conv.lastMessage.text
        });
      });
    }
  }, [conversations]);

  const filteredConversations = conversations.filter(conv =>
    conv.participants.some(participant => 
      participant.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  // Enhanced Header Component - E-commerce style
  const Header = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push('/shopkeeper/home')}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Customer Messages</Text>
          <Text style={styles.headerSubtitle}>
            {conversations.length} active conversation{conversations.length !== 1 ? 's' : ''}
          </Text>
        </View>
        
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter-outline" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.headerStats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {conversations.filter(conv => conv.unreadCount > 0).length}
          </Text>
          <Text style={styles.statLabel}>Unread</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{conversations.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {conversations.filter(conv => {
              const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
              return conv.updatedAt > oneDayAgo;
            }).length}
          </Text>
          <Text style={styles.statLabel}>Today</Text>
        </View>
      </View>
    </View>
  );

  const renderConversation = ({ item }: { item: Conversation }) => {
    const customer = item.participants[0]; // The customer in the conversation
    
    console.log('🎨 Rendering conversation with customer:', {
      customer: customer,
      hasName: !!customer?.name,
      name: customer?.name
    });
    
    // Determine display name and avatar
    const displayName = customer?.name || 'Customer';
    const displayAvatar = customer?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face';
    const roleText = customer?.role === 'shopkeeper' ? 'Shopkeeper' : 'Customer';
    const isUnread = item.unreadCount > 0;
    
    return (
      <TouchableOpacity 
        style={[
          styles.conversationItem,
          isUnread && styles.unreadConversationItem
        ]}
        onPress={() => router.push(`/chat/${item.id}`)}
      >
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: displayAvatar }} 
            style={styles.avatar}
            defaultSource={{ uri: 'https://via.placeholder.com/150' }}
          />
          {isUnread && (
            <View style={styles.unreadIndicator} />
          )}
          <View style={[
            styles.statusIndicator,
            isUnread && styles.unreadStatusIndicator
          ]} />
        </View>
        
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <View style={styles.nameContainer}>
              <Text style={[
                styles.conversationName,
                isUnread && styles.unreadConversationName
              ]}>
                {displayName}
              </Text>
              <View style={[
                styles.roleBadge,
                customer?.role === 'shopkeeper' ? styles.shopkeeperBadge : styles.customerBadge
              ]}>
                <Ionicons 
                  name={customer?.role === 'shopkeeper' ? "storefront" : "person"} 
                  size={10} 
                  color={customer?.role === 'shopkeeper' ? COLORS.accent : COLORS.primary} 
                  style={styles.roleIcon}
                />
                <Text style={[
                  styles.roleBadgeText,
                  customer?.role === 'shopkeeper' ? styles.shopkeeperBadgeText : styles.customerBadgeText
                ]}>
                  {roleText}
                </Text>
              </View>
            </View>
            <View style={styles.timestampContainer}>
              <Text style={[
                styles.timestamp,
                isUnread && styles.unreadTimestamp
              ]}>
                {formatTime(item.lastMessage.timestamp)}
              </Text>
              {isUnread && (
                <View style={styles.unreadDot} />
              )}
            </View>
          </View>
          
          <View style={styles.conversationPreview}>
            <Text 
              style={[
                styles.lastMessage, 
                isUnread && styles.unreadMessage
              ]}
              numberOfLines={1}
            >
              {item.lastMessage.senderId === user?.uid ? (
                <>
                  <Ionicons name="checkmark-done" size={12} color={COLORS.textSecondary} />
                  <Text> You: </Text>
                </>
              ) : ''}
              {item.lastMessage.text}
            </Text>
            
            {isUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.arrowContainer}>
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={COLORS.textMuted} 
          />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingAnimation}>
            <Ionicons name="chatbubbles" size={48} color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading your messages...</Text>
            <Text style={styles.loadingSubText}>Connecting to customers</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Enhanced Header */}
      <Header />

      {/* Enhanced Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search customer messages by name..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearSearchButton}>
              <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Enhanced Conversations List */}
      {filteredConversations.length > 0 ? (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversation}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIllustration}>
            <Ionicons name="chatbubbles-outline" size={80} color={COLORS.textMuted} />
          </View>
          <Text style={styles.emptyStateText}>
            {searchQuery ? 'No conversations found' : 'No customer messages yet'}
          </Text>
          <Text style={styles.emptyStateSubText}>
            {searchQuery 
              ? 'Try adjusting your search terms'
              : 'Customer messages will appear here when they contact you about your products'
            }
          </Text>
          {!searchQuery && (
            <TouchableOpacity style={styles.startConversationButton}>
              <Ionicons name="megaphone" size={18} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.startConversationButtonText}>Share Your Products</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    marginTop: 27,
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
    fontSize: 18,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  loadingSubText: {
    marginTop: 4,
    fontSize: 14,
    color: COLORS.textMuted,
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
  filterButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
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
  clearSearchButton: {
    padding: 4,
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  // Enhanced Conversation Item
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  unreadConversationItem: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  unreadIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  unreadStatusIndicator: {
    backgroundColor: COLORS.accent,
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  nameContainer: {
    flex: 1,
    marginRight: 8,
  },
  conversationName: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  unreadConversationName: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  shopkeeperBadge: {
    backgroundColor: COLORS.accentLight,
  },
  customerBadge: {
    backgroundColor: COLORS.primaryLight,
  },
  roleIcon: {
    marginRight: 4,
  },
  roleBadgeText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
  },
  shopkeeperBadgeText: {
    color: COLORS.accent,
  },
  customerBadgeText: {
    color: COLORS.primary,
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginRight: 6,
  },
  unreadTimestamp: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  conversationPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    marginRight: 8,
    lineHeight: 18,
  },
  unreadMessage: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  arrowContainer: {
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    paddingTop: 100,
  },
  emptyIllustration: {
    padding: 20,
    backgroundColor: COLORS.inputBackground,
    borderRadius: 40,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  startConversationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primaryDark,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startConversationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 8,
  },
});