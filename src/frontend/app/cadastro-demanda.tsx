import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Modal,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { ApiError, createDemand } from "@/lib/api";
import { useAuth } from "@/lib/auth";

// ─── Componente de Mapa (apenas Web) ───────────────────────────────────────
function LeafletMapPicker({ visible, onClose, onConfirm, initialAddress, title = "Selecionar Endereço" }) {
  const iframeRef = useRef(null);
  const [pendingConfirm, setPendingConfirm] = useState(null);

  // HTML do mapa Leaflet embutido no iframe
  const mapHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: #F8FAFC; }
    #map { width: 100%; height: calc(100vh - 130px); }

    #search-bar {
      display: flex;
      gap: 8px;
      padding: 10px 12px;
      background: #fff;
      border-bottom: 1px solid #E2E8F0;
    }
    #search-input {
      flex: 1;
      padding: 10px 14px;
      border: 1.5px solid #CBD5E1;
      border-radius: 8px;
      font-size: 14px;
      color: #0F172A;
      outline: none;
    }
    #search-input:focus { border-color: #3B82F6; }
    #search-btn {
      padding: 10px 16px;
      background: #3B82F6;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    }
    #search-btn:hover { background: #2563EB; }

    #footer {
      padding: 10px 12px;
      background: #fff;
      border-top: 1px solid #E2E8F0;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    #address-display {
      font-size: 13px;
      color: #334155;
      min-height: 18px;
      font-style: italic;
    }
    #confirm-btn {
      padding: 11px;
      background: #22C55E;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      width: 100%;
    }
    #confirm-btn:disabled { background: #94A3B8; cursor: default; }
    #confirm-btn:not(:disabled):hover { background: #16A34A; }

    .pin-hint {
      font-size: 12px;
      color: #64748B;
      text-align: center;
    }
  </style>
</head>
<body>
  <div id="search-bar">
    <input id="search-input" type="text" placeholder="Buscar endereço..." />
    <button id="search-btn">Buscar</button>
  </div>
  <div id="map"></div>
  <div id="footer">
    <p class="pin-hint">📍 Clique no mapa ou arraste o marcador para ajustar</p>
    <div id="address-display">Nenhum local selecionado</div>
    <button id="confirm-btn" disabled>Confirmar Endereço</button>
  </div>

  <script>
    // Brasília como centro padrão
    const defaultLat = -15.7801;
    const defaultLng = -47.9292;
    const defaultZoom = 12;

    const map = L.map('map').setView([defaultLat, defaultLng], defaultZoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    let marker = null;
    let selectedData = null;

    const addressDisplay = document.getElementById('address-display');
    const confirmBtn = document.getElementById('confirm-btn');

    function setMarker(lat, lng) {
      if (marker) {
        marker.setLatLng([lat, lng]);
      } else {
        marker = L.marker([lat, lng], { draggable: true }).addTo(map);
        marker.on('dragend', function(e) {
          const pos = e.target.getLatLng();
          reverseGeocode(pos.lat, pos.lng);
        });
      }
      map.setView([lat, lng], 15);
    }

    async function reverseGeocode(lat, lng) {
      addressDisplay.textContent = 'Buscando endereço...';
      confirmBtn.disabled = true;
      try {
        const res = await fetch(
          'https://nominatim.openstreetmap.org/reverse?format=json&lat=' + lat + '&lon=' + lng + '&accept-language=pt-BR',
          { headers: { 'Accept-Language': 'pt-BR' } }
        );
        const data = await res.json();
        const addr = data.display_name || 'Endereço não encontrado';
        addressDisplay.textContent = addr;
        selectedData = { address: addr, latitude: lat, longitude: lng };
        confirmBtn.disabled = false;
      } catch (e) {
        addressDisplay.textContent = 'Erro ao buscar endereço.';
      }
    }

    async function geocodeSearch(query) {
      if (!query.trim()) return;
      addressDisplay.textContent = 'Buscando...';
      try {
        const res = await fetch(
          'https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(query) + '&limit=1&accept-language=pt-BR'
        );
        const results = await res.json();
        if (results.length > 0) {
          const r = results[0];
          const lat = parseFloat(r.lat);
          const lng = parseFloat(r.lon);
          setMarker(lat, lng);
          await reverseGeocode(lat, lng);
        } else {
          addressDisplay.textContent = 'Endereço não encontrado.';
        }
      } catch (e) {
        addressDisplay.textContent = 'Erro na busca.';
      }
    }

    map.on('click', function(e) {
      setMarker(e.latlng.lat, e.latlng.lng);
      reverseGeocode(e.latlng.lat, e.latlng.lng);
    });

    document.getElementById('search-btn').addEventListener('click', function() {
      geocodeSearch(document.getElementById('search-input').value);
    });

    document.getElementById('search-input').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') geocodeSearch(this.value);
    });

    confirmBtn.addEventListener('click', function() {
      if (selectedData) {
        window.parent.postMessage(JSON.stringify({ type: 'ADDRESS_SELECTED', ...selectedData }), '*');
      }
    });
  </script>
