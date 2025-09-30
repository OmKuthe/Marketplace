// app/chat/[id].tsx
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import React, { useEffect, useState, useRef } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Keyboard
} from 'react-native';
import { db } from '../../../firebaseConfig';
import { useAuth } from '../../../hooks/useAuth';

interface Message {
  id: string;
  text: string;
  senderId: string;
  createdAt: any;
  read?: boolean;
}

interface CustomerData {
  fullName: string;
  email?: string;
}

interface ShopkeeperData {
  businessName?: string;
  ownerName?: string;
  email?: string;
}

export default function ChatScreen() {
  const { id: conversationId } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [otherUserName, setOtherUserName] = useState<string>('Loading...');
  const [otherUserRole, setOtherUserRole] = useState<'customer' | 'shopkeeper' | null>(null);
  const [conversationData, setConversationData] = useState<any>(null);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  const flatListRef = useRef<FlatList>(null);
  const textInputRef = useRef<TextInput>(null);

  // Get avatar image based on user role
  const getAvatarImage = () => {
    if (otherUserRole === 'shopkeeper') {
      return require('../../../assets/images/shopkeeper.png');
    } else{
      return require('../../../assets/images/customer.png');
    }
  };

  // Identify and fetch other user's data
  const fetchOtherUserData = async (otherUserId: string) => {
    try {
      // Try to fetch from customers collection first
      const customerDoc = await getDoc(doc(db, 'customers', otherUserId));
      if (customerDoc.exists()) {
        const customerData = customerDoc.data() as CustomerData;
        setOtherUserName(customerData.fullName || 'Customer');
        setOtherUserRole('customer');
        return;
      }

      // If not found in customers, try shopkeepers collection
      const shopkeeperDoc = await getDoc(doc(db, 'shopkeepers', otherUserId));
      if (shopkeeperDoc.exists()) {
        const shopkeeperData = shopkeeperDoc.data() as ShopkeeperData;
        setOtherUserName(shopkeeperData.businessName || shopkeeperData.ownerName || 'Shopkeeper');
        setOtherUserRole('shopkeeper');
        return;
      }

      // If not found in either, use default
      setOtherUserName('User');
      setOtherUserRole(null);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setOtherUserName('User');
      setOtherUserRole(null);
    }
  };

  // Fetch conversation details and identify the other user
  useEffect(() => {
    if (!conversationId || !user) return;

    const fetchConversationDetails = async () => {
      try {
        const conversationDoc = await getDocs(
          query(collection(db, 'conversations'), where('__name__', '==', conversationId))
        );
        
        if (!conversationDoc.empty) {
          const data = conversationDoc.docs[0].data();
          setConversationData(data);
          
          // Find the other participant (not the current user)
          const participants = data.participants || [];
          const otherParticipantId = participants.find((id: string) => id !== user.uid);
          
          if (otherParticipantId) {
            await fetchOtherUserData(otherParticipantId);
          } else {
            setOtherUserName('User');
          }
        }
      } catch (error) {
        console.error('Error fetching conversation details:', error);
        setOtherUserName('User');
      } finally {
        setLoading(false);
      }
    };

    fetchConversationDetails();
  }, [conversationId, user]);

  // Real-time messages listener
  useEffect(() => {
    if (!conversationId || !user) return;

    const messagesRef = collection(db, 'conversations', conversationId as string, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const messagesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Message[];
        
        setMessages(messagesData);
      },
      (error) => {
        console.error('Error listening to messages:', error);
      }
    );

    return unsubscribe;
  }, [conversationId, user]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    }
  }, [messages]);

  // Keyboard handling
  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardOffset(e.endCoordinates.height);
      }
    );

    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardOffset(0);
      }
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !conversationId) return;

    try {
      const messagesRef = collection(db, 'conversations', conversationId as string, 'messages');
      
      // Add new message to subcollection
      await addDoc(messagesRef, {
        text: newMessage.trim(),
        senderId: user.uid,
        createdAt: serverTimestamp(),
        read: false
      });

      const conversationRef = doc(db, 'conversations', conversationId as string);
      await updateDoc(conversationRef, {
        lastMessage: {
          text: newMessage.trim(),
          timestamp: serverTimestamp(),
          senderId: user.uid,
          read: false
        },
        updatedAt: serverTimestamp()
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.senderId === user?.uid;
    
    return (
      <View style={[
        styles.messageBubble,
        isMyMessage ? styles.myMessage : styles.theirMessage
      ]}>
        <Text style={isMyMessage ? styles.myMessageText : styles.theirMessageText}>
          {item.text}
        </Text>
        <Text style={styles.timestamp}>
          {item.createdAt?.toDate?.()?.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          }) || 'Sending...'}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text>Loading conversation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        
        <View style={styles.headerUserInfo}>
          <Image 
            source={getAvatarImage()} 
            style={styles.headerAvatar}
          />
          <View style={styles.headerText}>
            <Text style={styles.headerName}>{otherUserName}</Text>
            <Text style={styles.headerStatus}>
              {otherUserRole === 'shopkeeper' ? 'Shopkeeper' : 
               otherUserRole === 'customer' ? 'Customer' : 'User'}
            </Text>
          </View>
        </View>
        
        <View style={styles.headerSpacer} />
      </View>

      {/* Main content */}
      <View style={styles.content}>
        {/* Messages List */}
        {messages.length > 0 ? (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            style={styles.messagesList}
            contentContainerStyle={[
              styles.messagesContainer,
              { 
                paddingBottom: keyboardOffset > 0 ? keyboardOffset + 100 : 100 
              }
            ]}
            inverted={true}
            showsVerticalScrollIndicator={false}
            automaticallyAdjustContentInsets={false}
            maintainVisibleContentPosition={{
              minIndexForVisible: 0,
            }}
          />
        ) : (
          <View style={styles.emptyChat}>
            <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
            <Text style={styles.emptyChatText}>No messages yet</Text>
            <Text style={styles.emptyChatSubText}>Start the conversation!</Text>
          </View>
        )}
      </View>

      {/* Message Input - Fixed positioning with proper keyboard offset */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={styles.keyboardAvoidingView}
      >
        <View style={[styles.inputWrapper, { 
          marginBottom: keyboardOffset > 0 ? keyboardOffset : 0 
        }]}>
          <View style={styles.inputContainer}>
            <TextInput
              ref={textInputRef}
              style={styles.textInput}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type a message..."
              multiline
              maxLength={500}
              placeholderTextColor="#999"
              onFocus={() => {
                setTimeout(() => {
                  flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
                }, 300);
              }}
            />
            <TouchableOpacity 
              style={[
                styles.sendButton, 
                !newMessage.trim() && styles.sendButtonDisabled
              ]} 
              onPress={sendMessage}
              disabled={!newMessage.trim()}
            >
              {newMessage.trim() ? (
                <Ionicons 
                  name="arrow-up" 
                  size={20} 
                  color="white" 
                />
              ) : (
                <Ionicons 
                  name="ellipse-outline" 
                  size={20} 
                  color="#ccc" 
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  content: {
    flex: 1,
  },
  keyboardAvoidingView: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  inputWrapper: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  bottomSpacer: {
    height: 80,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  backButton: {
    padding: 4,
  },
  headerUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginLeft: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
    alignItems: 'center',
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  headerStatus: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 36,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    marginVertical: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  myMessageText: {
    color: 'white',
    fontSize: 16,
    lineHeight: 20,
  },
  theirMessageText: {
    color: '#333',
    fontSize: 16,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 11,
    opacity: 0.7,
    marginTop: 4,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    alignItems: 'flex-end',
    minHeight: 70,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    marginRight: 8,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  sendButton: {
    backgroundColor: '#000',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#f0f0f0',
    shadowOpacity: 0,
    elevation: 0,
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyChatText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyChatSubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});