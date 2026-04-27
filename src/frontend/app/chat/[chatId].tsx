import { useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { createChatWebSocket, type ChatEvent, type Mensagem } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function ChatScreen() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const router = useRouter();
  const { token, user } = useAuth();

  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState("");
  const [conectado, setConectado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const flatListRef = useRef<FlatList<Mensagem>>(null);

  // ── Conectar WebSocket ───────────────────────────────────────────────────
  useEffect(() => {
    if (!token || !chatId) return;

    const ws = createChatWebSocket(chatId, token);
    wsRef.current = ws;

    ws.onopen = () => {
      setConectado(true);
      setErro(null);
    };

    ws.onmessage = (e) => {
      try {
        const event: ChatEvent = JSON.parse(e.data);

        if (event.tipo === "mensagem") {
          setMensagens((prev) => {
            // Evitar duplicatas (histórico vs broadcast)
            if (prev.find((m) => m.id === event.id)) return prev;
            return [...prev, event];
          });
          // Scroll para o final
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
        }

        if (event.tipo === "lida") {
          setMensagens((prev) =>
            prev.map((m) => (m.id === event.mensagem_id ? { ...m, lida: true } : m))
          );
        }

        if (event.tipo === "erro") {
          setErro(event.detalhe);
        }
      } catch {
        // mensagem malformada — ignorar
      }
    };

    ws.onerror = () => {
      setConectado(false);
      setErro("Erro de conexão. Tente novamente.");
    };

    ws.onclose = () => {
      setConectado(false);
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [token, chatId]);

  // ── Enviar mensagem ──────────────────────────────────────────────────────
  const enviar = () => {
    const conteudo = texto.trim();
    if (!conteudo || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(JSON.stringify({ conteudo }));
    setTexto("");
  };

  // ── Render item ──────────────────────────────────────────────────────────
  const renderMensagem = ({ item, index }: { item: Mensagem; index: number }) => {
    const isMinha = item.remetente_id === user?.id;
    const anterior = index > 0 ? mensagens[index - 1] : null;
    const mesmoDia =
      anterior &&
      new Date(item.created_at).toDateString() ===
        new Date(anterior.created_at).toDateString();
    const dataSeparador = !mesmoDia ? formatarData(item.created_at) : null;

    return (
      <>
        {dataSeparador && (
          <View style={styles.dataSeparator}>
            <Text style={styles.dataSeparatorText}>{dataSeparador}</Text>
          </View>
        )}
        <View style={[styles.msgRow, isMinha ? styles.msgRowMinha : styles.msgRowDela]}>
          <View style={[styles.bubble, isMinha ? styles.bubbleMinha : styles.bubbleDela]}>
            <Text style={[styles.bubbleText, isMinha && styles.bubbleTextMinha]}>
              {item.conteudo}
            </Text>
            <View style={styles.msgMeta}>
              <Text style={[styles.msgTime, isMinha && styles.msgTimeMinha]}>
                {formatarHora(item.created_at)}
              </Text>
              {isMinha && (
                <Ionicons
                  name={item.lida ? "checkmark-done" : "checkmark"}
                  size={13}
                  color={item.lida ? "#60a5fa" : "rgba(255,255,255,0.6)"}
                  style={{ marginLeft: 3 }}
                />
              )}
            </View>
          </View>
        </View>
      </>
    );
  };

  // ── UI ───────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Chat do frete
          </Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, conectado ? styles.statusOnline : styles.statusOffline]} />
            <Text style={styles.statusText}>{conectado ? "Conectado" : "Reconectando..."}</Text>
          </View>
        </View>
      </View>

      {/* Erro de conexão */}
      {erro && (
        <View style={styles.erroBanner}>
          <Ionicons name="warning-outline" size={15} color="#92400e" />
          <Text style={styles.erroText}>{erro}</Text>
        </View>
      )}

      {/* Lista de mensagens */}
      {!conectado && mensagens.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.conectandoText}>Conectando ao chat...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={mensagens}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={renderMensagem}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Ionicons name="chatbubble-outline" size={40} color="#cbd5e1" />
              <Text style={styles.emptyChatText}>Nenhuma mensagem ainda.</Text>
              <Text style={styles.emptyChatSub}>Diga olá para começar!</Text>
            </View>
          }
        />
      )}

      {/* Input de envio */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Digite uma mensagem..."
            placeholderTextColor="#94a3b8"
            value={texto}
            onChangeText={setTexto}
            multiline
            maxLength={1000}
            returnKeyType="default"
          />
          <TouchableOpacity
            style={[styles.sendBtn, !texto.trim() && styles.sendBtnDisabled]}
            onPress={enviar}
            disabled={!texto.trim() || !conectado}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatarHora(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatarData(iso: string) {
  const d = new Date(iso);
  const hoje = new Date();
  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);

  if (d.toDateString() === hoje.toDateString()) return "Hoje";
  if (d.toDateString() === ontem.toDateString()) return "Ontem";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  header: {
    backgroundColor: "#0f172a",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  headerInfo: { flex: 1 },
  headerTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusOnline: { backgroundColor: "#4ade80" },
  statusOffline: { backgroundColor: "#f87171" },
  statusText: { color: "#cbd5e1", fontSize: 11 },
  erroBanner: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#fde68a",
  },
  erroText: { color: "#92400e", fontSize: 13, flex: 1 },
  listContent: { padding: 14, gap: 2, paddingBottom: 10 },
  msgRow: { flexDirection: "row", marginVertical: 2 },
  msgRowMinha: { justifyContent: "flex-end" },
  msgRowDela: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 16,
  },
  bubbleMinha: {
    backgroundColor: "#2563eb",
    borderBottomRightRadius: 4,
  },
  bubbleDela: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  bubbleText: { fontSize: 14, color: "#0f172a", lineHeight: 20 },
  bubbleTextMinha: { color: "#fff" },
  msgMeta: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", marginTop: 3 },
  msgTime: { fontSize: 10, color: "#64748b" },
  msgTimeMinha: { color: "rgba(255,255,255,0.65)" },
  dataSeparator: { alignItems: "center", marginVertical: 10 },
  dataSeparatorText: {
    fontSize: 11,
    color: "#64748b",
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  emptyChat: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 8,
  },
  emptyChatText: { fontSize: 15, fontWeight: "600", color: "#475569" },
  emptyChatSub: { fontSize: 13, color: "#94a3b8" },
  conectandoText: { color: "#475569", fontSize: 14 },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: Platform.OS === "ios" ? 24 : 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: "#0f172a",
    maxHeight: 110,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  sendBtnDisabled: { backgroundColor: "#93c5fd" },
});
