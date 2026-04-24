import { Stack } from "expo-router";

import { AuthProvider } from "@/lib/auth";

export default function Layout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}
