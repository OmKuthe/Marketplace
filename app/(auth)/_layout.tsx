import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="customer_profile" />
      <Stack.Screen name="shopkeeper_profile" />
    </Stack>
  );
}