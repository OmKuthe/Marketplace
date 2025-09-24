// lib/orders.ts
import { 
    collection, 
    doc, 
    getDocs, 
    getDoc, 
    addDoc,
    updateDoc, 
    onSnapshot,
    query,
    where,
    orderBy,
    Timestamp 
  } from 'firebase/firestore';
  import { db } from '../firebaseConfig';
  
  export type OrderItem = {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  };
  
  export type Order = {
    id: string;
    customerId: string;
    customerName: string;
    customerAvatar?: string;
    items: OrderItem[];
    totalAmount: number;
    status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
    createdAt: Date;
    updatedAt: Date;
    deliveryAddress?: string;
    paymentMethod: 'cash' | 'card' | 'upi' | 'wallet';
    customerPhone?: string;
    specialInstructions?: string;
    shopId?: string; // Add shopId to filter by shop
  };
  
  // Convert Firestore data to Order
  const convertToOrder = (doc: any): Order => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  };
  
  // Fetch all orders for a specific shop
  export const getOrders = async (shopId: string): Promise<Order[]> => {
    try {
      const ordersRef = collection(db, 'orders');
      const q = query(
        ordersRef, 
        where('shopId', '==', shopId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(convertToOrder);
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  };
  
  // Fetch single order by ID
  export const getOrderById = async (orderId: string): Promise<Order | null> => {
    try {
      const docRef = doc(db, 'orders', orderId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return convertToOrder(docSnap);
      }
      return null;
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  };
  
  // Update order status
  export const updateOrderStatus = async (orderId: string, status: Order['status']): Promise<void> => {
    try {
      const docRef = doc(db, 'orders', orderId);
      await updateDoc(docRef, {
        status,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  };
  
  // Real-time orders listener
  export const subscribeToOrders = (
    shopId: string, 
    callback: (orders: Order[]) => void
  ): (() => void) => {
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef, 
      where('shopId', '==', shopId),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(convertToOrder);
      callback(orders);
    });
  };

  // Add to lib/orders.ts
export type CreateOrderData = {
  customerId: string;
  customerName: string;
  customerAvatar?: string;
  items: OrderItem[];
  totalAmount: number;
  deliveryAddress?: string;
  paymentMethod: 'cash' | 'card' | 'upi' | 'wallet';
  customerPhone?: string;
  specialInstructions?: string;
  shopId: string; // Important: which shop this order is for
};

// Function to create a new order
export const createOrder = async (orderData: CreateOrderData): Promise<string> => {
  try {
    const ordersRef = collection(db, 'orders');
    const docRef = await addDoc(ordersRef, {
      ...orderData,
      status: 'pending' as const,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};