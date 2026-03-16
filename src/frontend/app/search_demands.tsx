import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface Demanda {
  id: string;
  titulo: string;
  origem: string;
  destino: string;
  valor: number;
  peso: string;
  urgencia: 'baixa' | 'media' | 'alta';
}

const BuscarDemandasScreen = () => {
  const [search, setSearch] = useState('');

  const [demandas] = useState<Demanda[]>([
    {
      id: '1',
      titulo: 'Carga de Eletrônicos',
      origem: 'São Paulo, SP',
      destino: 'Curitiba, PR',
      valor: 1800,
      peso: '4 toneladas',
      urgencia: 'media',
    },
    {
      id: '2',
      titulo: 'Transporte de Alimentos',
      origem: 'Campinas, SP',
      destino: 'Belo Horizonte, MG',
      valor: 2500,
      peso: '8 toneladas',
      urgencia: 'alta',
    },
    {
      id: '3',
      titulo: 'Peças Automotivas',
      origem: 'Santo André, SP',
      destino: 'Sorocaba, SP',
      valor: 900,
      peso: '2 toneladas',
      urgencia: 'baixa',
    },
  ]);

  const getUrgenciaColor = (urgencia: string) => {
    if (urgencia === 'alta') return '#DC2626';
    if (urgencia === 'media') return '#D97706';
    return '#2563EB';
  };

  const renderItem = ({ item }: { item: Demanda }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <Text style={styles.title}>{item.titulo}</Text>

        <View
          style={[
            styles.badge,
            { backgroundColor: getUrgenciaColor(item.urgencia) + '20' },
          ]}
        >
          <Text style={{ color: getUrgenciaColor(item.urgencia) }}>
            {item.urgencia.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.route}>
        <Ionicons name="location" size={14} color="#64748B" />
        <Text style={styles.routeText}>
          {item.origem} → {item.destino}
        </Text>
      </View>

      <View style={styles.metaRow}>
        <MaterialCommunityIcons name="weight" size={14} color="#64748B" />
        <Text style={styles.meta}>{item.peso}</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.price}>R$ {item.valor}</Text>

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Detalhes</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView>

        {/* Header */}
        <Text style={styles.header}>Buscar Demandas</Text>

        {/* Search */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#64748B" />
          <TextInput
            placeholder="Buscar por cidade ou carga..."
            style={styles.input}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Filters */}
        <View style={styles.filters}>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterText}>Origem</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterText}>Destino</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterText}>Peso</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterText}>Urgência</Text>
          </TouchableOpacity>
        </View>

        {/* Lista */}
        <FlatList
          data={demandas}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
        />

      </SafeAreaView>
    </View>
  );
};

export default BuscarDemandasScreen;

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 20,
  },

  header: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 20,
    color: '#0F172A',
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },

  input: {
    marginLeft: 10,
    flex: 1,
  },

  filters: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  filterButton: {
    backgroundColor: '#E2E8F0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },

  filterText: {
    fontSize: 12,
    fontWeight: '600',
  },

  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  title: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },

  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  route: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },

  routeText: {
    marginLeft: 6,
    color: '#64748B',
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  meta: {
    marginLeft: 6,
    color: '#64748B',
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3B82F6',
  },

  button: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },

  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

});