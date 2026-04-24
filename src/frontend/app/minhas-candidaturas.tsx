import { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { ApiError, CandidaturaMinha, CandidaturaStatus, listMyCandidaturas } from "@/lib/api";
import { useAuth } from "@/lib/auth";

// ── helpers ───────────────────────────────────────────────────────────────────

const CAND_STATUS: Record<CandidaturaStatus, { label: string; color: string; bg: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }> = {
  pendente: { label: "Aguardando resposta", color: "#92400e", bg: "#fef3c7", icon: "clock-outline" },
  aceita:   { label: "Aceita",             color: "#166534", bg: "#dcfce7", icon: "check-circle-outline" },
  recusada: { label: "Recusada",           color: "#991b1b", bg: "#fee2e2", icon: "close-circle-outline" },
};

const DEMAND_STATUS_LABEL: Record<string, string> = {
  aberta:       "Aberta",
  em_andamento: "Em andamento",
  concluida:    "Concluída",
  cancelada:    "Cancelada",
};

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ── component ─────────────────────────────────────────────────────────────────

export default function MinhasCandidaturasScreen() {
  const router = useRouter();
  const { token, user } = useAuth();

  const [candidaturas, setCandidaturas] = useState<CandidaturaMinha[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchData = useCallback(async (silent = false) => {
    if (!token) return;
    if (!silent) setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await listMyCandidaturas(token);
      // Mais recentes primeiro
      setCandidaturas(data.sort((a, b) => b.created_at.localeCompare(a.created_at)));
    } catch (err) {
      if (err instanceof ApiError) setErrorMsg(err.message);
      else setErrorMsg("Não foi possível carregar suas candidaturas.");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  // ── guards ────────────────────────────────────────────────────────────────
  if (!token || user?.tipo_user !== "ENTREGADOR") {
    router.replace("/login");
    return null;
  }

  // ── render item ───────────────────────────────────────────────────────────
  const renderItem = ({ item }: { item: CandidaturaMinha }) => {
    const cfg = CAND_STATUS[item.status];
    const { demanda } = item;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/demanda/${demanda.id}`)}
        activeOpacity={0.8}
      >
        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
          <MaterialCommunityIcons name={cfg.icon} size={13} color={cfg.color} />
          <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>

        {/* Título da demanda */}
        <Text style={styles.demandTitle} numberOfLines={1}>
          {demanda.title}
        </Text>

        {/* Rota */}
        <View style={styles.routeRow}>
          <View style={styles.routeItem}>
            <Ionicons name="location-outline" size={13} color="#64748b" />
            <Text style={styles.routeText} numberOfLines={1}>{demanda.endereco_origem}</Text>
          </View>
          <MaterialCommunityIcons name="arrow-right" size={13} color="#94a3b8" />
          <View style={styles.routeItem}>
            <Ionicons name="navigate-outline" size={13} color="#64748b" />
            <Text style={styles.routeText} numberOfLines={1}>{demanda.endereco_destino}</Text>
          </View>
        </View>

        {/* Meta row */}
        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <MaterialCommunityIcons name="weight-kilogram" size={12} color="#64748b" />
            <Text style={styles.metaText}>{demanda.peso_carga_kg} kg</Text>
          </View>
          <View style={styles.metaChip}>
            <MaterialCommunityIcons name="tag-outline" size={12} color="#64748b" />
            <Text style={styles.metaText}>{DEMAND_STATUS_LABEL[demanda.status] ?? demanda.status}</Text>
          </View>
          <Text style={styles.valueText}>{formatCurrency(demanda.valor_proposto)}</Text>
        </View>

        {/* Mensagem */}
        {item.mensagem ? (
          <View style={styles.msgWrap}>
            <MaterialCommunityIcons name="message-text-outline" size={13} color="#64748b" />
            <Text style={styles.msgText} numberOfLines={2}>{item.mensagem}</Text>
          </View>
        ) : null}

        {/* Data */}
        <Text style={styles.dateText}>Candidatura enviada em {formatDate(item.created_at)}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Minhas Candidaturas</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Stats strip */}
      {!isLoading && candidaturas.length > 0 && (
        <View style={styles.statsStrip}>
          {(["pendente", "aceita", "recusada"] as CandidaturaStatus[]).map((s) => {
            const count = candidaturas.filter((c) => c.status === s).length;
            const cfg = CAND_STATUS[s];
            return (
              <View key={s} style={styles.statItem}>
                <Text style={[styles.statCount, { color: cfg.color }]}>{count}</Text>
                <Text style={styles.statLabel}>{cfg.label.split(" ")[0]}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Content */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : errorMsg ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="alert-circle-outline" size={40} color="#ef4444" />
          <Text style={styles.errorText}>{errorMsg}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchData()}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={candidaturas}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons name="send-clock-outline" size={52} color="#334155" />
              <Text style={styles.emptyTitle}>Nenhuma candidatura ainda</Text>
              <Text style={styles.emptyDesc}>
                Navegue pelos fretes disponíveis e se candidate.
              </Text>
              <TouchableOpacity
                style={styles.browseBtn}
                onPress={() => router.replace("/homeMotorista")}
              >
                <Text style={styles.browseBtnText}>Ver fretes disponíveis</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

// ── styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },

  header: {
    backgroundColor: "#0f172a",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },

  statsStrip: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 10,
  },
  statItem: { flex: 1, alignItems: "center" },
  statCount: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 11, color: "#64748b", marginTop: 2 },

  list: { padding: 16, paddingBottom: 40, gap: 12 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 8,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: { fontSize: 12, fontWeight: "600" },

  demandTitle: { fontSize: 15, fontWeight: "700", color: "#0f172a" },

  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  routeItem: { flexDirection: "row", alignItems: "center", gap: 3, flex: 1, minWidth: 80 },
  routeText: { fontSize: 12, color: "#475569", flex: 1 },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  metaText: { fontSize: 12, color: "#475569" },
  valueText: { marginLeft: "auto", color: "#2563eb", fontWeight: "700", fontSize: 14 },

  msgWrap: {
    flexDirection: "row",
    gap: 6,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 8,
    alignItems: "flex-start",
  },
  msgText: { flex: 1, fontSize: 12, color: "#475569" },

  dateText: { fontSize: 11, color: "#94a3b8" },

  errorText: { color: "#ef4444", fontSize: 14, textAlign: "center" },
  retryBtn: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: { color: "#fff", fontWeight: "600" },

  emptyWrap: { alignItems: "center", paddingTop: 60, gap: 10, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: "#334155" },
  emptyDesc: { fontSize: 13, color: "#64748b", textAlign: "center", lineHeight: 18 },
  browseBtn: {
    marginTop: 8,
    backgroundColor: "#2563eb",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  browseBtnText: { color: "#fff", fontWeight: "700" },
});
