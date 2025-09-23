// app/(tabs)/home.tsx

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { useUser } from '../../components/UserContext';
import { API_ENDPOINTS } from '../../constants/Api';

const { width: screenWidth } = Dimensions.get('window');

const HomeScreen = () => {
  const router = useRouter();
  const { logout } = useUser();

  const handleLogout = async () => {
    try {
      await logout();
      // Forçar navegação para login após logout
      router.replace('/login');
    } catch (error) {
      showMessage({ message: 'Erro ao fazer logout.', type: 'danger' });
    }
  };

  const { userName, userEmail, token, userId } = useUser();

  const [weightKg, setWeightKg] = useState<number | null>(null);
  const [heightCm, setHeightCm] = useState<number | null>(null);
  const [deltaKg, setDeltaKg] = useState<number | null>(null);
  const [weightHistory, setWeightHistory] = useState<{ weight: number; date: string }[]>([]);
  const [measurementLoading, setMeasurementLoading] = useState(false);

  // editing state
  const [editingWeight, setEditingWeight] = useState(false);
  const [editingHeight, setEditingHeight] = useState(false);
  const [tempWeight, setTempWeight] = useState('');
  const [tempHeight, setTempHeight] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  const loadLatest = useCallback(async () => {
    if (!token || !userId) return;
    setMeasurementLoading(true);
    
    // Mock de dados para desenvolvimento
    if (__DEV__ && userId === 'dev-user-001') {
      console.log('🔧 DEV MODE: Carregando dados fictícios de medições');
      
      // Simular dados de exemplo dos últimos 30 dias
      const mockData = [];
      const today = new Date();
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        // Peso varia entre 77-82kg com tendência de redução
        const baseWeight = 82 - (i * 0.1) + (Math.random() * 1 - 0.5);
        
        mockData.push({
          id: `mock-${i}`,
          weightInKG: Number(baseWeight.toFixed(1)),
          heightInCM: 178,
          timestamp: date.toISOString(),
          userId: 'dev-user-001'
        });
      }
      
      // Processar dados como na API real
      const items = mockData.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      // Extrair histórico de peso - apenas um registro por dia (o mais recente)
      const weightByDay = new Map<string, any>();
      
      items
        .filter((item: any) => item.weightInKG != null)
        .forEach((item: any) => {
          const dateKey = new Date(item.timestamp).toDateString();
          if (!weightByDay.has(dateKey) || new Date(item.timestamp) > new Date(weightByDay.get(dateKey).timestamp)) {
            weightByDay.set(dateKey, item);
          }
        });
      
      // Converter para array e pegar os últimos 10 dias
      const weightHistoryData = Array.from(weightByDay.values())
        .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .slice(-10)
        .map((item: any) => ({
          weight: item.weightInKG,
          date: new Date(item.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        }));
      
      setWeightHistory(weightHistoryData);
      
      const latest = items[0];
      setWeightKg(latest.weightInKG ?? null);
      setHeightCm(latest.heightInCM ?? null);
      
      if (items.length > 1) {
        const prev = items[1];
        if (prev && typeof prev.weightInKG === 'number' && typeof latest.weightInKG === 'number') {
          setDeltaKg(Number((latest.weightInKG - prev.weightInKG).toFixed(1)));
        }
      }
      
      setMeasurementLoading(false);
      console.log('📊 DEV MODE: Dados fictícios carregados:', { peso: latest.weightInKG, altura: latest.heightInCM });
      return;
    }
    
    try {
      const resp = await fetch(API_ENDPOINTS.USERS.MEASUREMENTS(userId), {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!resp.ok) {
        console.log('Failed to fetch measurements, status:', resp.status);
        setMeasurementLoading(false);
        return;
      }
      const data = await resp.json();
      const items = Array.isArray(data) ? data : data.content || [];
      if (!items || items.length === 0) {
        setMeasurementLoading(false);
        return;
      }
      items.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      // Extrair histórico de peso - apenas um registro por dia (o mais recente)
      const weightByDay = new Map<string, any>();
      
      // Agrupar por data e manter apenas o mais recente de cada dia
      items
        .filter((item: any) => item.weightInKG != null)
        .forEach((item: any) => {
          const dateKey = new Date(item.timestamp).toDateString(); // Ex: "Mon Dec 25 2023"
          if (!weightByDay.has(dateKey) || new Date(item.timestamp) > new Date(weightByDay.get(dateKey).timestamp)) {
            weightByDay.set(dateKey, item);
          }
        });
      
      // Converter para array, ordenar e pegar os últimos 10 dias
      const weightHistoryData = Array.from(weightByDay.values())
        .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) // Ordem cronológica
        .slice(-10) // Últimos 10 dias (não registros)
        .map((item: any) => ({
          weight: item.weightInKG,
          date: new Date(item.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        }));
      
      setWeightHistory(weightHistoryData);
      
      // Debug: log para verificar os dados
      console.log('Weight history loaded:', weightHistoryData);
      
      const latest = items[0];
      setWeightKg(latest.weightInKG ?? null);
      setHeightCm(latest.heightInCM ?? null);
      if (items.length > 1) {
        const prev = items[1];
        if (prev && typeof prev.weightInKG === 'number' && typeof latest.weightInKG === 'number') {
          setDeltaKg(Number((latest.weightInKG - prev.weightInKG).toFixed(1)));
        }
      }
    } catch (err) {
      console.log('Error loading measurements:', err);
      showMessage({ message: 'Erro ao carregar medições.', type: 'danger' });
    } finally {
      setMeasurementLoading(false);
    }
  }, [token, userId]);

  useEffect(() => {
    loadLatest();
  }, [loadLatest]);

  // Função para renderizar gráfico usando Views nativas
  const renderWeightChart = () => {
    let dataToUse = weightHistory;
    
    // Se não há dados históricos, usar dados de exemplo para demonstração
    if (weightHistory.length === 0 && weightKg != null) {
      const today = new Date();
      dataToUse = [
        { weight: weightKg - 1, date: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) },
        { weight: weightKg, date: today.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) }
      ];
    }
    
    if (dataToUse.length === 0) {
      return null;
    }

    const chartWidth = Math.min(screenWidth * 0.8, 280);
    const chartHeight = 120;
    const padding = 20;
    
    const weights = dataToUse.map(item => item.weight);
    const dates = dataToUse.map(item => item.date);
    
    const minWeight = Math.min(...weights) - 0.5;
    const maxWeight = Math.max(...weights) + 0.5;
    const weightRange = maxWeight - minWeight || 1;
    
    const xStep = (chartWidth - padding * 2) / Math.max(weights.length - 1, 1);
    
    const points = weights.map((weight, index) => {
      const x = padding + index * xStep;
      const y = padding + ((maxWeight - weight) / weightRange) * (chartHeight - padding * 2);
      return { x, y, weight, date: dates[index] };
    });

    return (
      <View style={[styles.chartWrapper, { width: chartWidth, height: chartHeight }]}>
        {/* Linha de conexão entre pontos */}
        {points.length > 1 && (
          <View style={styles.lineContainer}>
            {points.slice(0, -1).map((point, index) => {
              const nextPoint = points[index + 1];
              const lineWidth = Math.sqrt(Math.pow(nextPoint.x - point.x, 2) + Math.pow(nextPoint.y - point.y, 2));
              const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * 180 / Math.PI;
              
              return (
                <View
                  key={index}
                  style={[
                    styles.chartLine,
                    {
                      position: 'absolute',
                      left: point.x,
                      top: point.y,
                      width: lineWidth,
                      transform: [{ rotate: `${angle}deg` }],
                      transformOrigin: '0 50%',
                    }
                  ]}
                />
              );
            })}
          </View>
        )}
        
        {/* Pontos do gráfico */}
        {points.map((point, index) => (
          <View key={index} style={[styles.chartPoint, { left: point.x - 6, top: point.y - 6 }]}>
            <View style={styles.pointDot} />
            <View style={styles.pointLabel}>
              <Text style={styles.pointText}>{point.weight.toFixed(1)}kg</Text>
            </View>
          </View>
        ))}
        
        {/* Labels das datas */}
        <View style={styles.dateLabels}>
          <Text style={styles.dateLabel}>{dates[0]}</Text>
          {dates.length > 1 && (
            <Text style={styles.dateLabel}>{dates[dates.length - 1]}</Text>
          )}
        </View>
      </View>
    );
  };

  const startEditWeight = () => {
    setTempWeight(weightKg != null ? String(weightKg) : '');
    setEditingWeight(true);
  };
  const cancelEditWeight = () => {
    setEditingWeight(false);
    setTempWeight('');
  };
  const startEditHeight = () => {
    setTempHeight(heightCm != null ? String(heightCm) : '');
    setEditingHeight(true);
  };
  const cancelEditHeight = () => {
    setEditingHeight(false);
    setTempHeight('');
  };

  const saveMeasurement = async (payload: { weightInKG?: number | null; heightInCM?: number | null }) => {
    if (!token || !userId) {
      showMessage({ message: 'Usuário não autenticado.', type: 'danger' });
      return;
    }
    setSaveLoading(true);
    try {
      const resp = await fetch(API_ENDPOINTS.USERS.MEASUREMENTS(userId), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, timestamp: new Date().toISOString() }),
      });
      if (!resp.ok) {
        const text = await resp.text();
        showMessage({ message: 'Erro ao salvar medição.', type: 'danger' });
        return;
      }
      showMessage({ message: 'Medição salva.', type: 'success' });
      // refresh latest
      await loadLatest();
    } catch (err) {
      showMessage({ message: 'Erro ao salvar medição.', type: 'danger' });
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Olá, {userName ? userName : userEmail ? userEmail : 'Usuário'}!</Text>
            <Text style={styles.subtitleSmall}>Bem-vindo de volta</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton} onPress={() => showMessage({ message: 'Notificações (teste)', type: 'info' })}>
              <Ionicons name="notifications-outline" size={20} color="#374151" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={18} color="#374151" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
              <Image source={require('../../assets/images/logo_mindfit.png')} style={styles.avatar} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.pageTitle}>DASHBOARD PRINCIPAL</Text>

  <View style={styles.grid}>
        <TouchableOpacity style={styles.card} onPress={() => router.push('/(tabs)/exercise')}>
          <MaterialCommunityIcons name="dumbbell" size={screenWidth < 440 ? 28 : 32} color="#22c55e" />
          <Text style={styles.cardLabel}>Treinos</Text>
        </TouchableOpacity>
  <TouchableOpacity style={styles.card} onPress={() => router.push('/(tabs)/nutrition')}>
          <MaterialCommunityIcons name="food-apple" size={screenWidth < 440 ? 28 : 32} color="#10b981" />
          <Text style={styles.cardLabel}>Nutrição</Text>
        </TouchableOpacity>
  <TouchableOpacity style={styles.card} onPress={() => router.push('/(tabs)/assistant')}>
          <MaterialCommunityIcons name="robot-excited" size={screenWidth < 440 ? 28 : 32} color="#8b5cf6" />
          <Text style={styles.cardLabel}>Assistente</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => router.push('/(tabs)/profile')}>
          <MaterialCommunityIcons name="account-cog" size={screenWidth < 440 ? 28 : 32} color="#f59e0b" />
          <Text style={styles.cardLabel}>Config</Text>
        </TouchableOpacity>
      </View>

        <View style={styles.section}>
        <Text style={styles.sectionTitle}>Peso Atual</Text>
        <View style={styles.kpiRow}>
          <View style={styles.kpiBox}>
            <View style={styles.kpiBoxRow}>
              <View style={styles.kpiLabelRow}>
                <MaterialCommunityIcons name="weight-kilogram" size={20} color="#22c55e" style={{ marginRight: 10 }} />
                <Text style={styles.kpiLabel}>Peso Atual</Text>
              </View>
              <TouchableOpacity onPress={startEditWeight} style={styles.editButton}>
                <Ionicons name="pencil" size={16} color="#374151" />
              </TouchableOpacity>
            </View>
            {editingWeight ? (
              <View>
                <View style={styles.inputWithUnit}>
                  <TextInput 
                    style={[styles.editInput, styles.inputWithUnitField]} 
                    keyboardType="numeric" 
                    value={tempWeight} 
                    onChangeText={setTempWeight}
                    placeholder="Ex: 70.5"
                    placeholderTextColor="#94a3b8"
                  />
                  <Text style={styles.unitLabel}>kg</Text>
                </View>
                <View style={styles.editButtonsRow}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => { cancelEditWeight(); }}>
                    <Text style={styles.editBtnText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.editBtn, { backgroundColor: '#22c55e' }]}
                    onPress={async () => {
                      const w = parseFloat(tempWeight.replace(',', '.'));
                      if (isNaN(w) || w <= 0) {
                        showMessage({ message: 'Informe um peso válido.', type: 'danger' });
                        return;
                      }
                      const payload: any = { weightInKG: w };
                      if (heightCm != null) payload.heightInCM = heightCm;
                      await saveMeasurement(payload);
                      setEditingWeight(false);
                      setTempWeight('');
                    }}
                  >
                    {saveLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={[styles.editBtnText, { color: '#fff' }]}>Salvar</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <Text style={styles.kpiValue}>{weightKg != null ? `${weightKg.toFixed(1)} kg` : '—'}</Text>
            )}
          </View>
          <View style={[styles.kpiBox, styles.kpiBoxRight]}>
            <View style={styles.kpiBoxRow}>
              <View style={styles.kpiLabelRow}>
                <MaterialCommunityIcons name="ruler" size={20} color="#06b6d4" style={{ marginRight: 10 }} />
                <Text style={styles.kpiLabel}>Altura Atual</Text>
              </View>
              <TouchableOpacity onPress={startEditHeight} style={styles.editButton}>
                <Ionicons name="pencil" size={16} color="#374151" />
              </TouchableOpacity>
            </View>
            {editingHeight ? (
              <View>
                <View style={styles.inputWithUnit}>
                  <TextInput 
                    style={[styles.editInput, styles.inputWithUnitField]} 
                    keyboardType="numeric" 
                    value={tempHeight} 
                    onChangeText={setTempHeight}
                    placeholder="Ex: 175"
                    placeholderTextColor="#94a3b8"
                  />
                  <Text style={styles.unitLabel}>cm</Text>
                </View>
                <View style={styles.editButtonsRow}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => { cancelEditHeight(); }}>
                    <Text style={styles.editBtnText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.editBtn, { backgroundColor: '#22c55e' }]}
                    onPress={async () => {
                      const h = parseInt(tempHeight, 10);
                      if (isNaN(h) || h <= 0) {
                        showMessage({ message: 'Informe uma altura válida.', type: 'danger' });
                        return;
                      }
                      const payload: any = { heightInCM: h };
                      if (weightKg != null) payload.weightInKG = weightKg;
                      await saveMeasurement(payload);
                      setEditingHeight(false);
                      setTempHeight('');
                    }}
                  >
                    {saveLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={[styles.editBtnText, { color: '#fff' }]}>Salvar</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <Text style={styles.kpiValue}>{heightCm != null ? `${heightCm} cm` : '—'}</Text>
            )}
          </View>
        </View>
        </View>

        {/* Seção do gráfico separada */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Evolução do Peso</Text>
          <View style={styles.chartCard}>
            <View style={styles.weightInfo}>
              {measurementLoading ? (
                <ActivityIndicator size="small" />
              ) : (
                <Text style={styles.weightValue}>{weightKg != null ? `${weightKg.toFixed(1)} kg` : '—'}</Text>
              )}
              <Text style={[styles.weightDelta, deltaKg != null ? (deltaKg <= 0 ? styles.deltaDown : styles.deltaUp) : {}]}>
                {deltaKg != null ? `${deltaKg > 0 ? '+' : ''}${deltaKg.toFixed(1)} kg` : '-'}
              </Text>
              <Text style={styles.heightText}>{heightCm ? `Altura: ${heightCm} cm` : ''}</Text>
            </View>
            <View style={styles.chartContainer}>
              {weightHistory.length > 0 || weightKg != null ? (
                renderWeightChart()
              ) : (
                <View style={styles.noDataContainer}>
                  <MaterialCommunityIcons name="chart-line" size={32} color="#cbd5e1" />
                  <Text style={styles.noDataText}>Sem dados de peso</Text>
                  <Text style={styles.noDataSubtext}>Adicione algumas medições para ver o gráfico</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Resumo Diário removido conforme solicitado */}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  container: {
    padding: screenWidth < 400 ? 16 : 20,
    paddingBottom: 100, // Para evitar que o conteúdo fique atrás da tab bar
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: screenWidth < 400 ? 20 : 28,
    paddingTop: 12,
    paddingBottom: 4,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 16,
  },
  greeting: {
    fontSize: screenWidth < 400 ? 22 : 26,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitleSmall: {
    color: '#475569',
    fontSize: screenWidth < 400 ? 13 : 15,
    fontWeight: '600',
    opacity: 0.8,
  },
  kpiRow: {
    flexDirection: screenWidth < 400 ? 'column' : 'row',
    justifyContent: 'space-between',
    marginBottom: 0,
    gap: 16,
  },
  kpiBox: {
    flexBasis: screenWidth < 400 ? '100%' : '48%',
    backgroundColor: '#ffffff',
    padding: screenWidth < 400 ? 18 : 24,
    borderRadius: 20,
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    position: 'relative',
  },
  kpiBoxRight: {
    marginRight: 0,
  },
  kpiBoxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  kpiLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  editButton: {
    padding: screenWidth < 400 ? 8 : 10,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    shadowColor: '#64748b',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  editInput: {
    borderWidth: 2,
    borderColor: '#22c55e',
    backgroundColor: '#f0f9ff',
    padding: screenWidth < 440 ? 12 : 14,
    marginTop: 10,
    borderRadius: 14,
    width: '100%',
    fontSize: screenWidth < 440 ? 14 : 16,
    fontWeight: '600',
    color: '#0f172a',
    shadowColor: '#22c55e',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  editButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 12,
  },
  editBtn: {
    paddingVertical: screenWidth < 440 ? 10 : 12,
    paddingHorizontal: screenWidth < 440 ? 16 : 20,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    shadowColor: '#64748b',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  editBtnText: {
    color: '#374151',
    fontWeight: '700',
    fontSize: screenWidth < 440 ? 12 : 14,
    letterSpacing: 0.25,
  },
  kpiLabel: {
    fontSize: screenWidth < 440 ? 10 : 12,
    color: '#475569',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginLeft: 2,
  },
  kpiValue: {
    fontSize: screenWidth < 400 ? 24 : 30,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 12,
    letterSpacing: -0.5,
  },
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: screenWidth < 400 ? 16 : 24,
    paddingBottom: 40,
    marginTop: 0,
    shadowColor: '#0f172a',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 30,
    elevation: 10,
    flexDirection: screenWidth < 400 ? 'column' : 'row',
    alignItems: screenWidth < 400 ? 'flex-start' : 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  weightInfo: {
    flex: screenWidth < 400 ? 0 : 1,
    paddingRight: screenWidth < 400 ? 0 : 20,
    marginBottom: screenWidth < 400 ? 16 : 0,
  },
  chartContainer: {
    alignItems: screenWidth < 400 ? 'center' : 'flex-end',
    width: screenWidth < 400 ? '100%' : 'auto',
  },
  chartImage: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#64748b',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  iconButton: {
    marginRight: screenWidth < 400 ? 8 : 12,
    padding: screenWidth < 400 ? 10 : 14,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#0f172a',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  avatar: {
    width: screenWidth < 400 ? 40 : 52,
    height: screenWidth < 400 ? 40 : 52,
    borderRadius: screenWidth < 400 ? 20 : 26,
    borderWidth: 3,
    borderColor: '#22c55e',
    shadowColor: '#22c55e',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  pageTitle: {
    fontSize: screenWidth < 400 ? 16 : 18,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 24,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    opacity: 0.9,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: screenWidth < 440 ? 10 : 16,
    paddingHorizontal: screenWidth < 400 ? 4 : 0,
  },
  card: {
    width: screenWidth < 350 ? '100%' : screenWidth < 440 ? '47%' : '48%',
    backgroundColor: '#ffffff',
    padding: screenWidth < 350 ? 12 : screenWidth < 440 ? 16 : 28,
    borderRadius: screenWidth < 350 ? 14 : screenWidth < 440 ? 18 : 24,
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    transform: [{ scale: 1 }],
    marginBottom: screenWidth < 350 ? 12 : 0,
  },
  cardLabel: {
    marginTop: screenWidth < 440 ? 10 : 16,
    color: '#0f172a',
    fontWeight: '800',
    fontSize: screenWidth < 440 ? 12 : 15,
    letterSpacing: 0.25,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: screenWidth < 400 ? 18 : 22,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  weightValue: {
    fontSize: screenWidth < 400 ? 28 : 36,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -1,
  },
  weightDelta: {
    color: '#059669',
    fontWeight: '800',
    marginTop: 8,
    fontSize: screenWidth < 400 ? 14 : 17,
    letterSpacing: 0.25,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  chartLabel: {
    fontSize: screenWidth < 400 ? 10 : 11,
    color: '#475569',
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '32%',
    backgroundColor: '#f8fafc',
    padding: screenWidth < 400 ? 10 : 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryLabel: {
    color: '#475569',
    fontSize: screenWidth < 400 ? 11 : 13,
    fontWeight: '600',
  },
  summaryValue: {
    fontWeight: '800',
    marginTop: 8,
    color: '#0f172a',
    fontSize: screenWidth < 440 ? 14 : 16,
  },
  deltaDown: {
    color: '#059669',
  },
  deltaUp: {
    color: '#dc2626',
  },
  heightText: {
    color: '#475569',
    fontSize: screenWidth < 400 ? 13 : 15,
    marginTop: 8,
    fontWeight: '600',
    opacity: 0.8,
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: screenWidth < 400 ? 20 : 30,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  noDataText: {
    color: '#64748b',
    fontSize: screenWidth < 440 ? 12 : 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  noDataSubtext: {
    color: '#94a3b8',
    fontSize: screenWidth < 440 ? 10 : 12,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  chartWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    position: 'relative',
    shadowColor: '#64748b',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  lineContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  chartLine: {
    height: 3,
    backgroundColor: '#22c55e',
    borderRadius: 2,
  },
  chartPoint: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#22c55e',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  pointLabel: {
    position: 'absolute',
    top: -30,
    minWidth: 40,
    alignItems: 'center',
    backgroundColor: '#22c55e',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pointText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  dateLabels: {
    position: 'absolute',
    bottom: -25,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  dateLabel: {
    fontSize: screenWidth < 400 ? 10 : 11,
    color: '#475569',
    fontWeight: '600',
  },
  inputWithUnit: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#22c55e',
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  inputWithUnitField: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
    marginBottom: 0,
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
  unitLabel: {
    color: '#059669',
    fontWeight: '800',
    fontSize: 16,
    marginLeft: 8,
    minWidth: 30,
    textAlign: 'right',
  },
});

export default HomeScreen;
