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

import {
  ApiError,
  createCandidatura,
  listDemands,
  type Demand,
  type DemandStatus,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function MotoristaHomeScreen() {
  const router = useRouter();
  const { token, user, isLoading: authLoading, signOut } = useAuth();

  const [demands, setDemands] = useState<Demand[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | DemandStatus>("todos");

  // Aguarda auth carregar e verifica permissão
  useEffect(() => {
    if (authLoading) return;

    if (!token) {
      router.replace("/login");
      return;
    }

    if (user?.tipo_user !== "ENTREGADOR") {
      router.replace("/escolher-perfil");
      return;
    }
  }, [authLoading, token, user, router]);

  const loadDemands = useCallback(async () => {
    if (!token) return;
    const data = await listDemands(token);
    setDemands(data);
  }, [token]);

  useEffect(() => {
    if (authLoading || !token || user?.tipo_user !== "ENTREGADOR") return;

    let cancelled = false;
    const bootstrap = async () => {
      try {
        await loadDemands();
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof ApiError ? error.message : "Erro ao carregar fretes.";
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
      if (!token || user?.tipo_user !== "ENTREGADOR") return;
      loadDemands().catch(() => undefined);
    }, [loadDemands, token, user])
  );

  const onRefresh = async () => {
    if (!token) return;
    setRefreshing(true);
    try {
      await loadDemands();
    } catch {
      Alert.alert("Erro", "Falha ao atualizar fretes.");
    } finally {
      setRefreshing(false);
    }
  };

  const filtered = useMemo(() => {
    const text = search.trim().toLowerCase();
    return demands.filter((d) => {
      const matchesSearch =
        !text ||
        d.title.toLowerCase().includes(text) ||
        d.endereco_origem.toLowerCase().includes(text) ||
        d.endereco_destino.toLowerCase().includes(text);
      const matchesStatus = statusFilter === "todos" || d.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [demands, search, statusFilter]);

  const applyToDemand = async (demandId: string) => {
    if (!token) {
      Alert.alert("Sessão expirada", "Faça login novamente.");
      router.replace("/login");
      return;
    }
    try {
      await createCandidatura(token, { demanda_id: demandId });
      Alert.alert("Candidatura enviada!", "O contratante receberá sua solicitação.");
    } catch (error) {
      if (error instanceof ApiError) {
        Alert.alert("Erro", error.message);
      } else {
        Alert.alert("Erro", "Não foi possível enviar candidatura.");
      }
    }
  };

  // Enquanto auth carrega ou está redirecionando, mostra spinner
  if (authLoading || !token || user?.tipo_user !== "ENTREGADOR") {
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
          <Text style={styles.title}>Olá, {user?.nome ?? "Motorista"}</Text>
          <Text style={styles.subtitle}>Fretes disponíveis para candidatura</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => router.push("/minhas-candidaturas")}
          >
            <MaterialCommunityIcons name="send-clock-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => { signOut(); router.replace("/login"); }}
          >
            <Ionicons name="log-out-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Busca */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#64748b" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar título ou cidade"
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#94a3b8"
        />
      </View>

      {/* Filtros de status */}
      <View style={styles.filtersRow}>
        {(
          [
            ["todos", "Todos"],
            ["aberta", "Abertas"],
            ["em_andamento", "Andamento"],
            ["concluida", "Concluídas"],
          ] as const
        ).map(([value, label]) => (
          <TouchableOpacity
            key={value}
            style={[styles.filterChip, statusFilter === value && styles.filterChipActive]}
            onPress={() => setStatusFilter(value)}
          >
            <Text
              style={statusFilter === value ? styles.filterTextActive : styles.filterText}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
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

              <View style={styles.cardMeta}>
                <View style={styles.metaItem}>
                  <MaterialCommunityIcons name="weight" size={14} color="#64748b" />
                  <Text style={styles.metaText}>{item.peso_carga_kg} kg</Text>
                </View>
                <Text style={styles.cardStatus}>{item.status.replace("_", " ")}</Text>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.cardValue}>
                  R$ {item.valor_proposto.toLocaleString("pt-BR")}
                </Text>
                {item.status === "aberta" && (
                  <TouchableOpacity
                    style={styles.applyButton}
                    onPress={() => applyToDemand(item.id)}
                  >
                    <Text style={styles.applyButtonText}>Candidatar</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>Nenhum frete disponível no momento.</Text>
          }
        />
      )}
    </SafeAreaView>
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
  searchBox: {
    marginHorizontal: 16,
    marginTop: 12,
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
  filtersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 10,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  filterChipActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  filterText: { color: "#334155", fontSize: 12, fontWeight: "600" },
  filterTextActive: { color: "#fff", fontSize: 12, fontWeight: "600" },
  listContent: { padding: 16, gap: 10, paddingBottom: 24 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardTitle: { fontWeight: "700", fontSize: 15, color: "#0f172a" },
  cardRoute: { color: "#475569", marginTop: 4, fontSize: 13 },
  cardMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { color: "#64748b", fontSize: 12 },
  cardFooter: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardValue: { color: "#2563eb", fontWeight: "700", fontSize: 16 },
  cardStatus: {
    textTransform: "capitalize",
    color: "#334155",
    fontSize: 12,
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  applyButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  applyButtonText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  empty: { textAlign: "center", color: "#64748b", marginTop: 24 },
});
