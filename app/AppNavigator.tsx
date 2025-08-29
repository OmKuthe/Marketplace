import { Redirect, Stack } from "expo-router";
import { useAuth } from "@/hooks/useAuth";

export default function AppNavigator() {
  const { user, role, loading } = useAuth();

  if (loading) return null;

  if (!user) return <Stack screenOptions={{ headerShown: false }} />;

  if (role === "customer") return <Redirect href="/(tabs)/customer/home" />;
  if (role === "shopkeeper") return <Redirect href="/(tabs)/shopkeeper/home" />;

  return null;
}
