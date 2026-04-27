import { Stack } from "expo-router";
import { Platform, StyleSheet, useWindowDimensions, View } from "react-native";
import { AuthProvider } from "@/lib/auth";
import { Navbar } from "@/components/navbar";
import { usePathname } from "expo-router";

const SIDEBAR_BREAKPOINT = 768;

const HIDDEN_ON = [
  "/login",
  "/signup",
  "/escolher-perfil",
  "/cadastro-caminhoneiro",
  "/ressetPassword",
];

function AppShell({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const pathname = usePathname();

  const isSidebar =
    Platform.OS === "web" &&
    width >= SIDEBAR_BREAKPOINT &&
    !HIDDEN_ON.some((p) => pathname === p);

  return (
    <View style={isSidebar ? styles.shellRow : styles.shellColumn}>
      {isSidebar && <Navbar />}
      <View style={styles.content}>{children}</View>
      {!isSidebar && <Navbar />}
    </View>
  );
}

export default function Layout() {
  return (
    <AuthProvider>
      <AppShell>
        <Stack screenOptions={{ headerShown: false }} />
      </AppShell>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  shellRow: {
    flex: 1,
    flexDirection: "row",
  },
  shellColumn: {
    flex: 1,
    flexDirection: "column",
  },
  content: {
    flex: 1,
  },
});
