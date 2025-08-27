import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { useUser } from '../../components/UserContext';

type Workout = {
  id?: string | number;
  name: string;
  durationMinutes?: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard' | string;
  description?: string;
};

const FALLBACK_WORKOUTS: Workout[] = [
  { id: 'w1', name: 'Full Body Express', durationMinutes: 20, difficulty: 'Easy', description: 'Treino rápido para todo corpo' },
  { id: 'w2', name: 'HIIT Intenso', durationMinutes: 30, difficulty: 'Hard', description: 'Intervalos de alta intensidade' },
  { id: 'w3', name: 'Core & Mobility', durationMinutes: 25, difficulty: 'Medium', description: 'Fortalece o core e mobilidade' },
];

export default function ExploreScreen() {
  const { token, userId } = useUser();
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [workouts, setWorkouts] = useState<Workout[]>(FALLBACK_WORKOUTS);
  const [modalVisible, setModalVisible] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customDuration, setCustomDuration] = useState('20');
  const [customNotes, setCustomNotes] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!token) return; // avoid trying if not logged
      setLoading(true);
      try {
        const resp = await fetch('https://mindfitapi.outis.com.br/workouts', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resp.ok) {
          // fallback silently
          setLoading(false);
          return;
        }
        const data = await resp.json();
        const items = Array.isArray(data) ? data : data.content || [];
        if (items && items.length > 0) {
          // map to Workout shape conservatively
          const parsed: Workout[] = items.map((it: any) => ({
            id: it.id ?? it._id,
            name: it.name || it.title || 'Treino',
            durationMinutes: it.durationMinutes ?? it.duration ?? 20,
            difficulty: it.difficulty || 'Medium',
            description: it.description || it.summary || '',
          }));
          setWorkouts(parsed);
        }
      } catch (err) {
        console.log('Failed to load workouts', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const startWorkout = async (w: Workout) => {
    if (!token || !userId) {
      showMessage({ message: 'Usuário não autenticado.', type: 'danger' });
      return;
    }
    setStarting(true);
    try {
      const payload = { workoutId: w.id, name: w.name } as any;
      const resp = await fetch(`https://mindfitapi.outis.com.br/users/${userId}/workouts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const text = await resp.text();
        console.log('startWorkout failed', resp.status, text);
        showMessage({ message: 'Não foi possível iniciar o treino.', type: 'danger' });
        return;
      }
      showMessage({ message: `Treino '${w.name}' iniciado!`, type: 'success' });
    } catch (err) {
      console.log('Error starting workout', err);
      showMessage({ message: 'Erro ao iniciar treino.', type: 'danger' });
    } finally {
      setStarting(false);
    }
  };

  const createCustomWorkout = async () => {
    if (!customName.trim()) {
      showMessage({ message: 'Informe um nome para o treino.', type: 'danger' });
      return;
    }
    if (!token || !userId) {
      showMessage({ message: 'Usuário não autenticado.', type: 'danger' });
      return;
    }
    setStarting(true);
    try {
      const payload = {
        name: customName.trim(),
        durationMinutes: parseInt(customDuration, 10) || 20,
        description: customNotes || undefined,
      };
      const resp = await fetch(`https://mindfitapi.outis.com.br/users/${userId}/workouts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const text = await resp.text();
        console.log('createCustomWorkout failed', resp.status, text);
        showMessage({ message: 'Erro ao criar treino personalizado.', type: 'danger' });
        return;
      }
      showMessage({ message: 'Treino personalizado criado e iniciado!', type: 'success' });
      setModalVisible(false);
      setCustomName('');
      setCustomDuration('20');
      setCustomNotes('');
    } catch (err) {
      console.log('Error creating custom workout', err);
      showMessage({ message: 'Erro ao criar treino.', type: 'danger' });
    } finally {
      setStarting(false);
    }
  };

  const renderWorkout = ({ item }: { item: Workout }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons name="dumbbell" size={22} color="#0ea5e9" />
        <Text style={styles.cardTitle}>{item.name}</Text>
      </View>
      <Text style={styles.cardSubtitle}>{item.description || `${item.durationMinutes ?? 20} min • ${item.difficulty}`}</Text>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.startBtn} onPress={() => startWorkout(item)} disabled={starting}>
          {starting ? <ActivityIndicator color="#fff" /> : <Text style={styles.startBtnText}>Iniciar</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Treinos</Text>
        <TouchableOpacity style={styles.customBtn} onPress={() => setModalVisible(true)}>
          <MaterialCommunityIcons name="plus" size={20} color="#fff" />
          <Text style={styles.customBtnText}>Treino personalizado</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={workouts}
          keyExtractor={(w, i) => String(w.id ?? i)}
          renderItem={renderWorkout}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Treino personalizado</Text>
            <TextInput placeholder="Nome do treino" value={customName} onChangeText={setCustomName} style={styles.input} />
            <TextInput placeholder="Duração (min)" value={customDuration} onChangeText={setCustomDuration} keyboardType="numeric" style={styles.input} />
            <TextInput placeholder="Notas (opcional)" value={customNotes} onChangeText={setCustomNotes} style={[styles.input, { height: 80 }]} multiline />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={createCustomWorkout} disabled={starting}>
                {starting ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Criar e Iniciar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: '#1e293b' },
  customBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0ea5e9', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12 },
  customBtnText: { color: '#fff', fontWeight: '700', marginLeft: 8 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: '#f1f5f9' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardTitle: { marginLeft: 8, fontSize: 16, fontWeight: '800', color: '#0f172a' },
  cardSubtitle: { color: '#64748b', marginBottom: 12 },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  startBtn: { backgroundColor: '#0ea5e9', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12 },
  startBtnText: { color: '#fff', fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(2,6,23,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '92%', backgroundColor: '#fff', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#f1f5f9' },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12, color: '#0f172a' },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, marginBottom: 12, backgroundColor: '#fff' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: '#f1f5f9', marginRight: 8 },
  cancelBtnText: { color: '#475569', fontWeight: '700' },
  saveBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: '#0ea5e9' },
  saveBtnText: { color: '#fff', fontWeight: '700' },
});