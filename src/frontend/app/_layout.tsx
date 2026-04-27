import { Stack } from "expo-router";
import { View, StyleSheet } from "react-native";
import { AuthProvider } from "@/lib/auth";
import { Navbar } from "@/components/navbar";

export default function Layout() {
  return (
    <AuthProvider>
      <View style={styles.root}>
        <Stack screenOptions={{ headerShown: false }} />
        <Navbar />
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
