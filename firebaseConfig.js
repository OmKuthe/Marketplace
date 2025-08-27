import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB-GkBxI6Ch9wb69oaz8aQcazyqWTL1bP4",
  authDomain: "marketplace-71979.firebaseapp.com",
  projectId: "marketplace-71979",
  storageBucket: "marketplace-71979.appspot.com", 
  messagingSenderId: "282914115298",
  appId: "1:282914115298:web:3dc426fd3054e2813098bb",
  measurementId: "G-HBH9NLWLZS"
};

const app = initializeApp(firebaseConfig);


export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const storage = getStorage(app);

export default app;
