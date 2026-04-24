import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ApiError, becomeCriador, createUser, getProfile, login } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Role = "CRIADOR_DEMANDA" | "ENTREGADOR";

// ── Step 1 — Role picker ──────────────────────────────────────────────────────

function StepRole({
  onSelect,
  onBack,
}: {
  onSelect: (r: Role) => void;
  onBack: () => void;
}) {
  return (
    <View style={styles.stepWrap}>
      <Text style={styles.stepHeading}>Como você vai usar o DoCarreto?</Text>
      <Text style={styles.stepSub}>Você poderá alterar depois, se necessário.</Text>

      <TouchableOpacity
        style={[styles.roleCard, styles.roleCardBlue]}
        onPress={() => onSelect("CRIADOR_DEMANDA")}
        activeOpacity={0.85}
      >
        <View style={[styles.roleIcon, { backgroundColor: "#1d4ed8" }]}>
          <MaterialCommunityIcons name="briefcase-outline" size={28} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.roleTitle}>Sou Contratante</Text>
          <Text style={styles.roleDesc}>
            Publico fretes e contrato motoristas para transportar minhas cargas.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#93c5fd" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.roleCard, styles.roleCardGreen]}
        onPress={() => onSelect("ENTREGADOR")}
        activeOpacity={0.85}
      >
        <View style={[styles.roleIcon, { backgroundColor: "#15803d" }]}>
          <MaterialCommunityIcons name="truck" size={28} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.roleTitle}>Sou Motorista</Text>
          <Text style={styles.roleDesc}>
            Busco fretes disponíveis e me candidato para realizar transportes.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#86efac" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.backLink} onPress={onBack}>
        <Ionicons name="arrow-back" size={16} color="#64748b" />
        <Text style={styles.backLinkText}>Já tenho uma conta</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Step 2 — Personal data ────────────────────────────────────────────────────