</body>
</html>
  `;

  // Escuta mensagens do iframe
  useEffect(() => {
    if (!visible) return;
    const handler = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "ADDRESS_SELECTED") {
          setPendingConfirm(data);
        }
      } catch {}
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [visible]);

  // Quando recebe confirmação do iframe, chama onConfirm e fecha
  useEffect(() => {
    if (pendingConfirm) {
      onConfirm({
        address: pendingConfirm.address,
        latitude: pendingConfirm.latitude,
        longitude: pendingConfirm.longitude,
      });
      setPendingConfirm(null);
    }
  }, [onConfirm, pendingConfirm]);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
        {/* Header do modal */}
        <View style={mapStyles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={mapStyles.closeBtn}>
            <Ionicons name="close" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={mapStyles.modalTitle}>{title}</Text>
        </View>

        {/* iframe com Leaflet */}
        <iframe
          ref={iframeRef}
          srcDoc={mapHtml}
          style={{
            flex: 1,
            width: "100%",
            border: "none",
            height: "100%",
          }}
          sandbox="allow-scripts allow-same-origin allow-forms"
          title="Mapa de seleção de endereço"
        />
      </SafeAreaView>
    </Modal>
  );
}

const mapStyles = StyleSheet.create({
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  closeBtn: { marginRight: 12 },
  modalTitle: { fontSize: 17, fontWeight: "700", color: "#0F172A", flex: 1 },
});

// ─── Tela Principal ─────────────────────────────────────────────────────────
export default function CreateDemandScreen() {
  const router = useRouter();
  const { token, ensureCriador } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [mapTarget, setMapTarget] = useState<"origem" | "destino" | null>(null);

  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    endereco_origem: "",
    latitude_origem: null,
    longitude_origem: null,
    endereco_destino: "",
    latitude_destino: null,
    longitude_destino: null,
    valor_proposto: "",
    peso_carga_kg: "",
    status: "aberta",
    data_coleta: "",
  });

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCoordinateChange = (
    field: "latitude_origem" | "longitude_origem" | "latitude_destino" | "longitude_destino",
    value: string
  ) => {
    const parsed = parseFloat(value.replace(",", "."));
    if (Number.isNaN(parsed)) {
      updateField(field, null);
      return;
    }
    updateField(field, parsed);
  };

  const handleDateChange = (text) => {
    const cleaned = text.replace(/\D/g, "");
    let masked = cleaned;
    if (cleaned.length > 2 && cleaned.length <= 4) {
      masked = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    } else if (cleaned.length > 4) {
      masked = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
    }
    updateField("data_coleta", masked);
  };

  const handleAddressConfirm = ({ address, latitude, longitude }) => {
    if (mapTarget === "origem") {
      setForm((prev) => ({
        ...prev,
        endereco_origem: address,
        latitude_origem: latitude,
        longitude_origem: longitude,
      }));
    } else if (mapTarget === "destino") {
      setForm((prev) => ({
        ...prev,
        endereco_destino: address,
        latitude_destino: latitude,
        longitude_destino: longitude,
      }));
    }
    setMapTarget(null);
  };

  // ── Validação ──────────────────────────────────────────────────────────────
  const validate = () => {
    if (!form.titulo.trim()) return "Informe o título da carga.";
    if (!form.endereco_origem || form.latitude_origem === null)
      return "Selecione o endereço de origem no mapa.";
    if (!form.endereco_destino || form.latitude_destino === null)
      return "Selecione o endereço de destino no mapa.";
    if (!form.valor_proposto || isNaN(parseFloat(form.valor_proposto.replace(",", "."))))
      return "Informe um valor proposto válido.";
    if (!form.peso_carga_kg || isNaN(parseFloat(form.peso_carga_kg)))
      return "Informe o peso da carga.";
    if (form.data_coleta && form.data_coleta.length !== 10)
      return "Data da coleta incompleta. Use o formato DD/MM/AAAA.";
    return null;
  };

  // ── Conversão DD/MM/AAAA → ISO 8601 ───────────────────────────────────────
  const parseDateToISO = (dateStr) => {
    if (!dateStr || dateStr.length !== 10) return null;
    const [day, month, year] = dateStr.split("/");
    const iso = `${year}-${month}-${day}T00:00:00`;
    return isNaN(Date.parse(iso)) ? null : iso;
  };

  // ── Envio para a API ───────────────────────────────────────────────────────
  const handleSubmit = async () => {
    console.info("[Demanda] Iniciando publicação");
    const error = validate();
    if (error) {
      console.warn("[Demanda] Validação falhou", error);
      Alert.alert("Campos inválidos", error);
      return;
    }

    if (!token) {
      Alert.alert("Sessão expirada", "Faça login novamente.");
      router.replace("/login");
      return;
    }

    const payload = {
      title: form.titulo.trim(),
      description: form.descricao.trim(),
      endereco_origem: form.endereco_origem,
      lat_origem: form.latitude_origem,
      lon_origem: form.longitude_origem,
      endereco_destino: form.endereco_destino,
      lat_destino: form.latitude_destino,
      lon_destino: form.longitude_destino,
      valor_proposto: parseFloat(form.valor_proposto.replace(",", ".")),
      peso_carga_kg: parseFloat(form.peso_carga_kg),
      status: form.status,
      data_coleta: parseDateToISO(form.data_coleta),
    };

    setIsLoading(true);
    try {
      await ensureCriador();
      console.info("[Demanda] Perfil criador garantido");
      await createDemand(token, payload);
      console.info("[Demanda] Publicação concluída");

      Alert.alert("Sucesso!", "Frete publicado com sucesso.", [
        { text: "OK", onPress: () => router.replace("/homeContratante") },
      ]);
    } catch (e) {
      console.error("[Demanda] Erro ao publicar", e);
      if (e instanceof ApiError) {
        Alert.alert("Erro ao publicar", e.message);
      } else {
        Alert.alert("Erro de conexão", "Não foi possível conectar à API. Verifique sua conexão.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.replace("/homeContratante")}
            style={styles.backIconButton}
          >
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Nova Demanda</Text>
            <Text style={styles.subtitle}>Preencha os dados da carga</Text>
          </View>
          <MaterialCommunityIcons
            name="package-variant-closed"
            size={32}
            color="#3B82F6"
          />
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Informações Gerais</Text>
          <TextInput
            style={styles.input}
            placeholder="Título da Carga"
            placeholderTextColor="#94A3B8"
            value={form.titulo}
            onChangeText={(v) => updateField("titulo", v)}
          />

          <Text style={styles.labelSmall}>Data da Coleta</Text>
          <TextInput
            style={styles.input}
            placeholder="DD/MM/AAAA"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            maxLength={10}
            value={form.data_coleta}
            onChangeText={handleDateChange}
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Descrição detalhada"
            placeholderTextColor="#94A3B8"
            multiline
            value={form.descricao}
            onChangeText={(v) => updateField("descricao", v)}
          />

          {/* ── Seção de Logística ── */}
          <Text style={styles.sectionTitle}>Logística</Text>

          <Text style={styles.labelSmall}>Endereço de Origem</Text>
          {Platform.OS === "web" ? (
            <TouchableOpacity
              style={styles.mapPickerButton}
              onPress={() => setMapTarget("origem")}
              activeOpacity={0.7}
            >
              <Ionicons
                name="location-outline"
                size={20}
                color={form.endereco_origem ? "#3B82F6" : "#94A3B8"}
                style={{ marginRight: 10 }}
              />
              <Text
                style={[
                  styles.mapPickerText,
                  form.endereco_origem && styles.mapPickerTextFilled,
                ]}
                numberOfLines={2}
              >
                {form.endereco_origem || "Toque para selecionar no mapa"}
              </Text>
              <Ionicons name="map-outline" size={18} color="#3B82F6" />
            </TouchableOpacity>
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="Ex: São Paulo, SP"
                placeholderTextColor="#94A3B8"
                value={form.endereco_origem}
                onChangeText={(v) => updateField("endereco_origem", v)}
              />
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.labelSmall}>Latitude origem</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="-23.550520"
                    keyboardType="numeric"
                    onChangeText={(v) => handleCoordinateChange("latitude_origem", v)}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.labelSmall}>Longitude origem</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="-46.633308"
                    keyboardType="numeric"
                    onChangeText={(v) => handleCoordinateChange("longitude_origem", v)}
                  />
                </View>
              </View>
            </>
          )}

          {/* Coordenadas (somente leitura, exibidas após seleção) */}
          {form.latitude_origem !== null && (
            <View style={styles.coordRow}>
              <View style={styles.coordBadge}>
                <Text style={styles.coordLabel}>LAT</Text>
                <Text style={styles.coordValue}>
                  {form.latitude_origem.toFixed(6)}
                </Text>
              </View>
              <View style={styles.coordBadge}>
                <Text style={styles.coordLabel}>LNG</Text>
                <Text style={styles.coordValue}>
                  {form.longitude_origem.toFixed(6)}
                </Text>
              </View>
            </View>
          )}

          <Text style={styles.labelSmall}>Endereço de Destino</Text>
          {Platform.OS === "web" ? (
            <TouchableOpacity
              style={styles.mapPickerButton}
              onPress={() => setMapTarget("destino")}
              activeOpacity={0.7}
            >
              <Ionicons
                name="navigate-outline"
                size={20}
                color={form.endereco_destino ? "#F97316" : "#94A3B8"}
                style={{ marginRight: 10 }}
              />
              <Text
                style={[
                  styles.mapPickerText,
                  form.endereco_destino && styles.mapPickerTextFilled,
                ]}
                numberOfLines={2}
              >
                {form.endereco_destino || "Toque para selecionar no mapa"}
              </Text>
              <Ionicons name="map-outline" size={18} color="#F97316" />
            </TouchableOpacity>
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="Ex: Campinas, SP"
                placeholderTextColor="#94A3B8"
                value={form.endereco_destino}
                onChangeText={(v) => updateField("endereco_destino", v)}
              />
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.labelSmall}>Latitude destino</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="-22.905560"
                    keyboardType="numeric"
                    onChangeText={(v) => handleCoordinateChange("latitude_destino", v)}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.labelSmall}>Longitude destino</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="-47.060830"
                    keyboardType="numeric"
                    onChangeText={(v) => handleCoordinateChange("longitude_destino", v)}
                  />
                </View>
              </View>
            </>
          )}

          {form.latitude_destino !== null && (
            <View style={styles.coordRow}>
              <View style={[styles.coordBadge, styles.coordBadgeDestino]}>
                <Text style={[styles.coordLabel, styles.coordLabelDestino]}>LAT</Text>
                <Text style={[styles.coordValue, styles.coordValueDestino]}>
                  {form.latitude_destino.toFixed(6)}
                </Text>
              </View>
              <View style={[styles.coordBadge, styles.coordBadgeDestino]}>
                <Text style={[styles.coordLabel, styles.coordLabelDestino]}>LNG</Text>
                <Text style={[styles.coordValue, styles.coordValueDestino]}>
                  {form.longitude_destino.toFixed(6)}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.labelSmall}>Valor (R$)</Text>
              <TextInput
                style={styles.input}
                placeholder="0,00"
                keyboardType="numeric"
                value={form.valor_proposto}
                onChangeText={(v) => updateField("valor_proposto", v)}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.labelSmall}>Peso (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 5000"
                keyboardType="numeric"
                value={form.peso_carga_kg}
                onChangeText={(v) => updateField("peso_carga_kg", v)}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Publicar Frete</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal do mapa (somente web) */}
      {Platform.OS === "web" && (
        <LeafletMapPicker
          visible={mapTarget !== null}
          onClose={() => setMapTarget(null)}
          onConfirm={handleAddressConfirm}
          title={
            mapTarget === "origem"
              ? "Selecionar Endereço de Origem"
              : "Selecionar Endereço de Destino"
          }
          initialAddress={
            mapTarget === "origem" ? form.endereco_origem : form.endereco_destino
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
  scrollContainer: { paddingBottom: 40 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backIconButton: { marginRight: 16 },
  headerTextContainer: { flex: 1 },
  title: { fontSize: 22, fontWeight: "700", color: "#0F172A" },
  subtitle: { fontSize: 14, color: "#64748B" },
  formContainer: { padding: 20 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3B82F6",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 12,
  },
  labelSmall: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 4,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
    fontSize: 15,
    color: "#0F172A",
  },
  textArea: { height: 100, textAlignVertical: "top" },
  row: { flexDirection: "row", justifyContent: "space-between" },

  // Botão de seleção de mapa
  mapPickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#BFDBFE",
    borderStyle: "dashed",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  mapPickerText: {
    flex: 1,
    fontSize: 14,
    color: "#94A3B8",
    fontStyle: "italic",
  },
  mapPickerTextFilled: {
    color: "#0F172A",
    fontStyle: "normal",
    fontSize: 13,
  },

  // Badges de coordenadas
  coordRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  coordBadge: {
    flex: 1,
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
  },
  coordLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#3B82F6",
    letterSpacing: 1,
  },
  coordValue: { fontSize: 12, color: "#1E40AF", fontWeight: "600" },

  coordBadgeDestino: { backgroundColor: "#FFF7ED" },
  coordLabelDestino: { color: "#F97316" },
  coordValueDestino: { color: "#C2410C" },

  primaryButton: {
    backgroundColor: "#3B82F6",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24,
    elevation: 4,
  },
  buttonDisabled: { backgroundColor: "#94A3B8" },
  buttonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
});
