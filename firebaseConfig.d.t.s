declare module "firebaseConfig" {
  export const auth: import("firebase/auth").Auth;
  export const db: import("firebase/firestore").Firestore;
  export const rtdb: import("firebase/database").Database;
  export const storage: import("firebase/storage").FirebaseStorage;
  const app: import("firebase/app").FirebaseApp;
  export default app;
}
