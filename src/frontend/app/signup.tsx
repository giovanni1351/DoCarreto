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
    // 1. Validar campos obrigatórios
    if (!nome.trim()) {
      Alert.alert("Erro", "Preencha o nome");
      return;
    }
    if (!email.trim()) {
      Alert.alert("Erro", "Preencha o email");
      return;
    }
    if (!password.trim()) {
      Alert.alert("Erro", "Preencha a senha");
      return;
    }
    if (!telefone.trim()) {
      Alert.alert("Erro", "Preencha o telefone");
      return;
    }

    setIsLoading(true);

    try {
      // 2. Preparar dados (IGUAL ao schema UserCreate do seu backend)
      const userData = {
        nome: nome,
        email: email,
        password: password,
        telefone: telefone,
      };

      console.log("Enviando para API:", userData);

      // 3. Fazer requisição POST
      const response = await fetch(`${API_URL}/user/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      // 4. Ler resposta
      const data = await response.json();

      console.log("Resposta da API:", response.status, data);

      // 5. Verificar se foi sucesso
      if (!response.ok) {
        // Erro do servidor
        const errorMessage = data.detail || "Erro ao criar conta";
        Alert.alert("Erro", errorMessage);
        return;
      }

      // 6. Sucesso! Mostrar mensagem e redirecionar
      Alert.alert("Sucesso! 🎉", "Conta criada com sucesso!", [
        {
          text: "OK",
          onPress: () => {
            // Limpar campos
            setNome("");
            setEmail("");
            setPassword("");
            setTelefone("");
            // Ir para login
            router.push("/login");
          },
        },
      ]);
    } catch (error) {
      // Erro de conexão
      console.error("Erro de conexão:", error);
      Alert.alert(
        "Erro de Conexão",
        `Não foi possível conectar ao servidor.\nVerifique se a API está rodando em ${API_URL}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.push("/login");
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

        <TouchableOpacity
          onPress={handleBackToLogin}
          style={styles.backToLoginButton}
          disabled={isLoading}
        >
          <Text style={styles.backToLoginText}>Já tenho uma conta</Text>
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
    marginBottom: 10,
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

  backToLoginButton: {
    marginTop: 20,
    paddingVertical: 12,
    alignItems: "center",
  },

  backToLoginText: {
    color: "#60a5fa",
    fontWeight: "bold",
    fontSize: 16,
  },
});