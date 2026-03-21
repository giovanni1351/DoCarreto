import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Dimensions,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// Types
interface FreteCard {
  id: string;
  titulo: string;
  origem: string;
  destino: string;
  valor: number;
  peso: string;
  urgencia: 'baixa' | 'media' | 'alta';
  distancia: string;
  candidatos?: number;
}

interface MotoristaHomeScreenProps {
  userName?: string;
}

const { width } = Dimensions.get('window');

const MotoristaHomeScreen: React.FC<MotoristaHomeScreenProps> = ({ 
  userName = 'Usuário' 
}) => {
  const [fretes, setFretes] = useState<FreteCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedUrgencia, setSelectedUrgencia] = useState<'todas' | 'alta' | 'media' | 'baixa'>('todas');
  const [selectedFrete, setSelectedFrete] = useState<FreteCard | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = () => {
    setIsLoading(true);

    setFretes([
      {
        id: '1',
        titulo: 'Frete São Paulo → Rio de Janeiro',
        origem: 'São Bernardo do Campo, SP',
        destino: 'Rio de Janeiro, RJ',
        valor: 1200,
        peso: '5 toneladas',
        urgencia: 'media',
        distancia: '430 km',
        candidatos: 3,
      },
      {
        id: '2',
        titulo: 'Frete Campinas → Ribeirão Preto',
        origem: 'Campinas, SP',
        destino: 'Ribeirão Preto, SP',
        valor: 800,
        peso: '3 toneladas',
        urgencia: 'alta',
        distancia: '250 km',
        candidatos: 5,
      },
      {
        id: '3',
        titulo: 'Frete Santo André → Sorocaba',
        origem: 'Santo André, SP',
        destino: 'Sorocaba, SP',
        valor: 600,
        peso: '2 toneladas',
        urgencia: 'baixa',
        distancia: '120 km',
        candidatos: 2,
      },
      {
        id: '4',
        titulo: 'Frete Sorocaba → Araraquara',
        origem: 'Sorocaba, SP',
        destino: 'Araraquara, SP',
        valor: 950,
        peso: '4 toneladas',
        urgencia: 'media',
        distancia: '280 km',
        candidatos: 4,
      },
    ]);

    setTimeout(() => setIsLoading(false), 600);
  };

  // Filtrar fretes por busca e urgência
  const filteredFretes = fretes.filter((f) => {
    const matchSearch =
      f.titulo.toLowerCase().includes(search.toLowerCase()) ||
      f.origem.toLowerCase().includes(search.toLowerCase()) ||
      f.destino.toLowerCase().includes(search.toLowerCase());

    const matchUrgencia =
      selectedUrgencia === 'todas' || f.urgencia === selectedUrgencia;

    return matchSearch && matchUrgencia;
  });

  const getUrgenciaStyle = (urgencia: string) => {
    switch (urgencia) {
      case 'alta':
        return { bg: '#FEE2E2', color: '#DC2626', label: '🔴 Urgente' };
      case 'media':
        return { bg: '#FEF3C7', color: '#D97706', label: '🟡 Normal' };
      case 'baixa':
        return { bg: '#DBEAFE', color: '#2563EB', label: '🟢 Flexível' };
      default:
        return { bg: '#F3F4F6', color: '#6B7280', label: 'Normal' };
    }
  };

  const renderFreteCard = ({ item }: { item: FreteCard }) => {
    const urgenciaStyle = getUrgenciaStyle(item.urgencia);

    return (
      <TouchableOpacity style={styles.freteCard} activeOpacity={0.75}>
        <View style={styles.freteTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.freteTitulo} numberOfLines={2}>
              {item.titulo}
            </Text>
            <View style={styles.freteMetaRow}>
              <Ionicons name="location" size={13} color="#64748B" />
              <Text style={styles.freteMetaText}>{item.distancia}</Text>
              <View style={styles.metaDot} />
              <MaterialCommunityIcons name="weight" size={13} color="#64748B" />
              <Text style={styles.freteMetaText}>{item.peso}</Text>
            </View>
          </View>
          <View style={[styles.urgenciaBadge, { backgroundColor: urgenciaStyle.bg }]}>
            <Text style={[styles.urgenciaText, { color: urgenciaStyle.color }]}>
              {urgenciaStyle.label}
            </Text>
          </View>
        </View>

        <View style={styles.freteRoute}>
          <View style={styles.routePoint}>
            <View style={styles.routeDot} />
            <Text style={styles.routeText} numberOfLines={1}>
              {item.origem}
            </Text>
          </View>

          <View style={styles.routeConnector} />

          <View style={styles.routePoint}>
            <View style={[styles.routeDot, styles.routeDotEnd]} />
            <Text style={styles.routeText} numberOfLines={1}>
              {item.destino}
            </Text>
          </View>
        </View>

        <View style={styles.freteFooter}>
          <View>
            <Text style={styles.freteValorLabel}>Valor</Text>
            <Text style={styles.freteValor}>R$ {item.valor.toLocaleString('pt-BR')}</Text>
          </View>

          {item.candidatos !== undefined && (
            <View style={styles.candidatosContainer}>
              <Ionicons name="people" size={14} color="#3B82F6" />
              <Text style={styles.candidatosText}>{item.candidatos}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              setSelectedFrete(item);
              setDetailsVisible(true);
            }}
          >
            <Text style={styles.actionButtonText}>Ver</Text>
            <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <SafeAreaView style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.greetingSection}>
                <Text style={styles.greeting}>Olá, {userName}! 👋</Text>
                <Text style={styles.subGreeting}>
                  Encontre fretes próximos a você
                </Text>
              </View>
              <TouchableOpacity style={styles.notificationButton}>
                <Ionicons name="notifications" size={20} color="#3B82F6" />
                <View style={styles.notificationBadge}>
                  <Text style={styles.badgeText}>3</Text>
                </View>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        {/* Search Box */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#64748B" />
            <TextInput
              placeholder="Buscar frete ou cidade..."
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
              placeholderTextColor="#94A3B8"
            />
          </View>
        </View>

        {/* Filtros por Urgência */}
        <View style={styles.sectionContainer}>
          <Text style={styles.filterTitle}>Filtrar por urgência:</Text>
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterChip, selectedUrgencia === 'todas' && styles.filterChipActive]}
              onPress={() => setSelectedUrgencia('todas')}
            >
              <Text
                style={selectedUrgencia === 'todas' ? styles.filterChipTextActive : styles.filterChipText}
              >
                Todos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, selectedUrgencia === 'alta' && styles.filterChipActive]}
              onPress={() => setSelectedUrgencia('alta')}
            >
              <Text
                style={selectedUrgencia === 'alta' ? styles.filterChipTextActive : styles.filterChipText}
              >
                🔴 Urgente
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, selectedUrgencia === 'media' && styles.filterChipActive]}
              onPress={() => setSelectedUrgencia('media')}
            >
              <Text
                style={selectedUrgencia === 'media' ? styles.filterChipTextActive : styles.filterChipText}
              >
                🟡 Normal
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, selectedUrgencia === 'baixa' && styles.filterChipActive]}
              onPress={() => setSelectedUrgencia('baixa')}
            >
              <Text
                style={selectedUrgencia === 'baixa' ? styles.filterChipTextActive : styles.filterChipText}
              >
                🟢 Flexível
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Fretes Disponíveis */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              🚚 Fretes Disponíveis ({filteredFretes.length})
            </Text>
            <TouchableOpacity>
              <Text style={styles.verMais}>Ver tudo</Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={18}
                color="#3B82F6"
                style={styles.chevron}
              />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator size="large" color="#3B82F6" style={{ marginVertical: 20 }} />
          ) : filteredFretes.length > 0 ? (
            <FlatList
              data={filteredFretes}
              renderItem={renderFreteCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            />
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="inbox" size={48} color="#CBD5E1" />
              <Text style={styles.emptyStateText}>Nenhum frete encontrado</Text>
            </View>
          )}
        </View>

        {/* Quick Links */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Atalhos Rápidos</Text>
          <View style={styles.quickLinksGrid}>
            <TouchableOpacity style={styles.quickLinkCard}>
              <View style={[styles.quickLinkIcon, { backgroundColor: '#DBEAFE' }]}>
                <MaterialCommunityIcons name="chat-multiple" size={22} color="#3B82F6" />
              </View>
              <Text style={styles.quickLinkText}>Mensagens</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickLinkCard}>
              <View style={[styles.quickLinkIcon, { backgroundColor: '#FEE2E2' }]}>
                <MaterialCommunityIcons name="history" size={22} color="#DC2626" />
              </View>
              <Text style={styles.quickLinkText}>Histórico</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickLinkCard}>
              <View style={[styles.quickLinkIcon, { backgroundColor: '#FCD34D' }]}>
                <MaterialCommunityIcons name="star" size={22} color="#F59E0B" />
              </View>
              <Text style={styles.quickLinkText}>Avaliações</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickLinkCard}>
              <View style={[styles.quickLinkIcon, { backgroundColor: '#DCFCE7' }]}>
                <MaterialCommunityIcons name="cog" size={22} color="#16A34A" />
              </View>
              <Text style={styles.quickLinkText}>Configurações</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Modal de Detalhes */}
      <Modal visible={detailsVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header do Modal */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setDetailsVisible(false)}>
                <Ionicons name="close" size={28} color="#0F172A" />
              </TouchableOpacity>
              <Text style={styles.modalHeaderTitle}>Detalhes do Frete</Text>
              <View style={{ width: 28 }} />
            </View>

            {selectedFrete && (
              <ScrollView style={styles.modalBody}>
                {/* Título */}
                <Text style={styles.modalTitle}>{selectedFrete.titulo}</Text>

                {/* Urgência */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Urgência</Text>
                  <View
                    style={[
                      styles.modalBadge,
                      {
                        backgroundColor:
                          selectedFrete.urgencia === 'alta'
                            ? '#FEE2E2'
                            : selectedFrete.urgencia === 'media'
                            ? '#FEF3C7'
                            : '#DBEAFE',
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color:
                          selectedFrete.urgencia === 'alta'
                            ? '#DC2626'
                            : selectedFrete.urgencia === 'media'
                            ? '#D97706'
                            : '#2563EB',
                        fontWeight: '600',
                      }}
                    >
                      {selectedFrete.urgencia === 'alta'
                        ? '🔴 Urgente'
                        : selectedFrete.urgencia === 'media'
                        ? '🟡 Normal'
                        : '🟢 Flexível'}
                    </Text>
                  </View>
                </View>

                {/* Rotas */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Rota</Text>
                  <View style={styles.routeDetail}>
                    <View style={styles.routeDetailItem}>
                      <Ionicons name="location" size={20} color="#3B82F6" />
                      <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text style={styles.routeLabel}>Origem</Text>
                        <Text style={styles.routeValue}>{selectedFrete.origem}</Text>
                      </View>
                    </View>

                    <View style={styles.routeDetailConnector} />

                    <View style={styles.routeDetailItem}>
                      <Ionicons name="location" size={20} color="#0EA5E9" />
                      <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text style={styles.routeLabel}>Destino</Text>
                        <Text style={styles.routeValue}>{selectedFrete.destino}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Informações */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Informações</Text>
                  <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Peso</Text>
                      <Text style={styles.infoValue}>{selectedFrete.peso}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Distância</Text>
                      <Text style={styles.infoValue}>{selectedFrete.distancia}</Text>
                    </View>
                  </View>
                </View>

                {/* Preço e Candidatos */}
                <View style={styles.modalSection}>
                  <View style={styles.priceContainer}>
                    <View>
                      <Text style={styles.modalLabel}>Valor do Frete</Text>
                      <Text style={styles.modalPrice}>
                        R$ {selectedFrete.valor.toLocaleString('pt-BR')}
                      </Text>
                    </View>
                    {selectedFrete.candidatos !== undefined && (
                      <View style={styles.candidatosInfo}>
                        <Ionicons name="people" size={20} color="#3B82F6" />
                        <View>
                          <Text style={styles.modalLabel}>Candidatos</Text>
                          <Text style={styles.candidatosCount}>{selectedFrete.candidatos}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>

                {/* Botão Candidatar */}
                <TouchableOpacity style={styles.candidarButton}>
                  <Text style={styles.candidarButtonText}>Candidatar-se ao Frete</Text>
                </TouchableOpacity>

                <View style={{ height: 20 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerContainer: {
    backgroundColor: '#0F172A',
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greetingSection: {
    flex: 1,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  subGreeting: {
    fontSize: 14,
    color: '#CBD5F5',
    fontWeight: '500',
  },
  notificationButton: {
    position: 'relative',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0F172A',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 20,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    marginLeft: 10,
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  filterTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  verMais: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '600',
  },
  chevron: {
    marginTop: -2,
  },
  freteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  freteTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  freteTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
    lineHeight: 20,
  },
  freteMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  freteMetaText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 4,
  },
  urgenciaBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  urgenciaText: {
    fontSize: 11,
    fontWeight: '600',
  },
  freteRoute: {
    marginBottom: 12,
    paddingVertical: 8,
    gap: 4,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  routeDotEnd: {
    backgroundColor: '#0EA5E9',
  },
  routeConnector: {
    height: 16,
    width: 2,
    backgroundColor: '#BFDBFE',
    marginLeft: 4,
  },
  routeText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    flex: 1,
  },
  freteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 8,
  },
  freteValorLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: 2,
  },
  freteValor: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3B82F6',
  },
  candidatosContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  candidatosText: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  quickLinksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  quickLinkCard: {
    width: (width - 60) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    borderTopWidth: 3,
    borderTopColor: '#F0F4F8',
  },
  quickLinkIcon: {
    width: 50,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },

  // ===== MODAL STYLES =====
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 20,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  routeDetail: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  routeDetailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  routeDetailConnector: {
    height: 20,
    width: 2,
    backgroundColor: '#BFDBFE',
    marginLeft: 10,
    marginVertical: 8,
  },
  routeLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: 2,
  },
  routeValue: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  infoItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '700',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: 4,
  },
  modalPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3B82F6',
  },
  candidatosInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  candidatosCount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  candidarButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  candidarButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default MotoristaHomeScreen;