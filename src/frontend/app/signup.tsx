  import { useState } from "react";
  import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
  import { useRouter } from "expo-router";
  import { MaterialCommunityIcons } from "@expo/vector-icons";

  export default function SignUpScreen() {

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const router = useRouter();

    const handleSignUp = () => {
      alert("Dados enviados");
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
            value={fullName}
            onChangeText={setFullName}
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          <TextInput
            style={styles.input}
            placeholder="Senha"
            placeholderTextColor="#888"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TextInput
            style={styles.input}
            placeholder="Data de Nascimento (DD/MM/YYYY)"
            placeholderTextColor="#888"
            value={birthDate}
            onChangeText={setBirthDate}
            keyboardType="numeric"
          />

          <TouchableOpacity style={styles.button} onPress={handleSignUp}>
            <Text style={styles.buttonText}>Enviar</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleBackToLogin} style={styles.backToLoginButton}>
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
      paddingVertical: 40
    },

    container: {
      padding: 25
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 30,
      marginTop: -20
    },

    icon: {
      marginRight: 10
    },

    title: {
      fontSize: 32,
      fontWeight: "bold",
      color: "white",
      marginBottom: 10,
      textAlign: "center"
    },

    subtitle: {
      color: "#cbd5f5",
      textAlign: "center",
      marginBottom: 40
    },

    input: {
      backgroundColor: "white",
      padding: 14,
      borderRadius: 8,
      marginBottom: 15
    },

    button: {
      backgroundColor: "#3b82f6",
      padding: 15,
      borderRadius: 8,
      alignItems: "center",
      marginTop: 20
    },

    buttonText: {
      color: "white",
      fontWeight: "bold",
      fontSize: 16
    },

    backToLoginButton: {
      marginTop: 20,
      paddingVertical: 12,
      alignItems: "center"
    },

    backToLoginText: {
      color: "#60a5fa",
      fontWeight: "bold",
      fontSize: 16
    }

  });