// app/(tabs)/home.tsx

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { useUser } from '../../components/UserContext';

const HomeScreen = () => {
  const router = useRouter();
  const { logout } = useUser();

  const handleLogout = async () => {
    await logout();
    showMessage({ message: 'Logout realizado.', type: 'success' });
    router.replace('/login');
  };

  const weightData = [76, 75.5, 75, 74.5, 74, 73.5, 73];
  // dates removed from UI per request

  // map data to svg points
  const width = 300;
  const height = 100;
  const padding = 12;
  const minY = 72;
  const maxY = 76;
  const xStep = (width - padding * 2) / (weightData.length - 1);
  const pointsArray = weightData.map((v, i) => {
    const x = padding + i * xStep;
    const y = padding + ((maxY - v) / (maxY - minY)) * (height - padding * 2);
    return { x, y };
  });
  const points = pointsArray.map(p => `${p.x},${p.y}`).join(' ');
  // build an inline SVG as data URI to avoid depending on react-native-svg (avoids web bundler issues)
  const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'>
      <rect x='0' y='0' width='${width}' height='${height}' fill='white' />
      <polyline fill='none' stroke='#0ea5e9' stroke-width='3' points='${points}' stroke-linecap='round' stroke-linejoin='round' />
      ${pointsArray
        .map(p => `<circle cx='${p.x}' cy='${p.y}' r='3' fill='#0ea5e9' />`)
        .join('')}
    </svg>
  `;
  const svgUri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

  const { userName, userEmail, token, userId } = useUser();

  const [weightKg, setWeightKg] = useState<number | null>(null);
  const [heightCm, setHeightCm] = useState<number | null>(null);
  const [deltaKg, setDeltaKg] = useState<number | null>(null);
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
    try {
      const resp = await fetch(`https://mindfitapi.outis.com.br/users/${userId}/measurements`, {
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
      const resp = await fetch(`https://mindfitapi.outis.com.br/users/${userId}/measurements`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, timestamp: new Date().toISOString() }),
      });
      if (!resp.ok) {
        const text = await resp.text();
        console.log('Failed to save measurement', resp.status, text);
        showMessage({ message: 'Erro ao salvar medição.', type: 'danger' });
        return;
      }
      showMessage({ message: 'Medição salva.', type: 'success' });
      // refresh latest
      await loadLatest();
    } catch (err) {
      console.log('Error saving measurement:', err);
      showMessage({ message: 'Erro ao salvar medição.', type: 'danger' });
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {userName ? userName : userEmail ? userEmail : 'Usuário'}!</Text>
          <Text style={styles.subtitleSmall}>Bem-vindo de volta</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton} onPress={() => showMessage({ message: 'Notificações (teste)', type: 'info' })}>
            <Ionicons name="notifications-outline" size={22} color="#111" />
          </TouchableOpacity>
          <Image source={require('../../assets/images/logo_mindfit.png')} style={styles.avatar} />
        </View>
      </View>

      <Text style={styles.pageTitle}>DASHBOARD PRINCIPAL</Text>

  <View style={styles.grid}>
        <TouchableOpacity style={styles.card} onPress={() => router.push('/(tabs)/explore')}>
          <MaterialCommunityIcons name="dumbbell" size={28} color="#0f172a" />
          <Text style={styles.cardLabel}>Treinos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => showMessage({ message: 'Nutrição (em breve)', type: 'info' })}>
          <MaterialCommunityIcons name="food-apple" size={28} color="#0f172a" />
          <Text style={styles.cardLabel}>Nutrição</Text>
        </TouchableOpacity>
  <TouchableOpacity style={styles.card} onPress={() => router.push('/(tabs)/assistant')}>
          <MaterialCommunityIcons name="robot-excited" size={28} color="#0f172a" />
          <Text style={styles.cardLabel}>Assistente</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={handleLogout}>
          <MaterialCommunityIcons name="account-cog" size={28} color="#0f172a" />
          <Text style={styles.cardLabel}>Configurações</Text>
        </TouchableOpacity>
      </View>

        <View style={styles.section}>
        <Text style={styles.sectionTitle}>Peso Atual</Text>
        <View style={styles.kpiRow}>
          <View style={styles.kpiBox}>
            <View style={styles.kpiBoxRow}>
              <View style={styles.kpiLabelRow}>
                <MaterialCommunityIcons name="weight-kilogram" size={18} color="#0ea5e9" style={{ marginRight: 8 }} />
                <Text style={styles.kpiLabel}>Peso Atual</Text>
              </View>
              <TouchableOpacity onPress={startEditWeight} style={styles.editButton}>
                <Ionicons name="pencil" size={14} color="#0f172a" />
              </TouchableOpacity>
            </View>
            {editingWeight ? (
              <View>
                <TextInput style={styles.editInput} keyboardType="numeric" value={tempWeight} onChangeText={setTempWeight} />
                <View style={styles.editButtonsRow}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => { cancelEditWeight(); }}>
                    <Text style={styles.editBtnText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.editBtn, { backgroundColor: '#0ea5e9' }]}
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
                <MaterialCommunityIcons name="ruler" size={18} color="#06b6d4" style={{ marginRight: 8 }} />
                <Text style={styles.kpiLabel}>Altura Atual</Text>
              </View>
              <TouchableOpacity onPress={startEditHeight} style={styles.editButton}>
                <Ionicons name="pencil" size={14} color="#0f172a" />
              </TouchableOpacity>
            </View>
            {editingHeight ? (
              <View>
                <TextInput style={styles.editInput} keyboardType="numeric" value={tempHeight} onChangeText={setTempHeight} />
                <View style={styles.editButtonsRow}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => { cancelEditHeight(); }}>
                    <Text style={styles.editBtnText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.editBtn, { backgroundColor: '#0ea5e9' }]}
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
          <Image source={{ uri: svgUri }} style={styles.chartImage} />
        </View>
  {/* dates removed from chart */}
      </View>

  {/* Resumo Diário removido conforme solicitado */}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitleSmall: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  kpiBox: {
    flexBasis: '48%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#1e293b',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  kpiBoxRight: {
    marginRight: 0,
  },
  kpiBoxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  kpiLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    padding: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  editInput: {
    borderWidth: 2,
    borderColor: '#0ea5e9',
    backgroundColor: '#f0f9ff',
    padding: 12,
    marginTop: 8,
    borderRadius: 12,
    width: '100%',
    fontSize: 16,
    fontWeight: '600',
  },
  editButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 8,
  },
  editBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  editBtnText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 14,
  },
  kpiLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1e293b',
    marginTop: 8,
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginTop: 8,
    shadowColor: '#1e293b',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  weightInfo: {
    flex: 1,
    paddingRight: 16,
  },
  chartImage: {
    width: 280,
    height: 100,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginRight: 16,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#1e293b',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#0ea5e9',
  },
  pageTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  card: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#1e293b',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardLabel: {
    marginTop: 12,
    color: '#1e293b',
    fontWeight: '700',
    fontSize: 14,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 16,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  weightValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1e293b',
  },
  weightDelta: {
    color: '#059669',
    fontWeight: '700',
    marginTop: 6,
    fontSize: 16,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  chartLabel: {
    fontSize: 10,
    color: '#64748b',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '32%',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#64748b',
    fontSize: 12,
  },
  summaryValue: {
    fontWeight: '700',
    marginTop: 6,
    color: '#0f172a',
  },
  deltaDown: {
    color: '#059669',
  },
  deltaUp: {
    color: '#dc2626',
  },
  heightText: {
    color: '#64748b',
    fontSize: 14,
    marginTop: 6,
    fontWeight: '500',
  },
});

export default HomeScreen;