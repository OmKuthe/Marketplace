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

// Use the SAME color palette from previous code
const colors = {
  background: '#f8fafc',
  surface: '#ffffff',
  textPrimary: '#1e293b',
  textSecondary: '#64748b',
  accent: '#3b82f6',
  accentLight: '#60a5fa',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  border: '#e2e8f0',
  darkButton: '#1e293b',
  needColor: '#f97316',
  offerColor: '#10b981',
  gradientPrimary: ['#667eea', '#764ba2'],
  gradientSecondary: ['#f093fb', '#f5576c'],
  gradientSuccess: ['#10b981', '#34d399'],
  gradientWarning: ['#f59e0b', '#fbbf24'],
  needCard: 'rgba(249, 115, 22, 0.08)',
  offerCard: 'rgba(16, 185, 129, 0.08)',
  lightBackground: 'rgba(226, 232, 240, 0.4)',
  electricPurple: '#8b5cf6',
  deepBlue: '#1e40af',
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

export default function MessagesScreen() {
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
          userName = 'Unknown User';
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
      name: 'Unknown User',
      role: 'customer'
    };
    
  } catch (error) {
    console.error('❌ Error fetching user details:', error);
    return {
      id: participantId,
      name: 'Unknown User',
      role: 'customer'
    };
  }
};

  // Fetch real conversations from Firestore
  useEffect(() => {
    if (!user) return;
  
    const conversationsRef = collection(db, 'conversations');
    
    const q = query(
      conversationsRef, 
      where('participants', 'array-contains', user.uid)
    );
      
    console.log('Querying conversations for user:', user.uid);
  
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
  
          // Get participant details
          const participantDetails: User[] = [];
          for (const participantId of data.participants) {
            if (participantId !== user.uid) {
              const userDetails = await fetchUserDetails(participantId);
              participantDetails.push(userDetails);
            }
          }

          // Handle case where all participants are the current user
          if (participantDetails.length === 0) {
            console.log('No other participants found, skipping conversation');
            continue;
          }
  
          // Calculate unread count
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

  const renderConversation = ({ item }: { item: Conversation }) => {
    const otherParticipant = item.participants[0]; // The other user in the conversation
    
    // Determine display name and avatar
    const displayName = otherParticipant?.name || 'Unknown User';
    const displayAvatar = otherParticipant?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face';
    const roleText = otherParticipant?.role === 'shopkeeper' ? 'Shopkeeper' : 'Customer';
    
    return (
      <TouchableOpacity 
        style={styles.conversationItem}
        onPress={() => router.push(`/chat/${item.id}`)}
      >
        <Image 
          source={{ uri: displayAvatar }} 
          style={styles.avatar}
          defaultSource={{ uri: 'https://via.placeholder.com/150' }}
        />
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <View style={styles.nameContainer}>
              <Text style={styles.conversationName}>
                {displayName}
              </Text>
              <Text style={styles.roleBadge}>
                {roleText}
              </Text>
            </View>
            <Text style={styles.timestamp}>
              {formatTime(item.lastMessage.timestamp)}
            </Text>
          </View>
          <View style={styles.conversationPreview}>
            <Text 
              style={[
                styles.lastMessage, 
                item.unreadCount > 0 && styles.unreadMessage
              ]}
              numberOfLines={1}
            >
              {item.lastMessage.senderId === user?.uid ? 'You: ' : ''}
              {item.lastMessage.text}
            </Text>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {/* UPDATED: Header with Logo in Top Left */}
        <View style={styles.header}>
          <View style={styles.headerLogoContainer}>
            <Image 
              source={require('../../../assets/images/logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>TownMart</Text>
            <Text style={styles.headerSubtitle}>Messages</Text>
          </View>
          
          <View style={styles.headerButton} />
        </View>
        <View style={styles.loadingContainer}>
          <Text>Loading conversations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* UPDATED: Header with Logo in Top Left */}
      <View style={styles.header}>
        <View style={styles.headerLogoContainer}>
          <Image 
            source={require('../../../assets/images/logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>TownMart</Text>
          <Text style={styles.headerSubtitle}>Messages</Text>
        </View>
        
        <View style={styles.headerButton} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={colors.accent} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.textSecondary}
          />
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
          <Ionicons name="chatbubble-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyStateText}>
            {searchQuery ? 'No conversations found' : 'No conversations yet'}
          </Text>
          <Text style={styles.emptyStateSubText}>
            {searchQuery 
              ? 'Try adjusting your search terms'
              : 'Start a conversation with a shopkeeper from their post or profile'
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
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // UPDATED: Header with Logo in Top Left
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 19,
    paddingBottom: 12,
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerLogoContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.lightBackground,
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.lightBackground,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.deepBlue,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '500',
    marginTop: 2,
  },
  // REMOVED: All sidebar-related styles
  searchContainer: {
    padding: 20,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 0,
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  listContainer: {
    padding: 20,
    paddingTop: 8,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  nameContainer: {
    flex: 1,
    marginRight: 8,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  roleBadge: {
    fontSize: 12,
    color: colors.textSecondary,
    backgroundColor: colors.lightBackground,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  timestamp: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  conversationPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: 8,
  },
  unreadMessage: {
    color: colors.textPrimary,
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    paddingTop: 100,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});