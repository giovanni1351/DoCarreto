import { usePathname, useRouter } from "expo-router";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";

// Telas onde o navbar NÃO deve aparecer
const HIDDEN_ON = [
  "/login",
  "/signup",
  "/escolher-perfil",
  "/cadastro-caminhoneiro",
  "/ressetPassword",
];

type NavItem = {
  label: string;
  route: string;
  icon: (active: boolean) => React.ReactNode;
  matchPrefix?: string;
};

const ITEMS_ENTREGADOR: NavItem[] = [
  {
    label: "Início",
    route: "/homeMotorista",
    icon: (a) => <Ionicons name={a ? "home" : "home-outline"} size={22} color={a ? "#2563eb" : "#64748b"} />,
  },
  {
    label: "Candidaturas",
    route: "/minhas-candidaturas",
    icon: (a) => (
      <MaterialCommunityIcons
        name={a ? "send-clock" : "send-clock-outline"}
        size={22}
        color={a ? "#2563eb" : "#64748b"}
      />
    ),
  },
  {
    label: "Conversas",
    route: "/chats",
    matchPrefix: "/chat",
    icon: (a) => (
      <Ionicons name={a ? "chatbubbles" : "chatbubbles-outline"} size={22} color={a ? "#2563eb" : "#64748b"} />
    ),
  },
];

const ITEMS_CRIADOR: NavItem[] = [
  {
    label: "Início",
    route: "/homeContratante",
    icon: (a) => <Ionicons name={a ? "home" : "home-outline"} size={22} color={a ? "#2563eb" : "#64748b"} />,
  },
  {
    label: "Novo frete",
    route: "/cadastro-demanda",
    icon: (a) => (
      <MaterialCommunityIcons
        name={a ? "plus-box" : "plus-box-outline"}
        size={24}
        color={a ? "#2563eb" : "#64748b"}
      />
    ),
  },
  {
    label: "Conversas",
    route: "/chats",
    matchPrefix: "/chat",
    icon: (a) => (
      <Ionicons name={a ? "chatbubbles" : "chatbubbles-outline"} size={22} color={a ? "#2563eb" : "#64748b"} />
    ),
  },
];

export function Navbar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Não renderiza se não estiver autenticado com papel definido
  if (!user || user.tipo_user === "NAO_DEFINIDO") return null;

  // Não renderiza nas telas de auth/onboarding
  if (HIDDEN_ON.some((p) => pathname === p)) return null;

  const items = user.tipo_user === "ENTREGADOR" ? ITEMS_ENTREGADOR : ITEMS_CRIADOR;

  return (
    <View style={styles.container}>
      {items.map((item) => {
        const isActive =
          pathname === item.route ||
          (item.matchPrefix ? pathname.startsWith(item.matchPrefix) : false);

        return (
          <TouchableOpacity
            key={item.route}
            style={styles.item}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.7}
          >
            {item.icon(isActive)}
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingBottom: Platform.OS === "ios" ? 20 : 6,
    paddingTop: 8,
    paddingHorizontal: 8,
    // Sombra sutil para web/Android
    ...Platform.select({
      web: { boxShadow: "0 -2px 12px rgba(0,0,0,0.06)" } as any,
      default: {
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
    }),
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingVertical: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748b",
  },
  labelActive: {
    color: "#2563eb",
  },
});
