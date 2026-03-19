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
  status?: 'ativo' | 'em_progresso' | 'concluido';
}

interface ContratanteHomeScreenProps {
  userName?: string;
}

const { width } = Dimensions.get('window');

const ContratanteHomeScreen: React.FC<ContratanteHomeScreenProps> = ({ 
  userName = 'Usuário' 
}) => {
  const [fretes, setFretes] = useState<FreteCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativo' | 'em_progresso' | 'concluido'>('todos');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = () => {
    setIsLoading(true);

    setFretes([
      {
        id: '1',
        titulo: 'Transporte de Maquinário Industrial',
        origem: 'São Bernardo do Campo, SP',
        destino: 'Belo Horizonte, MG',
        valor: 2500,
        peso: '15 toneladas',
        urgencia: 'alta',
        distancia: '580 km',
        candidatos: 8,
        status: 'ativo',
      },
      {
        id: '2',
        titulo: 'Frete de Peças Automotivas',
        origem: 'Guarulhos, SP',
        destino: 'Curitiba, PR',
        valor: 1500,
        peso: '8 toneladas',
        urgencia: 'media',
        distancia: '420 km',
        candidatos: 12,
        status: 'em_progresso',
      },
      {
        id: '3',
        titulo: 'Carga Refrigerada de Alimentos',
        origem: 'São Paulo, SP',
        destino: 'Brasília, DF',
        valor: 3000,
        peso: '10 toneladas',
        urgencia: 'alta',
        distancia: '950 km',
        candidatos: 15,
        status: 'ativo',
      },
      {
        id: '4',
        titulo: 'Transporte de Eletrônicos',
        origem: 'Diadema, SP',
        destino: 'Porto Alegre, RS',
        valor: 2200,
        peso: '6 toneladas',
        urgencia: 'media',
        distancia: '850 km',
        candidatos: 7,
        status: 'concluido',
      },
    ]);

    setTimeout(() => setIsLoading(false), 600);
  };

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

  const getStatusStyle = (status?: string) => {
    switch (status) {
      case 'ativo':
        return { bg: '#DBEAFE', color: '#2563EB', label: '● Ativo', icon: 'check-circle' };
      case 'em_progresso':
        return { bg: '#FEF3C7', color: '#D97706', label: '● Em Progresso', icon: 'sync' };
      case 'concluido':
        return { bg: '#DCFCE7', color: '#16A34A', label: '✓ Concluído', icon: 'check-all' };
      default:
        return { bg: '#F3F4F6', color: '#6B7280', label: 'Normal', icon: 'help-circle' };
    }
  };

  const filteredFretes = statusFilter === 'todos' 
    ? fretes 
    : fretes.filter(frete => frete.status === statusFilter);

  const handleAddDemanda = () => {
    alert('Abrindo formulário para adicionar nova demanda...');
    // Aqui você pode navegar para a tela de criação de demanda
    // router.push('/criar-demanda') ou navigation.navigate('CriarDemanda')
  };

  const renderFreteCard = ({ item }: { item: FreteCard }) => {
    const urgenciaStyle = getUrgenciaStyle(item.urgencia);
    const statusStyle = getStatusStyle(item.status);

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
          <View style={{ flex: 1 }}>
            <Text style={styles.freteValorLabel}>Valor</Text>
            <Text style={styles.freteValor}>R$ {item.valor.toLocaleString('pt-BR')}</Text>
          </View>

          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.statusText, { color: statusStyle.color }]}>
                {statusStyle.label}
              </Text>
            </View>
          </View>

          {item.candidatos !== undefined && (
            <View style={styles.candidatosContainer}>
              <Ionicons name="people" size={14} color="#3B82F6" />
              <Text style={styles.candidatosText}>{item.candidatos}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Detalhes</Text>
            <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const getStatsData = () => {
    const stats = {
      total: fretes.length,
      ativos: fretes.filter(f => f.status === 'ativo').length,
      emProgresso: fretes.filter(f => f.status === 'em_progresso').length,
      concluidos: fretes.filter(f => f.status === 'concluido').length,
      totalCandidatos: fretes.reduce((sum, f) => sum + (f.candidatos || 0), 0),
    };
    return stats;
  };

  const stats = getStatsData();

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <SafeAreaView style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.greetingSection}>
                <Text style={styles.greeting}>Olá, {userName}! 👋</Text>
                <Text style={styles.subGreeting}>
                  Publique e acompanhe seus fretes
                </Text>
              </View>
              <TouchableOpacity style={styles.notificationButton}>
                <Ionicons name="notifications" size={20} color="#3B82F6" />
                <View style={styles.notificationBadge}>
                  <Text style={styles.badgeText}>5</Text>
                </View>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: '#EFF6FF' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#DBEAFE' }]}>
              <MaterialCommunityIcons name="file-document" size={20} color="#3B82F6" />
            </View>
            <View>
              <Text style={styles.statLabel}>Fretes Publicados</Text>
              <Text style={styles.statValue}>{stats.total}</Text>
            </View>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#FCD34D' }]}>
              <MaterialCommunityIcons name="clock-outline" size={20} color="#D97706" />
            </View>
            <View>
              <Text style={styles.statLabel}>Em Andamento</Text>
              <Text style={styles.statValue}>{stats.emProgresso}</Text>
            </View>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#DCFCE7' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#BBFBEE' }]}>
              <MaterialCommunityIcons name="check-circle" size={20} color="#16A34A" />
            </View>
            <View>
              <Text style={styles.statLabel}>Concluídos</Text>
              <Text style={styles.statValue}>{stats.concluidos}</Text>
            </View>
          </View>
        </View>

        {/* Filtros por Status */}
        <View style={styles.sectionContainer}>
          <Text style={styles.filterTitle}>Filtrar por status:</Text>
          <View style={styles.filterRow}>
            <TouchableOpacity 
              style={[styles.filterChip, statusFilter === 'todos' && styles.filterChipActive]}
              onPress={() => setStatusFilter('todos')}
            >
              <Text style={statusFilter === 'todos' ? styles.filterChipTextActive : styles.filterChipText}>
                Todos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterChip, statusFilter === 'ativo' && styles.filterChipActive]}
              onPress={() => setStatusFilter('ativo')}
            >
              <Text style={statusFilter === 'ativo' ? styles.filterChipTextActive : styles.filterChipText}>
                Ativos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterChip, statusFilter === 'em_progresso' && styles.filterChipActive]}
              onPress={() => setStatusFilter('em_progresso')}
            >
              <Text style={statusFilter === 'em_progresso' ? styles.filterChipTextActive : styles.filterChipText}>
                Em Progresso
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterChip, statusFilter === 'concluido' && styles.filterChipActive]}
              onPress={() => setStatusFilter('concluido')}
            >
              <Text style={statusFilter === 'concluido' ? styles.filterChipTextActive : styles.filterChipText}>
                Concluídos
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Seus Fretes */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              📦 Seus Fretes
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
          ) : (
            <FlatList
              data={filteredFretes}
              renderItem={renderFreteCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons name="inbox" size={48} color="#CBD5E1" />
                  <Text style={styles.emptyStateText}>Nenhum frete neste status</Text>
                </View>
              }
            />
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

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddDemanda}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
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
  statsContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    gap: 12,
  },
  statIcon: {
    width: 50,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginTop: 24,
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
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 10,
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
  statusContainer: {
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
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
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
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
});

export default ContratanteHomeScreen;