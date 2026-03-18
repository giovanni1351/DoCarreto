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

const API_URL = "http://127.0.0.1:8000"; // Mude para seu IP se testar no device

export default function SignUpScreen() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [telefone, setTelefone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async () => {
    if (!nome.trim() || !email.trim() || !password.trim() || !telefone.trim()) {
      Alert.alert("Erro", "Preencha todos os campos");
      return;
    }

    setIsLoading(true);

    try {
      const userData = {
        nome: nome,
        email: email,
        password: password,
        telefone: telefone,
      };

      const response = await fetch(`${API_URL}/user/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.detail || "Erro ao criar conta";
        Alert.alert("Erro", errorMessage);
        return;
      }

      Alert.alert("Sucesso! 🎉", "Conta criada com sucesso!", [
        {
          text: "OK",
          onPress: () => {
            setNome("");
            setEmail("");
            setPassword("");
            setTelefone("");
            router.push("/login");
          },
        },
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

  const handleBackToLogin = () => {
    router.push("/login");
  };

  // Função para redirecionar para o cadastro de caminhoneiro
  const handleGoToTruckerSignUp = () => {
    // Certifique-se de que o arquivo existe em: app/cadastro-caminhoneiro.js (ou similar)
    router.push("/cadastro-caminhoneiro");
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.header}>
          <MaterialCommunityIcons
            name="truck-delivery"
            size={34}
            color="white"
            style={styles.icon}
          />
          <Text style={styles.title}>Criar Conta</Text>
        </View>

        <Text style={styles.subtitle}>Preencha os dados para se cadastrar</Text>

        <TextInput
          style={styles.input}
          placeholder="Nome Completo"
          placeholderTextColor="#888"
          value={nome}
          onChangeText={setNome}
          editable={!isLoading}
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          editable={!isLoading}
        />

        <TextInput
          style={styles.input}
          placeholder="Senha"
          placeholderTextColor="#888"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!isLoading}
        />

        <TextInput
          style={styles.input}
          placeholder="Telefone"
          placeholderTextColor="#888"
          value={telefone}
          onChangeText={setTelefone}
          keyboardType="phone-pad"
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
            <Text style={styles.buttonText}>Enviar</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footerLinks}>
          <TouchableOpacity
            onPress={handleBackToLogin}
            style={styles.linkButton}
            disabled={isLoading}
          >
            <Text style={styles.linkText}>Já tenho uma conta</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleGoToTruckerSignUp}
            style={styles.linkButton}
            disabled={isLoading}
          >
            <Text style={styles.truckerLinkText}>Sou Caminhoneiro (Cadastro Especial)</Text>
          </TouchableOpacity>
        </View>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
    marginTop: -20,
  },
  icon: {
    marginRight: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  subtitle: {
    color: "#cbd5f5",
    textAlign: "center",
    marginBottom: 40,
  },
  input: {
    backgroundColor: "white",
    padding: 14,
    borderRadius: 8,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#3b82f6",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  footerLinks: {
    marginTop: 20,
    alignItems: "center",
  },
  linkButton: {
    paddingVertical: 10,
  },
  linkText: {
    color: "#60a5fa",
    fontWeight: "bold",
    fontSize: 16,
  },
  truckerLinkText: {
    color: "#10b981", // Um verde para destacar o cadastro especial
    fontWeight: "bold",
    fontSize: 16,
    marginTop: 10,
  },
});