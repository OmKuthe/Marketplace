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
  const [sidePanelVisible, setSidePanelVisible] = useState(false);
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

  const SidePanel = () => (
    <View style={styles.sidePanel}>
      <TouchableOpacity 
        style={styles.sidePanelClose} 
        onPress={() => setSidePanelVisible(false)}
      >
        <Ionicons name="close" size={24} color="#333" />
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
        <Ionicons name="home" size={20} color="#007AFF" />
        <Text style={styles.menuItemText}>Home</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => {
          setSidePanelVisible(false);
          router.push("/customer/search");
        }}
      >
        <Ionicons name="search" size={20} color="#007AFF" />
        <Text style={styles.menuItemText}>Search</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.menuItem, styles.activeMenuItem]}
        onPress={() => setSidePanelVisible(false)}
      >
        <Ionicons name="chatbubbles" size={20} color="#007AFF" />
        <Text style={styles.menuItemText}>Messages</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => {
          setSidePanelVisible(false);
          router.push("/customer/myorders");
        }}
      >
        <Ionicons name="list" size={20} color="#007AFF" />
        <Text style={styles.menuItemText}>Orders</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => {
          setSidePanelVisible(false);
          router.push("/customer/profile");
        }}
      >
        <Ionicons name="person" size={20} color="#007AFF" />
        <Text style={styles.menuItemText}>Profile</Text>
      </TouchableOpacity>
    </View>
  );

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
        <View style={styles.loadingContainer}>
          <Text>Loading conversations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with menu button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSidePanelVisible(true)}>
          <Ionicons name="menu" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>💬 Messages</Text>
        <TouchableOpacity>
          <Ionicons name="create-outline" size={24} color="#007AFF" />
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
            placeholder="Search conversations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
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
          <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
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
    backgroundColor: "#f9f9f9",
    marginTop:20
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginTop: 10,
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
    paddingTop: 50,
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
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
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
    color: '#333',
    marginBottom: 2,
  },
  roleBadge: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
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
    color: '#666',
    marginRight: 8,
  },
  unreadMessage: {
    color: '#333',
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: '#fff',
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
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});