function StepDados({
  role,
  onBack,
}: {
  role: Role;
  onBack: () => void;
}) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [telefone, setTelefone] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const router = useRouter();
  const { setSession } = useAuth();

  const isMotorista = role === "ENTREGADOR";
  const accentColor = isMotorista ? "#16a34a" : "#2563eb";

  const handleSubmit = async () => {
    setErrorMsg(null);

    // ── Validação inline ──────────────────────────────────────────────────────
    if (!nome.trim()) {
      setErrorMsg("Preencha seu nome completo.");
      return;
    }
    if (!email.trim()) {
      setErrorMsg("Preencha seu e-mail.");
      return;
    }
    if (!telefone.trim()) {
      setErrorMsg("Preencha seu telefone.");
      return;
    }
    if (!password) {
      setErrorMsg("Preencha sua senha.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    // ── Request ───────────────────────────────────────────────────────────────
    setIsLoading(true);
    try {
      if (__DEV__) console.info("[Signup] Criando usuário…", { email: email.trim(), role });

      await createUser({ nome, email: email.trim(), password, telefone });
      const tokenData = await login(email.trim(), password);
      const profile = await getProfile(tokenData.access_token);

      if (__DEV__) console.info("[Signup] Conta criada, promoção de papel…");

      if (role === "CRIADOR_DEMANDA") {
        await becomeCriador(tokenData.access_token);
        const updatedProfile = await getProfile(tokenData.access_token);
        setSession(tokenData.access_token, updatedProfile);
        router.replace("/homeContratante");
      } else {
        setSession(tokenData.access_token, profile);
        router.replace("/cadastro-caminhoneiro");
      }
    } catch (error) {
      if (__DEV__) console.error("[Signup] Erro:", error);
      if (error instanceof ApiError) {
        setErrorMsg(error.message);
      } else {
        setErrorMsg("Não foi possível conectar ao servidor. Verifique sua conexão.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inputWrapStyle = (field: string) => [
    styles.inputWrap,
    focused === field && { borderColor: accentColor },
    errorMsg && !focused && styles.inputWrapError,
  ];

  return (
    <View style={styles.stepWrap}>
      {/* Role badge */}
      <TouchableOpacity style={styles.roleBadge} onPress={onBack} disabled={isLoading}>
        <Ionicons name="arrow-back" size={14} color={isMotorista ? "#86efac" : "#93c5fd"} />
        <Text style={[styles.roleBadgeText, { color: isMotorista ? "#86efac" : "#93c5fd" }]}>
          {isMotorista ? "Motorista" : "Contratante"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.stepHeading}>Seus dados</Text>
      <Text style={styles.stepSub}>
        {isMotorista
          ? "Após criar a conta você vai informar os dados do seu veículo."
          : "Sua conta será criada e você já pode publicar fretes."}
      </Text>

      {/* ── Campos ── */}
      <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>Nome completo</Text>
        <View style={inputWrapStyle("nome")}>
          <Ionicons name="person-outline" size={17} color="#64748b" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="João da Silva"
            placeholderTextColor="#475569"
            value={nome}
            onChangeText={(v) => { setNome(v); setErrorMsg(null); }}
            editable={!isLoading}
            onFocus={() => setFocused("nome")}
            onBlur={() => setFocused(null)}
          />
        </View>
      </View>

      <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>E-mail</Text>
        <View style={inputWrapStyle("email")}>
          <Ionicons name="mail-outline" size={17} color="#64748b" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="seu@email.com"
            placeholderTextColor="#475569"
            value={email}
            onChangeText={(v) => { setEmail(v); setErrorMsg(null); }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
            onFocus={() => setFocused("email")}
            onBlur={() => setFocused(null)}
          />
        </View>
      </View>

      <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>Telefone</Text>
        <View style={inputWrapStyle("telefone")}>
          <Ionicons name="call-outline" size={17} color="#64748b" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="(11) 99999-9999"
            placeholderTextColor="#475569"
            value={telefone}
            onChangeText={(v) => { setTelefone(v); setErrorMsg(null); }}
            keyboardType="phone-pad"
            editable={!isLoading}
            onFocus={() => setFocused("telefone")}
            onBlur={() => setFocused(null)}
          />
        </View>
      </View>

      <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>Senha</Text>
        <View style={inputWrapStyle("password")}>
          <Ionicons name="lock-closed-outline" size={17} color="#64748b" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor="#475569"
            secureTextEntry={!showPass}
            value={password}
            onChangeText={(v) => { setPassword(v); setErrorMsg(null); }}
            editable={!isLoading}
            onFocus={() => setFocused("password")}
            onBlur={() => setFocused(null)}
          />
          <TouchableOpacity onPress={() => setShowPass((v) => !v)} style={styles.eyeBtn}>
            <Ionicons
              name={showPass ? "eye-off-outline" : "eye-outline"}
              size={17}
              color="#64748b"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Mensagem de erro ── */}
      {errorMsg ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      ) : null}

      {/* ── Botão submit ── */}
      <TouchableOpacity
        style={[
          styles.primaryBtn,
          { backgroundColor: accentColor },
          isLoading && styles.primaryBtnDisabled,
        ]}
        onPress={handleSubmit}
        disabled={isLoading}
        activeOpacity={0.85}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Text style={styles.primaryBtnText}>
              {isMotorista ? "Criar conta e informar veículo" : "Criar conta"}
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function SignUpScreen() {
  const [role, setRole] = useState<Role | null>(null);
  const router = useRouter();

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand */}
        <View style={styles.brand}>
          <View style={styles.logoCircle}>
            <MaterialCommunityIcons name="truck-delivery" size={36} color="#fff" />
          </View>
          <Text style={styles.appName}>DoCarreto</Text>
          <Text style={styles.tagline}>Criar conta</Text>
        </View>

        {/* Steps */}
        <View style={styles.card}>
          {/* Step indicator */}
          <View style={styles.stepIndicator}>
            <View style={[styles.stepDot, styles.stepDotActive]} />
            <View style={[styles.stepLine, role !== null && styles.stepLineActive]} />
            <View style={[styles.stepDot, role !== null && styles.stepDotActive]} />
          </View>

          {role === null ? (
            <StepRole
              onSelect={setRole}
              onBack={() => router.push("/login")}
            />
          ) : (
            <StepDados role={role} onBack={() => setRole(null)} />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0f172a" },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 48,
  },

  brand: { alignItems: "center", marginBottom: 28 },
  logoCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  appName: { color: "#fff", fontSize: 28, fontWeight: "800" },
  tagline: { color: "#64748b", fontSize: 13, marginTop: 4 },

  card: {
    backgroundColor: "#1e293b",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#334155",
  },

  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#334155",
  },
  stepDotActive: { backgroundColor: "#3b82f6" },
  stepLine: { width: 48, height: 2, backgroundColor: "#334155", marginHorizontal: 4 },
  stepLineActive: { backgroundColor: "#3b82f6" },

  stepWrap: { gap: 4 },
  stepHeading: { color: "#f1f5f9", fontSize: 19, fontWeight: "700", marginBottom: 4 },
  stepSub: { color: "#64748b", fontSize: 13, lineHeight: 18, marginBottom: 20 },

  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    gap: 14,
    borderWidth: 1,
  },
  roleCardBlue: { backgroundColor: "#1e3a5f", borderColor: "#1d4ed8" },
  roleCardGreen: { backgroundColor: "#14532d", borderColor: "#15803d" },
  roleIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  roleTitle: { color: "#f1f5f9", fontWeight: "700", fontSize: 15, marginBottom: 3 },
  roleDesc: { color: "#94a3b8", fontSize: 12, lineHeight: 16 },

  backLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 16,
    paddingVertical: 8,
  },
  backLinkText: { color: "#64748b", fontSize: 13 },

  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "#0f172a",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 16,
  },
  roleBadgeText: { fontSize: 12, fontWeight: "600" },

  fieldWrap: { marginBottom: 12 },
  fieldLabel: { color: "#94a3b8", fontSize: 12, fontWeight: "600", marginBottom: 6 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0f172a",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#334155",
    paddingHorizontal: 12,
    height: 48,
  },
  inputWrapError: { borderColor: "#334155" }, // reset on typing
  inputIcon: { marginRight: 8 },
  input: { flex: 1, color: "#f1f5f9", fontSize: 14 },
  eyeBtn: { padding: 4 },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#450a0a",
    borderWidth: 1,
    borderColor: "#ef4444",
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  errorText: { flex: 1, color: "#fca5a5", fontSize: 13 },

  primaryBtn: {
    borderRadius: 12,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
