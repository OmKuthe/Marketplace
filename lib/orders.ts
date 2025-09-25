// lib/orders.ts
import { collection, onSnapshot, doc, updateDoc, Timestamp , getDoc} from 'firebase/firestore';
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
  deliveryAddress: string;
  items: OrderItem[];
  paymentMethod: string;
  shopId: string;
  shopName?:string;
  status: OrderStatus;
  totalAmount: number;
  updatedAt: string;
}

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