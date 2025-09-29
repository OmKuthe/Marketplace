import { Stack, useRouter, useSegments } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, View, Text } from "react-native";
import { auth, db } from "../firebaseConfig";

export default function RootLayout() {
  const segments = useSegments();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const currentRoute = segments.join('/');
      console.log("🔍 Auth State Changed - Route:", currentRoute, "User:", user?.uid);
      
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const role = userData?.role || "customer";
            const profileCompleted = userData?.profileCompleted || false;

            console.log("📊 User Data:", { 
              role, 
              profileCompleted,
              hasProfileCompletedField: 'profileCompleted' in userData 
            });

            // If we're on login/signup pages and user is authenticated
            if (currentRoute === "" || currentRoute === "signup") {
              if (profileCompleted) {
                console.log("🏠 Profile COMPLETED - Redirecting to home");
                if (role === "customer") {
                  router.replace("/(tabs)/customer/home");
                } else {
                  router.replace("/(tabs)/shopkeeper/home");
                }
              } else {
                console.log("📝 Profile NOT completed - Redirecting to profile setup");
                if (role === "customer") {
                  router.replace("/(auth)/customer_profile");
                } else {
                  router.replace("/(auth)/shopkeeper_profile");
                }
              }
            }
            // If profile is not completed and we're not on profile setup, redirect to profile setup
            else if (!profileCompleted && !currentRoute.includes('customer-profile') && !currentRoute.includes('shopkeeper-profile')) {
              console.log("🚀 Profile not completed - Redirecting to profile setup");
              if (role === "customer") {
                router.replace("/(auth)/customer_profile");
              } else {
                router.replace("/(auth)/shopkeeper_profile");
              }
            }
            // If profile is completed and we're on profile setup, redirect to home
            else if (profileCompleted && currentRoute.includes('auth')) {
              console.log("✅ Profile completed - Redirecting to home from profile setup");
              if (role === "customer") {
                router.replace("/(tabs)/customer/home");
              } else {
                router.replace("/(tabs)/shopkeeper/home");
              }
            }
            else {
              console.log("✅ No redirect needed");
              setLoading(false);
            }
          } else {
            console.log("❌ User document doesn't exist");
            if (currentRoute !== "signup") {
              router.replace("/signup");
            }
            setLoading(false);
          }
        } catch (error) {
          console.error("❌ Error checking user document:", error);
          setLoading(false);
        }
      } else {
        console.log("👤 No user signed in - Route:", currentRoute);
        // Only redirect to login if we're on protected routes
        if (
          currentRoute.includes('tabs') || 
          currentRoute.includes('customer') || 
          currentRoute.includes('shopkeeper') ||
          (currentRoute.includes('profile') && !currentRoute.includes('auth'))
        ) {
          console.log("🔐 Redirecting to login from protected route");
          router.replace("/");
        } else {
          setLoading(false);
        }
      }
    });

    return unsubscribe;
  }, [segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}