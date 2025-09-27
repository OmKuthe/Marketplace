// lib/orders.ts
import { collection, onSnapshot, doc, updateDoc, Timestamp , getDoc,addDoc} from 'firebase/firestore';
import { db } from '../firebaseConfig';

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  createdAt: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAvatar?:string;
  deliveryAddress: string;
  items: OrderItem[];
  paymentMethod: string;
  shopId: string;
  shopName?:string;
  status: OrderStatus;
  totalAmount: number;
  updatedAt: string;
  specialInstructions?: string;
  
}


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

export const getShopName = async (shopId: string): Promise<string> => {
  try {
    const shopDoc = await getDoc(doc(db, 'shopkeepers', shopId));
    if (shopDoc.exists()) {
      const shopData = shopDoc.data();
      return shopData.shopName || shopData.name || `Shop ${shopId.substring(0, 6)}`;
    }
    return `Shop ${shopId.substring(0, 6)}`;
  } catch (error) {
    console.error('Error fetching shop name:', error);
    return `Shop ${shopId.substring(0, 6)}`;
  }
};

// Helper function to convert Firebase Timestamp to string
const convertTimestampToString = (timestamp: any): string => {
  if (timestamp && typeof timestamp === 'object') {
    // Handle Firebase Timestamp
    if (timestamp.seconds !== undefined && timestamp.nanoseconds !== undefined) {
      const date = new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
      return date.toISOString();
    }
    // Handle Date object
    if (timestamp.toDate) {
      return timestamp.toDate().toISOString();
    }
  }
  // If it's already a string or other format, return as is
  return String(timestamp);
};

// Subscribe to shopkeeper orders
export const subscribeToOrders = (shopId: string, callback: (orders: Order[]) => void) => {
  return onSnapshot(collection(db, 'orders'), (snapshot) => {
    const ordersData: Order[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.shopId === shopId) {
        ordersData.push({
          id: doc.id,
          createdAt: convertTimestampToString(data.createdAt),
          customerId: data.customerId,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          deliveryAddress: data.deliveryAddress,
          items: data.items || [],
          paymentMethod: data.paymentMethod,
          shopId: data.shopId,
          status: data.status,
          totalAmount: data.totalAmount,
          updatedAt: convertTimestampToString(data.updatedAt)
        });
      }
    });
    
    callback(ordersData);
  });
};

// Subscribe to customer orders
export const subscribeToCustomerOrders = (customerId: string, callback: (orders: Order[]) => void) => {
  return onSnapshot(collection(db, 'orders'), (snapshot) => {
    const ordersData: Order[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.customerId === customerId) {
        ordersData.push({
          id: doc.id,
          createdAt: convertTimestampToString(data.createdAt),
          customerId: data.customerId,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          deliveryAddress: data.deliveryAddress,
          items: data.items || [],
          paymentMethod: data.paymentMethod,
          shopId: data.shopId,
          status: data.status,
          totalAmount: data.totalAmount,
          updatedAt: convertTimestampToString(data.updatedAt)
        });
      }
    });
    
    callback(ordersData);
  });
};

// Update order status
export const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
  const orderRef = doc(db, 'orders', orderId);
  await updateDoc(orderRef, {
    status: newStatus,
    updatedAt: new Date().toISOString()
  });
};

// Get orders (optional - if you need a one-time fetch)
export const getOrders = async (shopId: string): Promise<Order[]> => {
  // Implementation for one-time fetch if needed
  return [];
};

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

export async function getOrderById(orderId: string): Promise<Order | null> {
  try {
    const docRef = doc(db, "orders", orderId);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return null;
    }

    return { id: snap.id, ...snap.data() } as Order;
  } catch (error) {
    console.error("Error fetching order:", error);
    throw error;
  }
}