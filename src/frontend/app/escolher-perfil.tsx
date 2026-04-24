import { useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function EscolherPerfilScreen() {
  const router = useRouter();
  const { token, user, ensureCriador, signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  // Se o usuário já tem papel definido, redireciona imediatamente
  if (user?.tipo_user === "CRIADOR_DEMANDA") {
    router.replace("/homeContratante");
    return null;
  }
  if (user?.tipo_user === "ENTREGADOR") {
    router.replace("/homeMotorista");
    return null;
  }

  const handleEscolherContratante = async () => {
    if (!token) {
      Alert.alert("Sessão expirada", "Faça login novamente.");
      router.replace("/login");
      return;
    }

    setLoading(true);
    try {
      await ensureCriador();
      router.replace("/homeContratante");
    } catch (e) {
      if (e instanceof ApiError) {
        Alert.alert("Erro", e.message);
      } else {
        Alert.alert("Erro de conexão", "Não foi possível conectar ao servidor.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEscolherMotorista = () => {
    router.push("/cadastro-caminhoneiro");
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons name="truck-delivery" size={42} color="#3b82f6" />
        <Text style={styles.title}>Como você quer usar o DoCarreto?</Text>
        <Text style={styles.subtitle}>
          Escolha seu perfil para começar. Você pode alterar depois se necessário.
        </Text>
      </View>

      {/* Cards de escolha */}
      <View style={styles.cardsContainer}>
        {/* Contratante */}
        <TouchableOpacity
          style={styles.card}
          onPress={handleEscolherContratante}
          disabled={loading}
          activeOpacity={0.8}
        >
          <View style={[styles.cardIcon, { backgroundColor: "#dbeafe" }]}>
            <MaterialCommunityIcons name="briefcase-outline" size={36} color="#2563eb" />
          </View>
          <Text style={styles.cardTitle}>Sou Contratante</Text>
          <Text style={styles.cardDescription}>
            Publico fretes e contrato motoristas para transportar minhas cargas.
          </Text>
          {loading ? (
            <ActivityIndicator color="#2563eb" style={{ marginTop: 12 }} />
          ) : (
            <View style={styles.cardAction}>
              <Text style={styles.cardActionText}>Começar como Contratante</Text>
              <Ionicons name="arrow-forward" size={16} color="#2563eb" />
            </View>
          )}
        </TouchableOpacity>

        {/* Motorista */}
        <TouchableOpacity
          style={styles.card}
          onPress={handleEscolherMotorista}
          disabled={loading}
          activeOpacity={0.8}
        >
          <View style={[styles.cardIcon, { backgroundColor: "#dcfce7" }]}>
            <MaterialCommunityIcons name="truck" size={36} color="#16a34a" />
          </View>
          <Text style={styles.cardTitle}>Sou Motorista</Text>
          <Text style={styles.cardDescription}>
            Busco fretes disponíveis e me candidato para realizar transportes.
          </Text>
          <View style={styles.cardAction}>
            <Text style={[styles.cardActionText, { color: "#16a34a" }]}>
              Começar como Motorista
            </Text>
            <Ionicons name="arrow-forward" size={16} color="#16a34a" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Sair */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => {
          signOut();
          router.replace("/login");
        }}
      >
        <Ionicons name="log-out-outline" size={18} color="#94a3b8" />
        <Text style={styles.logoutText}>Sair da conta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 36,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 14,
    lineHeight: 30,
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  cardsContainer: {
    gap: 16,
  },
  card: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },
  cardIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  cardTitle: {
    color: "#f1f5f9",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  cardDescription: {
    color: "#94a3b8",
    fontSize: 13,
    lineHeight: 18,
  },
  cardAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 14,
  },
  cardActionText: {
    color: "#2563eb",
    fontWeight: "700",
    fontSize: 14,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 32,
  },
  logoutText: {
    color: "#94a3b8",
    fontSize: 14,
  },
});
