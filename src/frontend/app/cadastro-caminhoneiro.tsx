import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const API_URL = "http://127.0.0.1:8000";

export default function TruckerSignUpScreen() {
  const [email, setEmail] = useState("");
  const [cnh, setCnh] = useState("");
  const [tipoVeiculo, setTipoVeiculo] = useState("");
  const [placaVeiculo, setPlacaVeiculo] = useState("");
  const [capacidadeKg, setCapacidadeKg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async () => {
    // Validação básica
    if (!email.trim() || !cnh.trim() || !tipoVeiculo.trim() || !placaVeiculo.trim() || !capacidadeKg.trim()) {
      Alert.alert("Erro", "Por favor, preencha todos os campos.");
      return;
    }

    setIsLoading(true);

    try {
      const truckerData = {
        email: email,
        cnh: cnh,
        tipo_veiculo: tipoVeiculo,
        placa_veiculo: placaVeiculo,
        capacidade_kg: parseFloat(capacidadeKg.replace(',', '.')),
      };

      // Tenho que confirmar sobre essa API.
      const response = await fetch(`${API_URL}/caminhoneiro/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(truckerData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Erro ao cadastrar caminhoneiro");
      }

      Alert.alert("Sucesso! 🚛", "Cadastro de caminhoneiro realizado!", [
        { text: "OK", onPress: () => router.push("/login") }
      ]);
      
    } catch (error) {
      Alert.alert(
        "Erro de Conexão",
        "Não foi possível conectar ao servidor."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.header}>
          <MaterialCommunityIcons
            name="card-account-details-outline"
            size={40}
            color="#10b981"
            style={styles.icon}
          />
          <Text style={styles.title}>Cadastro de Caminhoneiro</Text>
        </View>

        <Text style={styles.subtitle}>Dados profissionais do motorista</Text>

        <TextInput
          style={styles.input}
          placeholder="Email associado à conta"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          editable={!isLoading}
        />

        <TextInput
          style={styles.input}
          placeholder="Número da CNH"
          placeholderTextColor="#888"
          value={cnh}
          onChangeText={setCnh}
          editable={!isLoading}
        />

        <TextInput
          style={styles.input}
          placeholder="Tipo do Veículo (Ex: Bitrem, Baú)"
          placeholderTextColor="#888"
          value={tipoVeiculo}
          onChangeText={setTipoVeiculo}
          editable={!isLoading}
        />

        <TextInput
          style={styles.input}
          placeholder="Placa do Veículo"
          placeholderTextColor="#888"
          value={placaVeiculo}
          onChangeText={setPlacaVeiculo}
          autoCapitalize="characters"
          editable={!isLoading}
        />

        <TextInput
          style={styles.input}
          placeholder="Capacidade de Carga (kg)"
          placeholderTextColor="#888"
          value={capacidadeKg}
          onChangeText={setCapacidadeKg}
          keyboardType="numeric"
          editable={!isLoading}
        />

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleSignUp}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.buttonText}>Finalizar Cadastro</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    paddingVertical: 40,
  },
  container: {
    padding: 25,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  icon: {
    marginBottom: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  subtitle: {
    color: "#cbd5f5",
    textAlign: "center",
    marginBottom: 30,
  },
  input: {
    backgroundColor: "white",
    padding: 14,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#10b981", // Verde para diferenciar do cadastro comum
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 15,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  backButton: {
    marginTop: 20,
    alignItems: "center",
  },
  backButtonText: {
    color: "#94a3b8",
    fontSize: 16,
  },
});