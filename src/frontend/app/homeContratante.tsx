import { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { ApiError, listMyDemands, type Demand } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function ContratanteHomeScreen() {
  const router = useRouter();
  const { token, user, isLoading: authLoading, signOut } = useAuth();

  const [demands, setDemands] = useState<Demand[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  // Aguarda auth carregar e depois verifica permissão
  useEffect(() => {
    if (authLoading) return;

    if (!token) {
      router.replace("/login");
      return;
    }

    if (user?.tipo_user !== "CRIADOR_DEMANDA") {
      router.replace("/escolher-perfil");
      return;
    }
  }, [authLoading, token, user, router]);

  const loadDemands = useCallback(async () => {
    if (!token) return;
    const data = await listMyDemands(token);
    setDemands(data);
  }, [token]);

  useEffect(() => {
    if (authLoading || !token || user?.tipo_user !== "CRIADOR_DEMANDA") return;

    let cancelled = false;
    const bootstrap = async () => {
      try {
        await loadDemands();
      } catch (error) {
        if (cancelled) return;
        const message =
          error instanceof ApiError
            ? error.message
            : "Não foi possível carregar suas demandas.";
        Alert.alert("Erro", message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [authLoading, token, user, loadDemands]);

  useFocusEffect(
    useCallback(() => {
      if (!token || user?.tipo_user !== "CRIADOR_DEMANDA") return;
      loadDemands().catch(() => undefined);
    }, [loadDemands, token, user])
  );

  const onRefresh = async () => {
    if (!token) return;
    setRefreshing(true);
    try {
      await loadDemands();
    } catch {
      Alert.alert("Erro", "Falha ao atualizar demandas.");
    } finally {
      setRefreshing(false);
    }
  };

  const filtered = useMemo(() => {
    const text = search.trim().toLowerCase();
    if (!text) return demands;
    return demands.filter(
      (d) =>
        d.title.toLowerCase().includes(text) ||
        d.endereco_origem.toLowerCase().includes(text) ||
        d.endereco_destino.toLowerCase().includes(text)
    );
  }, [demands, search]);

  const stats = useMemo(
    () => ({
      total: demands.length,
      abertas: demands.filter((d) => d.status === "aberta").length,
      andamento: demands.filter((d) => d.status === "em_andamento").length,
      concluidas: demands.filter((d) => d.status === "concluida").length,
    }),
    [demands]
  );

  // Enquanto auth carrega ou está redirecionando, mostra spinner
  if (authLoading || !token || user?.tipo_user !== "CRIADOR_DEMANDA") {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Olá, {user?.nome ?? "Usuário"}</Text>
          <Text style={styles.subtitle}>Gerencie suas demandas</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => {
              signOut();
              router.replace("/login");
            }}
          >
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard label="Total" value={stats.total} icon="file-document" />
        <StatCard label="Abertas" value={stats.abertas} icon="package-variant" />
        <StatCard label="Andamento" value={stats.andamento} icon="clock-outline" />
        <StatCard label="Concluídas" value={stats.concluidas} icon="check-circle" />
      </View>

      {/* Busca */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#64748b" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por título ou cidade"
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#94a3b8"
        />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/demanda/${item.id}`)}
              activeOpacity={0.75}
            >
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardRoute}>
                <Ionicons name="location-outline" size={13} color="#64748b" /> {item.endereco_origem}
              </Text>
              <Text style={styles.cardRoute}>
                <Ionicons name="navigate-outline" size={13} color="#64748b" /> {item.endereco_destino}
              </Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardValue}>
                  R$ {item.valor_proposto.toLocaleString("pt-BR")}
                </Text>
                <Text style={styles.cardStatus}>{item.status.replace("_", " ")}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>Nenhuma demanda encontrada.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}) {
  return (
    <View style={styles.statCard}>
      <MaterialCommunityIcons name={icon} size={18} color="#2563eb" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  header: {
    backgroundColor: "#0f172a",
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { color: "#fff", fontSize: 22, fontWeight: "700" },
  subtitle: { color: "#cbd5e1", marginTop: 2 },
  headerActions: { flexDirection: "row", gap: 4 },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    marginTop: 14,
    gap: 8,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  statValue: { fontSize: 18, fontWeight: "700", color: "#0f172a", marginTop: 6 },
  statLabel: { fontSize: 12, color: "#64748b" },
  searchBox: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#0f172a" },
  listContent: { padding: 16, paddingBottom: 100, gap: 10 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardTitle: { fontWeight: "700", fontSize: 15, color: "#0f172a" },
  cardRoute: { color: "#475569", marginTop: 4, fontSize: 13 },
  cardFooter: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardValue: { color: "#2563eb", fontWeight: "700" },
  cardStatus: {
    textTransform: "capitalize",
    color: "#334155",
    fontSize: 12,
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  empty: { textAlign: "center", color: "#64748b", marginTop: 24 },
});
