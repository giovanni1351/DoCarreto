import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const API_URL = 'http://127.0.0.1:8000'

export default function LoginScreen() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  // const handleLogin = () => {
  //   alert("Login: " + email);
  // };

  const handleHome = () => {
    router.push("/home");
  };

  const handleForgotPassword = () => {
    alert("Redirecionando para recuperação de senha...");
  };

  const handleSignUp = () => {
    router.push("/signup");
  };

  return (
    <View style={styles.container}>

      <View style={styles.header}>
  
      <MaterialCommunityIcons 
        name="truck-delivery" 
        size={34} 
        color="white"
        style={styles.icon}
      />

      <Text style={styles.title}>Entrar no DoCarreto</Text>

      </View>
      <Text style={styles.subtitle}></Text> 

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

      <TouchableOpacity onPress={handleForgotPassword}
       style={styles.forgotPasswordContainer}>
        <Text style={styles.forgotPassword}>Esqueceu a senha?</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleHome}>
        <Text style={styles.buttonText}>Entrar</Text>
      </TouchableOpacity>

      <View style={styles.signUpContainer}>
        <Text style={styles.signUpText}>Não tem uma conta? </Text>
        <TouchableOpacity onPress={handleSignUp}>
          <Text style={styles.signUpLink}>Cadastre-se</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    padding: 25
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    marginBottom: 10,
    textAlign: "center"
  },
  header: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
    marginBottom: 30,
    marginTop: -40
  },

  icon: {
    marginRight: 10
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

  forgotPasswordContainer: {
    alignSelf: "center",
    marginBottom: 20
  },

  forgotPassword: {
    color: "#60a5fa",
    fontWeight: "500",
    fontSize: 14,
    
  },

  button: {
    backgroundColor: "#3b82f6",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10
  },

  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16
  },

  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20
  },

  signUpText: {
    color: "#cbd5f5",
    fontSize: 14
  },

  signUpLink: {
    color: "#60a5fa",
    fontWeight: "bold",
    fontSize: 14
  },
  

});