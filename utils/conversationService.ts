// utils/conversationService.ts
import {
    addDoc,
    collection,
    doc,
    getDocs,
    query,
    serverTimestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
  
  export const conversationService = {
    async findOrCreateConversation(currentUserId: string, otherUserId: string): Promise<string> {
      try {
        console.log('Finding or creating conversation between:', currentUserId, 'and', otherUserId);
        
        // Check if conversation already exists
        const conversationsRef = collection(db, 'conversations');
        const q = query(
          conversationsRef, 
          where('participants', 'array-contains', currentUserId)
        );
        
        const snapshot = await getDocs(q);
        
        // Look for existing conversation
        for (const docSnapshot of snapshot.docs) {
          const data = docSnapshot.data();
          if (data.participants && 
              Array.isArray(data.participants) && 
              data.participants.includes(otherUserId)) {
            console.log('Found existing conversation:', docSnapshot.id);
            return docSnapshot.id;
          }
        }
        
        // Create new conversation
        console.log('Creating new conversation...');
        const newConversation = {
          participants: [currentUserId, otherUserId],
          lastMessage: {
            text: "Conversation started",
            timestamp: serverTimestamp(),
            senderId: currentUserId,
            read: false
          },
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, 'conversations'), newConversation);
        console.log('New conversation created with ID:', docRef.id);
        return docRef.id;
        
      } catch (error) {
        console.error('Error in findOrCreateConversation:', error);
        throw error;
      }
    },
    
    async sendInitialMessage(conversationId: string, senderId: string, product?: any) {
      try {
        console.log('Sending initial message to conversation:', conversationId);
        
        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
        const initialMessage = product 
          ? `Hi! I'm interested in your product: ${product.name} - $${product.price}`
          : "Hi! I'd like to chat with you about your products";
        
        // Add message to subcollection
        await addDoc(messagesRef, {
          text: initialMessage,
          senderId: senderId,
          createdAt: serverTimestamp(),
          read: false
        });
        
        // Update conversation's last message
        const conversationRef = doc(db, 'conversations', conversationId);
        await updateDoc(conversationRef, {
          lastMessage: {
            text: initialMessage,
            timestamp: serverTimestamp(),
            senderId: senderId,
            read: false
          },
          updatedAt: serverTimestamp()
        });
        
        console.log('Initial message sent successfully');
        
      } catch (error) {
        console.error('Error sending initial message:', error);
        throw error;
      }
    }
  };