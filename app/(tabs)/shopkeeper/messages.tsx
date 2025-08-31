import React, { useEffect, useState } from "react";
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Image,
  Dimensions
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";

const { width } = Dimensions.get('window');

// Define types for our messages
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
};

export default function ShopkeeperMessagesScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidePanelVisible, setSidePanelVisible] = useState(false);
  const router = useRouter();

  // Mock data - replace with actual data from your backend
  useEffect(() => {
    const mockConversations: Conversation[] = [
      {
        id: "1",
        participants: [
          {
            id: "2",
            name: "Sarah Johnson",
            role: "customer",
            avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
          }
        ],
        lastMessage: {
          id: "101",
          text: "Hi! I'm interested in the organic vegetables. Are they available for delivery?",
          timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
          senderId: "2",
          read: true
        },
        unreadCount: 0
      },
      {
        id: "2",
        participants: [
          {
            id: "3",
            name: "Mike Chen",
            role: "customer",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
          }
        ],
        lastMessage: {
          id: "102",
          text: "When will my bread order be ready for pickup?",
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
          senderId: "3",
          read: false
        },
        unreadCount: 1
      },
      {
        id: "3",
        participants: [
          {
            id: "4",
            name: "Emma Rodriguez",
            role: "customer",
            avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face"
          }
        ],
        lastMessage: {
          id: "103",
          text: "Thanks for the quick delivery! The milk was fresh and delicious.",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
          senderId: "4",
          read: true
        },
        unreadCount: 0
      },
      {
        id: "4",
        participants: [
          {
            id: "5",
            name: "David Kim",
            role: "customer",
            avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
          }
        ],
        lastMessage: {
          id: "104",
          text: "Do you have any seasonal fruits available this week?",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
          senderId: "5",
          read: true
        },
        unreadCount: 0
      },
      {
        id: "5",
        participants: [
          {
            id: "6",
            name: "Lisa Thompson",
            role: "customer",
            avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face"
          }
        ],
        lastMessage: {
          id: "105",
          text: "I'd like to place a bulk order for my restaurant. Can we discuss pricing?",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
          senderId: "6",
          read: false
        },
        unreadCount: 2
      }
    ];

    setConversations(mockConversations);
  }, []);

  const filteredConversations = conversations.filter(conv =>
    conv.participants[0].name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
        style={styles.menuItem}
        onPress={() => {
          setSidePanelVisible(false);
          router.push("/shopkeeper/products");
        }}
      >
        <Ionicons name="cube" size={20} color="#007AFF" />
        <Text style={styles.menuItemText}>Products</Text>
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
          router.push("/shopkeeper/profile");
        }}
      >
        <Ionicons name="person" size={20} color="#007AFF" />
        <Text style={styles.menuItemText}>Profile</Text>
      </TouchableOpacity>
    </View>
  );

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity 
      style={styles.conversationItem}
      onPress={() => router.push(`/chat/${item.id}`)}
    >
      <Image 
        source={{ uri: item.participants[0].avatar || 'https://via.placeholder.com/150' }} 
        style={styles.avatar}
      />
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.conversationName}>{item.participants[0].name}</Text>
          <Text style={styles.timestamp}>{formatTime(item.lastMessage.timestamp)}</Text>
        </View>
        <View style={styles.conversationPreview}>
          <Text 
            style={[
              styles.lastMessage, 
              !item.lastMessage.read && styles.unreadMessage
            ]}
            numberOfLines={1}
          >
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with menu button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSidePanelVisible(true)}>
          <Ionicons name="menu" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>💬 Customer Messages</Text>
        <TouchableOpacity>
          <Ionicons name="filter-outline" size={24} color="#007AFF" />
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
            placeholder="Search customer messages..."
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
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
          <Text style={styles.emptyStateText}>No customer messages yet</Text>
          <Text style={styles.emptyStateSubText}>
            Customers will appear here when they message you about your products
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
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
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