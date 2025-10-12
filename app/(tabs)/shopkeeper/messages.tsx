import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  where,
  updateDoc
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

// Enhanced color constants with better balance
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
  lastMessageRead: boolean;
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
      const userDoc = await getDoc(doc(db, 'users', participantId));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        let userName = userData?.name;
        
        if (!userName) {
          if (userData?.email) {
            userName = userData.email.split('@')[0];
          } else {
            userName = 'Customer';
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
      const shopkeeperDoc = await getDoc(doc(db, 'shopkeepers', participantId));
      
      if (shopkeeperDoc.exists()) {
        const shopkeeperData = shopkeeperDoc.data();
        const userName = shopkeeperData?.ownerName || shopkeeperData?.shopName || 'Shopkeeper';
        
        return {
          id: participantId,
          name: userName,
          avatar: shopkeeperData?.shopLogo,
          role: 'shopkeeper'
        };
      }
      
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

  // Function to mark conversation as read
  const markAsRead = async (conversationId: string) => {
    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        'lastMessage.read': true,
        'lastMessageReadByShopkeeper': true
      });
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  };

  // Fetch real conversations from Firestore
  useEffect(() => {
    if (!user) return;

    const conversationsRef = collection(db, 'conversations');
    
    // Query conversations where current shopkeeper is a participant
    const q = query(
      conversationsRef, 
      where('participants', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
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
            if (participantId !== user.uid) {
              const userDetails = await fetchUserDetails(participantId);
              participantDetails.push(userDetails);
            }
          }

          if (participantDetails.length === 0) {
            console.log('No other participants found, skipping conversation');
            continue;
          }

          // Calculate unread count - messages sent by customer that are unread
          const isLastMessageFromCustomer = data.lastMessage?.senderId !== user.uid;
          const isLastMessageUnread = !data.lastMessage?.read;
          const unreadCount = isLastMessageFromCustomer && isLastMessageUnread ? 1 : 0;

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
            updatedAt: data.updatedAt?.toDate() || new Date(),
            lastMessageRead: data.lastMessage?.read || true
          });
        }

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
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const handleConversationPress = (conversation: Conversation) => {
    // Mark as read when conversation is opened
    if (conversation.unreadCount > 0) {
      markAsRead(conversation.id);
    }
    router.push(`/chat/${conversation.id}`);
  };

  // Enhanced Header Component - Cleaner design
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
          <Text style={styles.headerTitle}>Messages</Text>
          <Text style={styles.headerSubtitle}>
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
          </Text>
        </View>
        
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter-outline" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderConversation = ({ item }: { item: Conversation }) => {
    const customer = item.participants[0];
    const isUnread = item.unreadCount > 0;
    const isLastMessageFromCustomer = item.lastMessage.senderId !== user?.uid;
    
    const displayName = customer?.name || 'Customer';
    const displayAvatar = customer?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face';
    
    return (
      <TouchableOpacity 
        style={[
          styles.conversationItem,
          isUnread && styles.unreadConversationItem
        ]}
        onPress={() => handleConversationPress(item)}
      >
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: displayAvatar }} 
            style={styles.avatar}
            defaultSource={{ uri: 'https://via.placeholder.com/150' }}
          />
          {isUnread && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={[
              styles.conversationName,
              isUnread && styles.unreadConversationName
            ]}>
              {displayName}
            </Text>
            <Text style={[
              styles.timestamp,
              isUnread && styles.unreadTimestamp
            ]}>
              {formatTime(item.lastMessage.timestamp)}
            </Text>
          </View>
          
          <View style={styles.conversationPreview}>
            <Text 
              style={[
                styles.lastMessage, 
                isUnread && styles.unreadMessage
              ]}
              numberOfLines={1}
            >
              {isLastMessageFromCustomer ? '' : 'You: '}
              {item.lastMessage.text}
            </Text>
            
            {/* Message status indicator */}
            {!isLastMessageFromCustomer && (
              <Ionicons 
                name={item.lastMessage.read ? "checkmark-done" : "checkmark"} 
                size={16} 
                color={item.lastMessage.read ? COLORS.primary : COLORS.textMuted} 
                style={styles.messageStatus}
              />
            )}
          </View>

          {/* Role badge */}
          <View style={[
            styles.roleBadge,
            customer?.role === 'shopkeeper' ? styles.shopkeeperBadge : styles.customerBadge
          ]}>
            <Ionicons 
              name={customer?.role === 'shopkeeper' ? "storefront" : "person"} 
              size={10} 
              color={customer?.role === 'shopkeeper' ? COLORS.accent : COLORS.textSecondary} 
            />
            <Text style={[
              styles.roleBadgeText,
              customer?.role === 'shopkeeper' ? styles.shopkeeperBadgeText : styles.customerBadgeText
            ]}>
              {customer?.role === 'shopkeeper' ? 'Shopkeeper' : 'Customer'}
            </Text>
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
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Clean Header */}
      <Header />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
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

      {/* Conversations List */}
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
            {searchQuery ? 'No conversations found' : 'No messages yet'}
          </Text>
          <Text style={styles.emptyStateSubText}>
            {searchQuery 
              ? 'Try adjusting your search terms'
              : 'Customer messages will appear here when they contact you'
            }
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  // Header Styles
  header: {
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  filterButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
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
    paddingVertical: 12,
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
  // Conversation Item - Cleaner Design
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    marginBottom: 8,
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
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  unreadConversationName: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  unreadTimestamp: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  conversationPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    marginRight: 8,
  },
  unreadMessage: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  messageStatus: {
    marginLeft: 4,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight,
  },
  shopkeeperBadge: {
    backgroundColor: COLORS.accentLight,
  },
  customerBadge: {
    backgroundColor: COLORS.primaryLight,
  },
  roleBadgeText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginLeft: 4,
  },
  shopkeeperBadgeText: {
    color: COLORS.accent,
  },
  customerBadgeText: {
    color: COLORS.textSecondary,
  },
  arrowContainer: {
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIllustration: {
    padding: 20,
    backgroundColor: COLORS.inputBackground,
    borderRadius: 40,
    marginBottom: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});