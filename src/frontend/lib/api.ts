import Constants from "expo-constants";
import { Platform } from "react-native";

function resolveApiBaseUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) return fromEnv;

  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    "";

  const host = hostUri.split(":")[0];
  if (host) {
    return `http://${host}:8000`;
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:8000";
  }

  return "http://127.0.0.1:8000";
}

export const API_BASE_URL = resolveApiBaseUrl();

export type UserType = "CRIADOR_DEMANDA" | "ENTREGADOR" | "NAO_DEFINIDO";

export type UserProfile = {
  id: string;
  nome: string | null;
  email: string;
  telefone: string;
  tipo_user: UserType;
  is_admin: boolean;
  criador_demanda?: {
    avaliacao_media: number;
    total_demandas: number;
  } | null;
  entregador?: {
    cnh: string | null;
    tipo_veiculo: string | null;
    placa_veiculo: string | null;
    capacidade_kg: number | null;
    total_entregas: number;
    avaliacao_media: number;
  } | null;
};

export type DemandStatus = "aberta" | "em_andamento" | "concluida" | "cancelada";

export type CandidaturaStatus = "pendente" | "aceita" | "recusada";

export type Chat = {
  id: string;
  candidatura_id: string;
  created_at: string;
};

export type CandidaturaEntregadorInfo = {
  id: string;
  nome: string | null;
  telefone: string;
  tipo_veiculo: string | null;
  placa_veiculo: string | null;
  capacidade_kg: number | null;
  avaliacao_media: number;
};

export type CandidaturaItem = {
  id: string;
  demanda_id: string;
  mensagem: string | null;
  status: CandidaturaStatus;
  created_at: string;
  entregador: CandidaturaEntregadorInfo;
};

export type DemandaResumo = {
  id: string;
  title: string;
  endereco_origem: string;
  endereco_destino: string;
  status: DemandStatus;
  valor_proposto: number;
  peso_carga_kg: number;
};

export type CandidaturaMinha = {
  id: string;
  mensagem: string | null;
  status: CandidaturaStatus;
  created_at: string;
  demanda: DemandaResumo;
};

export type Demand = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  endereco_origem: string;
  lat_origem: number;
  lon_origem: number;
  endereco_destino: string;
  lat_destino: number;
  lon_destino: number;
  valor_proposto: number;
  peso_carga_kg: number;
  status: DemandStatus;
  data_coleta: string | null;
  created_at: string;
};

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  token?: string | null;
  body?: unknown;
  headers?: Record<string, string>;
  formBody?: URLSearchParams;
};

type ApiErrorPayload = {
  detail?: string;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", token, body, headers, formBody } = options;

  const finalHeaders: Record<string, string> = {
    ...(headers ?? {}),
  };

  if (token) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  let payload: BodyInit | undefined;

  if (formBody) {
    finalHeaders["Content-Type"] = "application/x-www-form-urlencoded";
    payload = formBody.toString();
  } else if (body !== undefined) {
    finalHeaders["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const url = `${API_BASE_URL}${path}`;

  if (__DEV__) {
    console.info(`[API] ${method} ${url}`);
  }

  const response = await fetch(url, {
    method,
    headers: finalHeaders,
    body: payload,
  });

  const hasBody = response.status !== 204;
  const data = hasBody ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const errorData = (data ?? {}) as ApiErrorPayload;
    if (__DEV__) {
      console.warn(`[API] ERRO ${response.status} em ${url}`, errorData);
    }
    throw new ApiError(errorData.detail ?? `Erro ${response.status}`, response.status);
  }

  return data as T;
}

export async function createUser(payload: {
  nome: string;
  email: string;
  password: string;
  telefone: string;
}) {
  return request<{ id: string }>("/user/", { method: "POST", body: payload });
}

export async function login(email: string, password: string) {
  const form = new URLSearchParams();
  form.append("username", email);
  form.append("password", password);
  return request<{ access_token: string; token_type: string }>("/token/", {
    method: "POST",
    formBody: form,
  });
}

export async function getProfile(token: string) {
  return request<UserProfile>("/user/profile", { token });
}

export async function becomeCriador(token: string) {
  return request("/criador-demanda/", { method: "POST", token });
}

export async function becomeEntregador(
  token: string,
  payload: {
    cnh: string;
    tipo_veiculo: string;
    placa_veiculo: string;
    capacidade_kg: number;
  }
) {
  return request("/entregador/", { method: "POST", token, body: payload });
}

export async function createDemand(
  token: string,
  payload: {
    title: string;
    description: string;
    endereco_origem: string;
    lat_origem: number;
    lon_origem: number;
    endereco_destino: string;
    lat_destino: number;
    lon_destino: number;
    valor_proposto: number;
    peso_carga_kg: number;
    status: DemandStatus;
    data_coleta: string | null;
  }
) {
  return request<Demand>("/demand/", { method: "POST", token, body: payload });
}

export async function updateDemand(
  token: string,
  demandId: string,
  payload: {
    title?: string;
    description?: string;
    endereco_origem?: string;
    lat_origem?: number;
    lon_origem?: number;
    endereco_destino?: string;
    lat_destino?: number;
    lon_destino?: number;
    valor_proposto?: number;
    peso_carga_kg?: number;
    status?: DemandStatus;
    data_coleta?: string | null;
  }
) {
  return request<Demand>(`/demand/${demandId}`, { method: "PUT", token, body: payload });
}

export async function listDemands(token: string) {
  return request<Demand[]>("/demand/", { token });
}

export async function getDemandById(token: string, id: string) {
  return request<Demand>(`/demand/${id}`, { token });
}

export async function listMyDemands(token: string) {
  return request<Demand[]>("/criador-demanda/demandas", { token });
}

export async function createCandidatura(
  token: string,
  payload: {
    demanda_id: string;
    mensagem?: string;
  }
) {
  return request("/candidatura/", { method: "POST", token, body: payload });
}

export async function listCandidaturas(token: string, demandaId: string) {
  return request<CandidaturaItem[]>(`/candidatura/${demandaId}`, { token });
}

export async function listMyCandidaturas(token: string) {
  return request<CandidaturaMinha[]>("/candidatura/minhas", { token });
}

export async function cancelDemand(token: string, demandId: string) {
  return request<Demand>(`/demand/cancelar/${demandId}`, { method: "PUT", token });
}

export async function aceitarCandidatura(token: string, candidaturaId: string) {
  return request<Chat>(`/candidatura/aceitar/${candidaturaId}`, { method: "PUT", token });
}
