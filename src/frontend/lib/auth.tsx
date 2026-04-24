import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Platform } from "react-native";

import {
  becomeCriador,
  getProfile,
  login,
  type UserProfile,
  type UserType,
} from "@/lib/api";

type AuthContextType = {
  token: string | null;
  user: UserProfile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<UserProfile>;
  signOut: () => void;
  refreshProfile: () => Promise<UserProfile | null>;
  ensureCriador: () => Promise<UserProfile>;
  setSession: (tokenValue: string, userValue: UserProfile) => void;
};

const SESSION_KEY = "docarreto.session";

const AuthContext = createContext<AuthContextType | null>(null);

function saveWebSession(token: string, user: UserProfile) {
  if (Platform.OS !== "web") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify({ token, user }));
}

function clearWebSession() {
  if (Platform.OS !== "web") return;
  localStorage.removeItem(SESSION_KEY);
}

function loadWebSession(): { token: string; user: UserProfile } | null {
  if (Platform.OS !== "web") return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as { token: string; user: UserProfile };
    if (!parsed?.token || !parsed?.user) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const session = loadWebSession();
    if (!session) {
      setIsLoading(false);
      return;
    }

    setToken(session.token);
    setUser(session.user);
    getProfile(session.token)
      .then((profile) => {
        setUser(profile);
        saveWebSession(session.token, profile);
      })
      .catch(() => {
        setToken(null);
        setUser(null);
        clearWebSession();
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const setSession = (tokenValue: string, userValue: UserProfile) => {
    setToken(tokenValue);
    setUser(userValue);
    saveWebSession(tokenValue, userValue);
  };

  const signIn = async (email: string, password: string) => {
    const tokenResponse = await login(email, password);
    const profile = await getProfile(tokenResponse.access_token);
    setSession(tokenResponse.access_token, profile);
    return profile;
  };

  const signOut = () => {
    setToken(null);
    setUser(null);
    clearWebSession();
  };

  const refreshProfile = async () => {
    if (!token) return null;
    const profile = await getProfile(token);
    setUser(profile);
    saveWebSession(token, profile);
    return profile;
  };

  const ensureCriador = async () => {
    if (!token) throw new Error("Usuário não autenticado.");
    if (user?.tipo_user === "CRIADOR_DEMANDA") return user;

    await becomeCriador(token);
    const profile = await getProfile(token);
    setUser(profile);
    saveWebSession(token, profile);
    return profile;
  };

  const value = useMemo(
    () => ({ token, user, isLoading, signIn, signOut, refreshProfile, ensureCriador, setSession }),
    [token, user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth precisa estar dentro de AuthProvider");
  }
  return ctx;
}

export function routeByUserType(tipo: UserType) {
  if (tipo === "CRIADOR_DEMANDA") return "/homeContratante" as const;
  if (tipo === "ENTREGADOR") return "/homeMotorista" as const;
  return "/escolher-perfil" as const;
}
