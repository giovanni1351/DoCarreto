import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  ApiError,
  aceitarCandidatura,
  cancelDemand,
  CandidaturaItem,
  CandidaturaMinha,
  CandidaturaStatus,
  createCandidatura,
  Demand,
  DemandStatus,
  getDemandById,
  listCandidaturas,
  listMyCandidaturas,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";

// ── helpers ───────────────────────────────────────────────────────────────────

const DEMAND_STATUS_CONFIG: Record<
  DemandStatus,
  { label: string; color: string; bg: string }
> = {
  aberta:       { label: "Aberta",       color: "#166534", bg: "#dcfce7" },
  em_andamento: { label: "Em andamento", color: "#92400e", bg: "#fef3c7" },
  concluida:    { label: "Concluída",    color: "#1e3a5f", bg: "#dbeafe" },
  cancelada:    { label: "Cancelada",    color: "#991b1b", bg: "#fee2e2" },
};

const CAND_STATUS_CONFIG: Record<
  CandidaturaStatus,
  { label: string; color: string; bg: string }
> = {
  pendente:  { label: "Pendente",  color: "#92400e", bg: "#fef3c7" },
  aceita:    { label: "Aceita",    color: "#166534", bg: "#dcfce7" },
  recusada:  { label: "Recusada",  color: "#991b1b", bg: "#fee2e2" },
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ── component ─────────────────────────────────────────────────────────────────

export default function DemandaDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { token, user } = useAuth();

  const [demand, setDemand] = useState<Demand | null>(null);
  const [candidaturas, setCandidaturas] = useState<CandidaturaItem[]>([]);
  const [minhaCandidatura, setMinhaCandidatura] = useState<CandidaturaMinha | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCands, setIsLoadingCands] = useState(false);
  const [isCandidating, setIsCandidating] = useState(false);
  const [hasCandidated, setHasCandidated] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isAceitando, setIsAceitando] = useState<string | null>(null);

  type DialogConfig = {
    title: string;
    message: string;
    confirmLabel: string;
    destructive?: boolean;
    onConfirm: () => void;
  };
  const [dialog, setDialog] = useState<DialogConfig | null>(null);
  const closeDialog = () => setDialog(null);

  const isMotorista   = user?.tipo_user === "ENTREGADOR";
  const isContratante = user?.tipo_user === "CRIADOR_DEMANDA";

  // ── fetch demand ────────────────────────────────────────────────────────────
  const fetchDemand = useCallback(async () => {
    if (!token || !id) return;
    setIsLoading(true);
    try {
      const data = await getDemandById(token, id);
      setDemand(data);
    } catch (error) {
      if (error instanceof ApiError) Alert.alert("Erro", error.message);
      else Alert.alert("Erro", "Não foi possível carregar a demanda.");
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [token, id, router]);

  // ── fetch candidaturas (contratante only) ───────────────────────────────────
  const fetchCandidaturas = useCallback(async () => {
    if (!token || !id || !isContratante) return;
    setIsLoadingCands(true);
    try {
      const data = await listCandidaturas(token, id);
      setCandidaturas(data);
    } catch (error) {
      // silently fail — section will show empty state
      if (__DEV__ && error instanceof Error) {
        console.warn("[Candidaturas]", error.message);
      }
    } finally {
      setIsLoadingCands(false);
    }
  }, [token, id, isContratante]);

  // ── verificar se motorista já se candidatou ─────────────────────────────────
  const checkMinhaCandidatura = useCallback(async () => {
    if (!token || !id || !isMotorista) return;
    try {
      const minhas = await listMyCandidaturas(token);
      const found = minhas.find((c) => c.demanda.id === id) ?? null;
      setMinhaCandidatura(found);
      if (found) setHasCandidated(true);
    } catch {
      // silently fail
    }
  }, [token, id, isMotorista]);

  useEffect(() => {
    fetchDemand();
  }, [fetchDemand]);

  useEffect(() => {
    if (isContratante) fetchCandidaturas();
  }, [isContratante, fetchCandidaturas]);

  useEffect(() => {
    if (isMotorista) checkMinhaCandidatura();
  }, [isMotorista, checkMinhaCandidatura]);

    // ── cancelar demanda ────────────────────────────────────────────────────────
  const handleCancelarDemanda = () => {
    if (!token || !demand) return;
    setDialog({
      title: "Cancelar demanda",
      message: "Tem certeza que deseja cancelar esta demanda?",
      confirmLabel: "Sim, cancelar",
      destructive: true,
      onConfirm: async () => {
        closeDialog();
        setIsCanceling(true);
        try {
          await cancelDemand(token, demand.id);
          Alert.alert("Demanda cancelada", "A demanda foi cancelada com sucesso.");
          router.back();
        } catch (error) {
          if (error instanceof ApiError) Alert.alert("Erro", error.message);
          else Alert.alert("Erro", "Não foi possível cancelar a demanda.");
        } finally {
          setIsCanceling(false);
        }
      },
    });
  };

  // ── aceitar candidatura ─────────────────────────────────────────────────────
  const handleAceitarCandidatura = (candidaturaId: string) => {
    if (!token) return;
    setDialog({
      title: "Aceitar candidatura",
      message: "Deseja aceitar este candidato? A demanda será marcada como em andamento.",
      confirmLabel: "Aceitar",
      onConfirm: async () => {
        closeDialog();
        setIsAceitando(candidaturaId);
        try {
          await aceitarCandidatura(token, candidaturaId);
          Alert.alert("Candidatura aceita!", "O motorista foi selecionado.");
          await fetchDemand();
          await fetchCandidaturas();
        } catch (error) {
          if (error instanceof ApiError) Alert.alert("Erro", error.message);
          else Alert.alert("Erro", "Não foi possível aceitar a candidatura.");
        } finally {
          setIsAceitando(null);
        }
      },
    });
  };

  // ── candidatar ──────────────────────────────────────────────────────────────
  const handleCandidatar = async () => {
    if (!token || !demand) return;
    setIsCandidating(true);
    try {
      await createCandidatura(token, { demanda_id: demand.id });
      setHasCandidated(true);
      Alert.alert("Candidatura enviada!", "Você se candidatou a este frete.");
    } catch (error) {
      if (error instanceof ApiError) Alert.alert("Erro", error.message);
      else Alert.alert("Erro", "Não foi possível enviar candidatura.");
    } finally {
      setIsCandidating(false);
    }
  };

  // ── loading guard ───────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!demand) return null;

  const demandCfg = DEMAND_STATUS_CONFIG[demand.status] ?? {
    label: demand.status,
    color: "#334155",
    bg: "#e2e8f0",
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ConfirmDialog
        visible={!!dialog}
        title={dialog?.title ?? ""}
        message={dialog?.message ?? ""}
        confirmLabel={dialog?.confirmLabel}
        destructive={dialog?.destructive}
        onConfirm={dialog?.onConfirm ?? closeDialog}
        onCancel={closeDialog}
      />
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Detalhes da Demanda
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* ── Título + status ── */}
        <View style={styles.card}>
          <View style={styles.titleRow}>
            <Text style={styles.demandTitle}>{demand.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: demandCfg.bg }]}>
              <Text style={[styles.statusText, { color: demandCfg.color }]}>
                {demandCfg.label}
              </Text>
            </View>
          </View>
          {demand.description ? (
            <Text style={styles.description}>{demand.description}</Text>
          ) : (
            <Text style={styles.descriptionEmpty}>Sem descrição.</Text>
          )}
        </View>

        {/* ── Rota ── */}
        <View style={styles.card}>
          <SectionTitle icon="map-marker-path" label="Rota" />
          <InfoRow
            icon="map-marker-outline"
            label="Origem"
            value={demand.endereco_origem}
          />
          <InfoRow
            icon="map-marker-check-outline"
            label="Destino"
            value={demand.endereco_destino}
          />
        </View>

        {/* ── Detalhes do frete ── */}
        <View style={styles.card}>
          <SectionTitle icon="package-variant-closed" label="Detalhes do Frete" />
          <InfoRow
            icon="weight-kilogram"
            label="Carga"
            value={`${demand.peso_carga_kg} kg`}
          />
          <InfoRow
            icon="currency-usd"
            label="Valor proposto"
            value={formatCurrency(demand.valor_proposto)}
            highlight
          />
          <InfoRow
            icon="calendar-outline"
            label="Data de coleta"
            value={formatDate(demand.data_coleta)}
          />
          <InfoRow
            icon="clock-outline"
            label="Publicado em"
            value={formatDate(demand.created_at)}
          />
        </View>

        {/* ── Candidatos (contratante) ── */}
        {isContratante && (
          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <SectionTitle icon="account-group-outline" label="Candidatos" />
              <TouchableOpacity onPress={fetchCandidaturas} disabled={isLoadingCands}>
                <Ionicons
                  name="refresh-outline"
                  size={18}
                  color={isLoadingCands ? "#cbd5e1" : "#2563eb"}
                />
              </TouchableOpacity>
            </View>

            {isLoadingCands ? (
              <ActivityIndicator
                size="small"
                color="#2563eb"
                style={{ marginVertical: 20 }}
              />
            ) : candidaturas.length === 0 ? (
              <View style={styles.emptyCandsWrap}>
                <MaterialCommunityIcons
                  name="account-search-outline"
                  size={36}
                  color="#cbd5e1"
                />
                <Text style={styles.emptyCands}>
                  Nenhum candidato ainda.
                </Text>
              </View>
            ) : (
              candidaturas.map((cand) => (
                <CandidaturaCard
                  key={cand.id}
                  cand={cand}
                  demandStatus={demand.status}
                  onAceitar={handleAceitarCandidatura}
                  isAceitando={isAceitando === cand.id}
                />
              ))
            )}
          </View>
        )}

        {/* ── Botão cancelar demanda (contratante) ── */}
        {isContratante && (demand.status === "aberta" || demand.status === "em_andamento") && (
          <TouchableOpacity
            style={[styles.cancelarBtn, isCanceling && styles.cancelarBtnDisabled]}
            onPress={handleCancelarDemanda}
            disabled={isCanceling}
          >
            {isCanceling ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="close-circle-outline" size={18} color="#fff" />
                <Text style={styles.cancelarBtnText}>Cancelar demanda</Text>
              </>
            )}
          </TouchableOpacity>
        )}


        {/* ── Candidatar / status (motorista) ── */}
        {isMotorista && demand.status === "aberta" && !hasCandidated && (
          <TouchableOpacity
            style={[styles.candidatarBtn, isCandidating && styles.candidatarBtnDisabled]}
            onPress={handleCandidatar}
            disabled={isCandidating}
          >
            {isCandidating ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="send-outline" size={18} color="#fff" />
                <Text style={styles.candidatarBtnText}>Candidatar-se a este frete</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* motorista: já se candidatou — mostra status da candidatura */}
        {isMotorista && hasCandidated && (
          <MinhaCandidaturaStatus
            status={minhaCandidatura?.status ?? "pendente"}
            onVerTodas={() => router.push("/minhas-candidaturas")}
          />
        )}

        {/* motorista: demanda fechada */}
        {isMotorista && demand.status !== "aberta" && !hasCandidated && (
          <View style={styles.closedNotice}>
            <MaterialCommunityIcons name="lock-outline" size={16} color="#64748b" />
            <Text style={styles.closedNoticeText}>
              Este frete não está aceitando candidaturas.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── MinhaCandidaturaStatus ────────────────────────────────────────────────────

const MINHA_CAND_CONFIG: Record<
  CandidaturaStatus,
  { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; desc: string; color: string; bg: string; border: string }
> = {
  pendente: {
    icon: "clock-outline",
    label: "Aguardando resposta",
    desc: "Sua candidatura foi enviada. O contratante ainda não respondeu.",
    color: "#92400e",
    bg: "#fefce8",
    border: "#fde68a",
  },
  aceita: {
    icon: "check-circle",
    label: "Candidatura aceita!",
    desc: "Parabéns! O contratante aceitou sua candidatura.",
    color: "#166534",
    bg: "#f0fdf4",
    border: "#86efac",
  },
  recusada: {
    icon: "close-circle-outline",
    label: "Candidatura recusada",
    desc: "O contratante não selecionou você desta vez.",
    color: "#991b1b",
    bg: "#fff1f2",
    border: "#fca5a5",
  },
};

function MinhaCandidaturaStatus({
  status,
  onVerTodas,
}: {
  status: CandidaturaStatus;
  onVerTodas: () => void;
}) {
  const cfg = MINHA_CAND_CONFIG[status];
  return (
    <View style={[styles.minhaCandBox, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      <View style={styles.minhaCandHeader}>
        <MaterialCommunityIcons name={cfg.icon} size={22} color={cfg.color} />
        <Text style={[styles.minhaCandLabel, { color: cfg.color }]}>{cfg.label}</Text>
      </View>
      <Text style={styles.minhaCandDesc}>{cfg.desc}</Text>
      <TouchableOpacity onPress={onVerTodas} style={styles.minhaCandLink}>
        <Text style={styles.minhaCandLinkText}>Ver todas as candidaturas</Text>
        <Ionicons name="arrow-forward" size={13} color="#2563eb" />
      </TouchableOpacity>
    </View>
  );
}

// ── CandidaturaCard ───────────────────────────────────────────────────────────

function CandidaturaCard({
  cand,
  demandStatus,
  onAceitar,
  isAceitando,
}: {
  cand: CandidaturaItem;
  demandStatus: DemandStatus;
  onAceitar: (id: string) => void;
  isAceitando: boolean;
}) {
  const cfg = CAND_STATUS_CONFIG[cand.status] ?? {
    label: cand.status,
    color: "#334155",
    bg: "#e2e8f0",
  };
  const { entregador } = cand;

  return (
    <View style={styles.candCard}>
      {/* nome + badge */}
      <View style={styles.candHeader}>
        <View style={styles.candAvatar}>
          <MaterialCommunityIcons name="account" size={20} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.candNome}>
            {entregador.nome ?? "Motorista"}
          </Text>
          <Text style={styles.candTelefone}>{entregador.telefone}</Text>
        </View>
        <View style={[styles.candBadge, { backgroundColor: cfg.bg }]}>
          <Text style={[styles.candBadgeText, { color: cfg.color }]}>
            {cfg.label}
          </Text>
        </View>
      </View>

      {/* veículo */}
      <View style={styles.candDetails}>
        <CandDetail
          icon="truck-outline"
          value={entregador.tipo_veiculo ?? "—"}
        />
        <CandDetail
          icon="card-text-outline"
          value={entregador.placa_veiculo ?? "—"}
        />
        <CandDetail
          icon="weight-kilogram"
          value={
            entregador.capacidade_kg != null
              ? `${entregador.capacidade_kg} kg`
              : "—"
          }
        />
        <CandDetail
          icon="star-outline"
          value={
            entregador.avaliacao_media > 0
              ? entregador.avaliacao_media.toFixed(1)
              : "Sem avaliação"
          }
        />
      </View>

      {/* mensagem */}
      {cand.mensagem ? (
        <View style={styles.candMsgWrap}>
          <MaterialCommunityIcons
            name="message-text-outline"
            size={14}
            color="#64748b"
          />
          <Text style={styles.candMsg}>{cand.mensagem}</Text>
        </View>
      ) : null}

      {/* data */}
      <Text style={styles.candDate}>
        Candidatou-se em{" "}
        {new Date(cand.created_at).toLocaleDateString("pt-BR")}
      </Text>

      {/* aceitar */}
      {cand.status === "pendente" && demandStatus === "aberta" && (
        <TouchableOpacity
          style={[styles.aceitarBtn, isAceitando && styles.aceitarBtnDisabled]}
          onPress={() => onAceitar(cand.id)}
          disabled={isAceitando}
        >
          {isAceitando ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="check-circle-outline" size={16} color="#fff" />
              <Text style={styles.aceitarBtnText}>Aceitar candidato</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

function CandDetail({
  icon,
  value,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  value: string;
}) {
  return (
    <View style={styles.candDetailItem}>
      <MaterialCommunityIcons name={icon} size={13} color="#64748b" />
      <Text style={styles.candDetailText}>{value}</Text>
    </View>
  );
}

// ── sub-components ────────────────────────────────────────────────────────────

function SectionTitle({
  icon,
  label,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
}) {
  return (
    <View style={styles.sectionTitle}>
      <MaterialCommunityIcons name={icon} size={16} color="#2563eb" />
      <Text style={styles.sectionTitleText}>{label}</Text>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <MaterialCommunityIcons
        name={icon}
        size={16}
        color="#64748b"
        style={styles.infoIcon}
      />
      <View style={styles.infoTextWrap}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text
          style={[styles.infoValue, highlight && styles.infoValueHighlight]}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

// ── styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },

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

  scroll: { padding: 16, paddingBottom: 40, gap: 12 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    flexWrap: "wrap",
  },
  demandTitle: { flex: 1, fontSize: 18, fontWeight: "700", color: "#0f172a" },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statusText: { fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
  description: { fontSize: 14, color: "#475569", lineHeight: 20 },
  descriptionEmpty: { fontSize: 14, color: "#94a3b8", fontStyle: "italic" },

  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  sectionTitleText: { fontWeight: "700", color: "#0f172a", fontSize: 14 },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  infoIcon: { marginTop: 2 },
  infoTextWrap: { flex: 1 },
  infoLabel: {
    fontSize: 11,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: { fontSize: 14, color: "#0f172a", marginTop: 1, fontWeight: "500" },
  infoValueHighlight: { color: "#2563eb", fontSize: 16, fontWeight: "700" },

  // empty candidatos
  emptyCandsWrap: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
  },
  emptyCands: { color: "#94a3b8", fontSize: 13, textAlign: "center" },

  // candidatura card
  candCard: {
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 12,
    gap: 8,
  },
  candHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  candAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },
  candNome: { fontWeight: "700", color: "#0f172a", fontSize: 14 },
  candTelefone: { color: "#64748b", fontSize: 12 },
  candBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  candBadgeText: { fontSize: 11, fontWeight: "600", textTransform: "capitalize" },
  candDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  candDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  candDetailText: { fontSize: 12, color: "#334155" },
  candMsgWrap: {
    flexDirection: "row",
    gap: 6,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 10,
    alignItems: "flex-start",
  },
  candMsg: { flex: 1, fontSize: 13, color: "#475569" },
  candDate: { fontSize: 11, color: "#94a3b8" },

  // candidatar button
  candidatarBtn: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  candidatarBtnDisabled: { backgroundColor: "#94a3b8" },
  candidatarBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  closedNotice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 4,
    padding: 14,
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
  },
  closedNoticeText: { color: "#64748b", fontSize: 13 },

  // minha candidatura status box
  minhaCandBox: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 16,
    gap: 8,
    marginTop: 4,
  },
  minhaCandHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  minhaCandLabel: { fontWeight: "700", fontSize: 15 },
  minhaCandDesc: { fontSize: 13, color: "#475569", lineHeight: 18 },
  minhaCandLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  minhaCandLinkText: { color: "#2563eb", fontSize: 13, fontWeight: "600" },

  //cancelar Demanda button
  cancelarBtn: {
    backgroundColor: "#dc2626",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  cancelarBtnDisabled: { backgroundColor: "#94a3b8" },
  cancelarBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  // aceitar candidatura button
  aceitarBtn: {
    backgroundColor: "#16a34a",
    borderRadius: 8,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 4,
  },
  aceitarBtnDisabled: { backgroundColor: "#94a3b8" },
  aceitarBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});
