import { useCallback, useEffect, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ApiError, listChats, type Chat } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function ChatsScreen() {
  const router = useRouter();
  const { token, user, isLoading: authLoading } = useAuth();

  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.replace("/login");
      return;
    }
    if (user?.tipo_user !== "CRIADOR_DEMANDA" && user?.tipo_user !== "ENTREGADOR") {
      router.replace("/escolher-perfil");
    }
  }, [authLoading, token, user, router]);

  const loadChats = useCallback(async () => {
    if (!token) return;
    const data = await listChats(token);
    setChats(data);
  }, [token]);

  useEffect(() => {
    if (authLoading || !token) return;

    let cancelled = false;
    const bootstrap = async () => {
      try {
        await loadChats();
      } catch (error) {
        if (cancelled) return;
        const message =
          error instanceof ApiError ? error.message : "Não foi possível carregar os chats.";
        Alert.alert("Erro", message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [authLoading, token, loadChats]);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      loadChats().catch(() => undefined);
    }, [loadChats, token])
  );

  const onRefresh = async () => {
    if (!token) return;
    setRefreshing(true);
    try {
      await loadChats();
    } catch {
      Alert.alert("Erro", "Falha ao atualizar chats.");
    } finally {
      setRefreshing(false);
    }
  };

  const isEntregador = user?.tipo_user === "ENTREGADOR";

  if (authLoading || !token) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Conversas</Text>
          <Text style={styles.headerSubtitle}>
            {isEntregador ? "Seus fretes em andamento" : "Seus fretes com entregadores"}
          </Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <ChatCard
              chat={item}
              isEntregador={isEntregador}
              onPress={() => router.push(`/chat/${item.id}`)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={52} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>Nenhuma conversa ainda</Text>
              <Text style={styles.emptySubtitle}>
                {isEntregador
                  ? "Quando uma candidatura sua for aceita, o chat aparecerá aqui."
                  : "Quando você aceitar um entregador, o chat aparecerá aqui."}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

// ── Card de chat ─────────────────────────────────────────────────────────────

function ChatCard({
  chat,
  isEntregador,
  onPress,
}: {
  chat: Chat;
  isEntregador: boolean;
  onPress: () => void;
}) {
  const outroNome = isEntregador ? chat.criador_nome : chat.entregador_nome;
  const outroLabel = isEntregador ? "Contratante" : "Entregador";

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      {/* Avatar inicial */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {(outroNome ?? outroLabel).charAt(0).toUpperCase()}
        </Text>
      </View>

      {/* Info */}
      <View style={styles.cardBody}>
        <View style={styles.cardRow}>
          <Text style={styles.cardName} numberOfLines={1}>
            {outroNome ?? outroLabel}
          </Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Em andamento</Text>
          </View>
        </View>

        <Text style={styles.cardDemanda} numberOfLines={1}>
          {chat.demanda_titulo}
        </Text>

        <View style={styles.routeRow}>
          <Ionicons name="location-outline" size={12} color="#64748b" />
          <Text style={styles.routeText} numberOfLines={1}>
            {chat.demanda_origem}
          </Text>
          <Ionicons name="navigate-outline" size={12} color="#64748b" style={{ marginLeft: 6 }} />
          <Text style={styles.routeText} numberOfLines={1}>
            {chat.demanda_destino}
          </Text>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    backgroundColor: "#0f172a",
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  headerSubtitle: { color: "#cbd5e1", fontSize: 12, marginTop: 2 },
  listContent: { padding: 16, gap: 10, paddingBottom: 32 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: { fontSize: 20, fontWeight: "700", color: "#2563eb" },
  cardBody: { flex: 1, gap: 3 },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardName: { fontWeight: "700", fontSize: 14, color: "#0f172a", flex: 1 },
  badge: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: { fontSize: 11, color: "#166534", fontWeight: "600" },
  cardDemanda: { color: "#475569", fontSize: 13, fontWeight: "500" },
  routeRow: { flexDirection: "row", alignItems: "center", gap: 2, marginTop: 2 },
  routeText: { color: "#64748b", fontSize: 11, flex: 1 },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: "#334155" },
  emptySubtitle: { fontSize: 13, color: "#64748b", textAlign: "center", lineHeight: 19 },
});
