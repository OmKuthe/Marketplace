import { Stack, useRouter, useSegments } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect } from "react";
import { auth, db } from "../../firebaseConfig";

export default function Layout() {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Get the current route path
      const currentRoute = segments.join('/');
      console.log("Current route:", currentRoute);
      
      if (user) {
        // User is signed in
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const role = userData?.role || "customer";
            
            // If we're on auth screens, redirect to appropriate home
            if (currentRoute === "" || currentRoute === "signup") {
              // Use a switch statement to navigate to the correct route
              if (role === "customer") {
                router.replace("/customer/home");
              } else if (role === "shopkeeper") {
                router.replace("/shopkeeper/home");
              }
            }
          } else {
            // User document doesn't exist, redirect to signup
            if (currentRoute !== "signup") {
              router.replace("/signup");
            }
          }
        } catch (error) {
          console.error("Error checking user document:", error);
        }
      } else {
        // User is not signed in
        // Redirect to login if not already there
        if (currentRoute !== "" && currentRoute !== "signup") {
          router.replace("/");
        }
      }
    });

    return unsubscribe;
  }, [segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="customer/home" />
      <Stack.Screen name="customer/search" />
      <Stack.Screen name="customer/messages" />
      <Stack.Screen name="customer/myorders" />
      <Stack.Screen name="customer/profile" />
      <Stack.Screen name="shopkeeper/home" />
      <Stack.Screen name="shopkeeper/search" />
      <Stack.Screen name="shopkeeper/messages" />
      <Stack.Screen name="shopkeeper/myorders" />
      <Stack.Screen name="shopkeeper/profile" />
    </Stack>
  );
}