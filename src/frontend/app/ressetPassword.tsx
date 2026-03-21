import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const API_URL = "http://127.0.0.1:8000";

type ResetStep = "email" | "code" | "newpassword" | "success";

export default function ResetPasswordScreen() {
  const [step, setStep] = useState<ResetStep>("email");
  const [email, setEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const router = useRouter();

  // Validar email
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validar senha
  const isValidPassword = (password: string) => {
    return password.length >= 6;
  };

  // Step 1: Enviar email de recuperação
  const handleSendResetEmail = async () => {
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Por favor, insira seu email");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Por favor, insira um email válido");
      return;
    }

    setLoading(true);

    try {
      // Aqui você faria a chamada à API
      // const response = await fetch(`${API_URL}/auth/reset-password`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ email }),
      // });

      // Por enquanto, simular sucesso
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSuccess("Email enviado com sucesso! Verifique sua caixa de entrada.");
      setStep("code");
      setSuccess("");
    } catch (err) {
      setError("Erro ao enviar email. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verificar código
  const handleVerifyCode = async () => {
    setError("");
    setSuccess("");

    if (!resetCode.trim()) {
      setError("Por favor, insira o código de recuperação");
      return;
    }

    if (resetCode.length < 4) {
      setError("Código inválido");
      return;
    }

    setLoading(true);

    try {
      // Aqui você faria a chamada à API
      // const response = await fetch(`${API_URL}/auth/verify-reset-code`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ email, code: resetCode }),
      // });

      // Por enquanto, simular sucesso
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSuccess("Código verificado com sucesso!");
      setStep("newpassword");
      setSuccess("");
    } catch (err) {
      setError("Código inválido ou expirado");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Definir nova senha
  const handleResetPassword = async () => {
    setError("");
    setSuccess("");

    if (!newPassword.trim()) {
      setError("Por favor, insira uma nova senha");
      return;
    }

    if (!isValidPassword(newPassword)) {
      setError("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("As senhas não correspondem");
      return;
    }

    setLoading(true);

    try {
      // Aqui você faria a chamada à API
      // const response = await fetch(`${API_URL}/auth/reset-password-confirm`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     email,
      //     code: resetCode,
      //     newPassword,
      //   }),
      // });

      // Por enquanto, simular sucesso
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSuccess("Senha redefinida com sucesso!");
      setStep("success");
    } catch (err) {
      setError("Erro ao redefinir senha. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Voltar para login
  const handleBackToLogin = () => {
    if (step !== "email") {
      // Se não estiver no primeiro passo, volta para o anterior
      if (step === "code") setStep("email");
      else if (step === "newpassword") setStep("code");
      else if (step === "success") router.push("/login");
    } else {
      // Se estiver no primeiro passo, volta para login
      router.push("/login");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header com Botão Voltar */}
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackToLogin}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recuperar Senha</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressDot, step === "email" && styles.progressDotActive]} />
          <View style={[styles.progressDot, step === "code" && styles.progressDotActive]} />
          <View style={[styles.progressDot, step === "newpassword" && styles.progressDotActive]} />
          <View style={[styles.progressDot, step === "success" && styles.progressDotActive]} />
        </View>

        {/* Step 1: Email */}
        {step === "email" && (
          <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="email-outline" size={48} color="#3b82f6" />
            </View>

            <Text style={styles.stepTitle}>Insira seu Email</Text>
            <Text style={styles.stepSubtitle}>
              Enviaremos um código de recuperação para seu email
            </Text>

            <TextInput
              style={styles.input}
              placeholder="seu@email.com"
              placeholderTextColor="#888"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              editable={!loading}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {success ? <Text style={styles.successText}>{success}</Text> : null}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSendResetEmail}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Enviar Código</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2: Código */}
        {step === "code" && (
          <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="email-check-outline" size={48} color="#3b82f6" />
            </View>

            <Text style={styles.stepTitle}>Verifique seu Email</Text>
            <Text style={styles.stepSubtitle}>
              Insira o código de 6 dígitos enviado para {email}
            </Text>

            <TextInput
              style={[styles.input, styles.codeInput]}
              placeholder="000000"
              placeholderTextColor="#888"
              value={resetCode}
              onChangeText={setResetCode}
              keyboardType="number-pad"
              maxLength={6}
              editable={!loading}
              textAlign="center"
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleVerifyCode}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Verificar Código</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendContainer}
              onPress={() => {
                setError("");
                handleSendResetEmail();
              }}
            >
              <Text style={styles.resendText}>Não recebeu o código? </Text>
              <Text style={styles.resendLink}>Reenviar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 3: Nova Senha */}
        {step === "newpassword" && (
          <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="lock-reset" size={48} color="#3b82f6" />
            </View>

            <Text style={styles.stepTitle}>Defina uma Nova Senha</Text>
            <Text style={styles.stepSubtitle}>
              Escolha uma senha forte e segura
            </Text>

            {/* Nova Senha */}
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Nova Senha"
                placeholderTextColor="#888"
                secureTextEntry={!showPassword}
                value={newPassword}
                onChangeText={setNewPassword}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <MaterialCommunityIcons
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#3b82f6"
                />
              </TouchableOpacity>
            </View>

            {/* Confirmar Senha */}
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirmar Senha"
                placeholderTextColor="#888"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                <MaterialCommunityIcons
                  name={showConfirmPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#3b82f6"
                />
              </TouchableOpacity>
            </View>

            {/* Validação de Força da Senha */}
            {newPassword && (
              <View style={styles.passwordStrengthContainer}>
                <View style={styles.passwordStrengthBar}>
                  <View
                    style={[
                      styles.passwordStrengthFill,
                      {
                        width:
                          newPassword.length < 6
                            ? "33%"
                            : newPassword.length < 10
                            ? "66%"
                            : "100%",
                        backgroundColor:
                          newPassword.length < 6
                            ? "#ef4444"
                            : newPassword.length < 10
                            ? "#f59e0b"
                            : "#10b981",
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.passwordStrengthText,
                    {
                      color:
                        newPassword.length < 6
                          ? "#ef4444"
                          : newPassword.length < 10
                          ? "#f59e0b"
                          : "#10b981",
                    },
                  ]}
                >
                  {newPassword.length < 6
                    ? "Fraca"
                    : newPassword.length < 10
                    ? "Média"
                    : "Forte"}
                </Text>
              </View>
            )}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={loading || newPassword !== confirmPassword}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Redefinir Senha</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Step 4: Sucesso */}
        {step === "success" && (
          <View style={styles.stepContainer}>
            <View style={styles.successIconContainer}>
              <MaterialCommunityIcons name="check-circle" size={64} color="#10b981" />
            </View>

            <Text style={styles.successTitle}>Senha Redefinida com Sucesso!</Text>
            <Text style={styles.stepSubtitle}>
              Sua senha foi alterada com sucesso. Você agora pode fazer login com sua nova senha.
            </Text>

            <TouchableOpacity
              style={styles.button}
              onPress={() => router.push("/login")}
            >
              <Text style={styles.buttonText}>Voltar para Login</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
    paddingTop: 10,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(59, 130, 246, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "white",
    flex: 1,
    textAlign: "center",
  },

  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 40,
  },

  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#334155",
  },

  progressDotActive: {
    backgroundColor: "#3b82f6",
    width: 24,
  },

  stepContainer: {
    marginBottom: 40,
  },

  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 24,
  },

  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 24,
  },

  stepTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "white",
    textAlign: "center",
    marginBottom: 8,
  },

  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#10b981",
    textAlign: "center",
    marginBottom: 8,
  },

  stepSubtitle: {
    fontSize: 14,
    color: "#cbd5f5",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },

  input: {
    backgroundColor: "white",
    padding: 14,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 14,
    color: "#0f172a",
  },

  codeInput: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 8,
  },

  passwordInputContainer: {
    position: "relative",
    marginBottom: 16,
  },

  passwordInput: {
    backgroundColor: "white",
    padding: 14,
    paddingRight: 44,
    borderRadius: 8,
    fontSize: 14,
    color: "#0f172a",
  },

  eyeIcon: {
    position: "absolute",
    right: 12,
    top: 12,
  },

  passwordStrengthContainer: {
    marginBottom: 16,
  },

  passwordStrengthBar: {
    height: 6,
    backgroundColor: "#334155",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },

  passwordStrengthFill: {
    height: "100%",
    borderRadius: 3,
  },

  passwordStrengthText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "right",
  },

  button: {
    backgroundColor: "#3b82f6",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },

  buttonDisabled: {
    opacity: 0.5,
  },

  buttonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },

  errorText: {
    color: "#ef4444",
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 12,
    textAlign: "center",
  },

  successText: {
    color: "#10b981",
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 12,
    textAlign: "center",
  },

  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },

  resendText: {
    color: "#cbd5f5",
    fontSize: 14,
  },

  resendLink: {
    color: "#60a5fa",
    fontWeight: "700",
    fontSize: 14,
  },
});