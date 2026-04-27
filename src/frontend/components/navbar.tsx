import { usePathname, useRouter } from "expo-router";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { useEffect, useRef, useState } from "react";

const SIDEBAR_BREAKPOINT = 768;
const SIDEBAR_EXPANDED_WIDTH = 220;
const SIDEBAR_COLLAPSED_WIDTH = 64;

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

function makeIcon(name: string, nameOutline: string, size = 20): NavItem["icon"] {
  return (active) => (
    <Ionicons
      name={(active ? name : nameOutline) as any}
      size={size}
      color={active ? "#2563eb" : "#64748b"}
    />
  );
}

function makeMCIcon(name: string, nameOutline: string, size = 20): NavItem["icon"] {
  return (active) => (
    <MaterialCommunityIcons
      name={(active ? name : nameOutline) as any}
      size={size}
      color={active ? "#2563eb" : "#64748b"}
    />
  );
}

const ITEMS_ENTREGADOR: NavItem[] = [
  {
    label: "Início",
    route: "/homeMotorista",
    icon: makeIcon("home", "home-outline"),
  },
  {
    label: "Candidaturas",
    route: "/minhas-candidaturas",
    icon: makeMCIcon("send-clock", "send-clock-outline"),
  },
  {
    label: "Conversas",
    route: "/chats",
    matchPrefix: "/chat",
    icon: makeIcon("chatbubbles", "chatbubbles-outline"),
  },
];

const ITEMS_CRIADOR: NavItem[] = [
  {
    label: "Início",
    route: "/homeContratante",
    icon: makeIcon("home", "home-outline"),
  },
  {
    label: "Novo frete",
    route: "/cadastro-demanda",
    icon: makeMCIcon("plus-box", "plus-box-outline", 22),
  },
  {
    label: "Conversas",
    route: "/chats",
    matchPrefix: "/chat",
    icon: makeIcon("chatbubbles", "chatbubbles-outline"),
  },
];

// ── Sidebar (desktop) ─────────────────────────────────────────────────────────

function Sidebar({ items, pathname }: { items: NavItem[]; pathname: string }) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const animWidth = useRef(new Animated.Value(SIDEBAR_EXPANDED_WIDTH)).current;
  const animOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(animWidth, {
        toValue: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH,
        useNativeDriver: false,
        bounciness: 0,
        speed: 20,
      }),
      Animated.timing(animOpacity, {
        toValue: collapsed ? 0 : 1,
        duration: 120,
        useNativeDriver: false,
      }),
    ]).start();
  }, [collapsed]);

  return (
    <Animated.View style={[styles.sidebar, { width: animWidth }]}>
      {/* ── Brand / toggle ── */}
      <View style={styles.sidebarHeader}>
        {!collapsed && (
          <Animated.View style={[styles.brandRow, { opacity: animOpacity }]}>
            <MaterialCommunityIcons name="truck-delivery" size={22} color="#2563eb" />
            <Text style={styles.brandText}>DoCarreto</Text>
          </Animated.View>
        )}
        <TouchableOpacity
          style={[styles.toggleBtn, collapsed && styles.toggleBtnCentered]}
          onPress={() => setCollapsed((c) => !c)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={collapsed ? "chevron-forward" : "chevron-back"}
            size={16}
            color="#64748b"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      {/* ── Itens ── */}
      <View style={styles.sidebarItems}>
        {items.map((item) => {
          const isActive =
            pathname === item.route ||
            (item.matchPrefix ? pathname.startsWith(item.matchPrefix) : false);

          return (
            <Pressable
              key={item.route}
              style={({ hovered }: any) => [
                styles.sidebarItem,
                collapsed && styles.sidebarItemCollapsed,
                isActive && styles.sidebarItemActive,
                !isActive && hovered && styles.sidebarItemHovered,
              ]}
              onPress={() => router.push(item.route as any)}
            >
              {/* Indicador lateral ativo */}
              {isActive && <View style={styles.activeIndicator} />}

              <View style={styles.sidebarItemIcon}>{item.icon(isActive)}</View>

              {!collapsed && (
                <Animated.Text
                  style={[
                    styles.sidebarLabel,
                    isActive && styles.labelActive,
                    { opacity: animOpacity },
                  ]}
                  numberOfLines={1}
                >
                  {item.label}
                </Animated.Text>
              )}

              {/* Tooltip quando colapsado */}
              {collapsed && (
                <View style={styles.tooltip}>
                  <Text style={styles.tooltipText}>{item.label}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
}

// ── Bottom bar (mobile) ───────────────────────────────────────────────────────

function BottomBar({ items, pathname }: { items: NavItem[]; pathname: string }) {
  const router = useRouter();
  return (
    <View style={styles.bottombar}>
      {items.map((item) => {
        const isActive =
          pathname === item.route ||
          (item.matchPrefix ? pathname.startsWith(item.matchPrefix) : false);
        return (
          <TouchableOpacity
            key={item.route}
            style={styles.bottomItem}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.7}
          >
            {item.icon(isActive)}
            <Text style={[styles.bottomLabel, isActive && styles.labelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────

export function Navbar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const { width } = useWindowDimensions();

  if (!user || user.tipo_user === "NAO_DEFINIDO") return null;
  if (HIDDEN_ON.some((p) => pathname === p)) return null;

  const items = user.tipo_user === "ENTREGADOR" ? ITEMS_ENTREGADOR : ITEMS_CRIADOR;
  const isSidebar = Platform.OS === "web" && width >= SIDEBAR_BREAKPOINT;

  if (isSidebar) return <Sidebar items={items} pathname={pathname} />;
  return <BottomBar items={items} pathname={pathname} />;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Sidebar ──────────────────────────────────────────────────────────────
  sidebar: {
    backgroundColor: "#fff",
    borderRightWidth: 1,
    borderRightColor: "#e2e8f0",
    paddingVertical: 16,
    overflow: "hidden",
    ...(({ boxShadow: "2px 0 10px rgba(0,0,0,0.04)" } as any)),
  },
  sidebarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingBottom: 10,
    minHeight: 40,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  brandText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.3,
  },
  toggleBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f5f9",
    flexShrink: 0,
  },
  toggleBtnCentered: {
    marginHorizontal: "auto" as any,
  },
  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginHorizontal: 12,
    marginBottom: 10,
  },
  sidebarItems: {
    gap: 2,
    paddingHorizontal: 8,
  },
  sidebarItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    position: "relative",
    overflow: "hidden",
  } as any,
  sidebarItemCollapsed: {
    justifyContent: "center",
    paddingHorizontal: 0,
    marginHorizontal: 4,
  },
  sidebarItemActive: {
    backgroundColor: "#eff6ff",
  },
  sidebarItemHovered: {
    backgroundColor: "#f8fafc",
  },
  activeIndicator: {
    position: "absolute",
    left: 0,
    top: 6,
    bottom: 6,
    width: 3,
    borderRadius: 2,
    backgroundColor: "#2563eb",
  },
  sidebarItemIcon: {
    width: 24,
    alignItems: "center",
    flexShrink: 0,
  },
  sidebarLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
    flex: 1,
  },
  tooltip: {
    position: "absolute",
    left: 68,
    backgroundColor: "#0f172a",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    zIndex: 100,
    pointerEvents: "none",
  } as any,
  tooltipText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    whiteSpace: "nowrap",
  } as any,

  // ── Bottom bar ────────────────────────────────────────────────────────────
  bottombar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingBottom: Platform.OS === "ios" ? 20 : 6,
    paddingTop: 8,
    paddingHorizontal: 8,
    ...(Platform.OS === "web"
      ? ({ boxShadow: "0 -2px 12px rgba(0,0,0,0.06)" } as any)
      : {
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        }),
  },
  bottomItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bottomLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748b",
  },

  // ── Shared ────────────────────────────────────────────────────────────────
  labelActive: {
    color: "#2563eb",
  },
});
