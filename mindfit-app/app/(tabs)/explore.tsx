import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState, useCallback } from 'react';
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
  caloriesBurnt?: number;
  caloriesEstimated?: boolean;
  difficulty?: string;
  description?: string;
  timestamp?: string;
  exercises?: {
    id?: string | number;
    name: string;
    sets?: number;
    reps?: number | string;
    durationSeconds?: number;
    notes?: string;
  }[];
};

function estimateCalories(durationMinutes: number, difficulty?: string, weight?: number | null) {
  const w = weight ?? 70;
  const durationHours = Math.max(0.01, durationMinutes / 60);
  let met = 5; // default moderate
  if (difficulty) {
    const d = difficulty.toLowerCase();
    if (d.includes('easy')) met = 4;
    else if (d.includes('hard')) met = 8;
    else if (d.includes('medium')) met = 6;
  }
  // calories = MET * weight(kg) * hours
  return met * w * durationHours;
}

const FALLBACK_WORKOUTS: Workout[] = [
  {
    id: 'w1',
    name: 'Full Body Express',
    durationMinutes: 20,
    difficulty: 'Easy',
    caloriesBurnt: 180,
    description: 'Treino rápido para todo corpo, foco em força e condicionamento.',
    exercises: [
      { id: 'e1', name: 'Agachamento livre', sets: 3, reps: 12 },
      { id: 'e2', name: 'Flexão de braço', sets: 3, reps: 10 },
      { id: 'e3', name: 'Prancha', durationSeconds: 45 },
    ],
  },
  {
    id: 'w2',
    name: 'HIIT Intenso',
    durationMinutes: 30,
    difficulty: 'Hard',
    caloriesBurnt: 350,
    description: 'Intervalos de alta intensidade para queima de gordura.',
    exercises: [
      { id: 'e4', name: 'Sprints (30s)', durationSeconds: 30, reps: '6 rounds' },
      { id: 'e5', name: 'Burpees', sets: 4, reps: 12 },
      { id: 'e6', name: 'Mountain Climbers', sets: 4, durationSeconds: 40 },
    ],
  },
  {
    id: 'w3',
    name: 'Core & Mobility',
    durationMinutes: 25,
    difficulty: 'Medium',
    caloriesBurnt: 160,
    description: 'Fortalece o core e melhora mobilidade articular.',
    exercises: [
      { id: 'e7', name: 'Russian Twist', sets: 3, reps: 20 },
      { id: 'e8', name: 'Alongamento do quadril', durationSeconds: 60 },
      { id: 'e9', name: 'Superman', sets: 3, reps: 12 },
    ],
  },
];

const PRESET_MOVEMENTS: string[] = ['Abdominais', 'Prancha', 'Polia', 'Rosca', 'Agachamento', 'Flexão'];

export default function ExploreScreen() {
  const { token, userId } = useUser();
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [recommendedWorkouts, setRecommendedWorkouts] = useState<Workout[]>([...FALLBACK_WORKOUTS]);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [customName, setCustomName] = useState('');
  const [customDuration, setCustomDuration] = useState('20');
  const [customNotes, setCustomNotes] = useState('');
  const [customExercises, setCustomExercises] = useState<any[]>([]);
  const [exName, setExName] = useState('');
  const [exSets, setExSets] = useState('');
  const [exReps, setExReps] = useState('');
  const [exDuration, setExDuration] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [weightKg, setWeightKg] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyWorkouts, setHistoryWorkouts] = useState<Workout[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Confirmation dialog state for history deletions
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [workoutToDelete, setWorkoutToDelete] = useState<Workout | null>(null);
  const [deleting, setDeleting] = useState(false);

  const normalizeWorkout = useCallback((it: any): Workout => {
    const duration = it.durationInMinutes ?? it.duration ?? 20;
    const difficulty = it.difficulty ?? it.level ?? undefined;
    const caloriesFromApi = typeof it.caloriesBurnt === 'number' ? it.caloriesBurnt : undefined;
    const exercises = Array.isArray(it.exercises) ? it.exercises : Array.isArray(it.items) ? it.items : undefined;
    const calories = caloriesFromApi ?? estimateCalories(duration, difficulty, weightKg);
    const caloriesEstimated = typeof caloriesFromApi === 'number' ? false : true;
    return {
      id: it.id ?? it._id,
      name: it.name ?? it.title ?? 'Treino',
      durationMinutes: duration,
      caloriesBurnt: calories,
      caloriesEstimated,
      difficulty,
      description: it.description ?? it.summary ?? undefined,
      timestamp: it.timestamp,
      exercises,
    };
  }, [weightKg]);

  const loadHistory = useCallback(async () => {
    if (!token || !userId) return;
    setLoadingHistory(true);
    try {
      // Load all workout history with larger page size
      const pageable = encodeURIComponent(JSON.stringify({ page: 0, size: 100 }));
      const resp = await fetch(`https://mindfitapi.outis.com.br/users/${userId}/exercises?pageable=${pageable}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) {
        setHistoryWorkouts([]);
        return;
      }
      const data = await resp.json();
      const items = Array.isArray(data) ? data : data.content || [];
      const parsed: Workout[] = items.map((it: any) => normalizeWorkout(it));
      setHistoryWorkouts(parsed);
    } catch (err) {
      console.log('Failed to load workout history', err);
      setHistoryWorkouts([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [token, userId, normalizeWorkout]);

  const handleDeleteHistory = (w: Workout) => {
    setWorkoutToDelete(w);
    setConfirmDeleteVisible(true);
  };

  const confirmDeleteHistory = async () => {
    if (!workoutToDelete || !token || !userId) return;
    
    const w = workoutToDelete;
    setDeleting(true);

    const workoutId = w.id;
    if (!workoutId) {
      showMessage({ message: 'ID do treino não encontrado.', type: 'danger' });
      setDeleting(false);
      return;
    }

    try {
      const url = `https://mindfitapi.outis.com.br/users/${userId}/exercises/${encodeURIComponent(String(workoutId))}`;
      const resp = await fetch(url, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });

      if (resp.status === 204 || resp.ok) {
        // Remove from history list optimistically
        setHistoryWorkouts((prev) => prev.filter((it) => String(it.id) !== String(w.id)));
        showMessage({ message: 'Treino removido do histórico.', type: 'success' });
        // Also remove from main workouts list if present
        setWorkouts((prev) => prev.filter((it) => String(it.id) !== String(w.id)));
        setConfirmDeleteVisible(false);
        setWorkoutToDelete(null);
        return;
      }

      if (resp.status === 404) {
        showMessage({ message: 'Treino não encontrado no servidor.', type: 'danger' });
        await loadHistory();
        setConfirmDeleteVisible(false);
        setWorkoutToDelete(null);
        return;
      }

      if (resp.status === 401 || resp.status === 403) {
        showMessage({ message: 'Você não tem permissão para remover este treino.', type: 'danger' });
        setConfirmDeleteVisible(false);
        setWorkoutToDelete(null);
        return;
      }

      const txt = await resp.text();
      console.log('Failed to delete workout', resp.status, txt, { url });
      showMessage({ message: 'Erro ao remover treino.', type: 'danger' });
    } catch (err) {
      console.log('Error deleting workout', err);
      showMessage({ message: 'Erro ao remover treino.', type: 'danger' });
    } finally {
      setDeleting(false);
    }
  };

  const cancelDeleteHistory = () => {
    setConfirmDeleteVisible(false);
    setWorkoutToDelete(null);
    setDeleting(false);
  };

  useEffect(() => {
    const load = async () => {
      if (!token || !userId) return; // avoid trying if not logged
      setLoading(true);
      try {
        // try to fetch latest measurement to estimate calories
        try {
          const mPage = encodeURIComponent(JSON.stringify({ page: 0, size: 1 }));
          const mResp = await fetch(`https://mindfitapi.outis.com.br/users/${userId}/measurements?pageable=${mPage}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (mResp.ok) {
            const mData = await mResp.json();
            const mItems = mData.content || [];
            if (mItems && mItems.length > 0 && typeof mItems[0].weightInKG === 'number') {
              setWeightKg(mItems[0].weightInKG);
            }
          }
        } catch {
          // ignore measurement fetch errors
        }
        // API expects pageable param; request first page
        const pageable = encodeURIComponent(JSON.stringify({ page: 0, size: 20 }));
        const resp = await fetch(`https://mindfitapi.outis.com.br/users/${userId}/exercises?pageable=${pageable}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resp.ok) {
          // API failed — keep recommended in state and leave main list empty
          setWorkouts([]);
          setLoading(false);
          return;
        }
        const data = await resp.json();
        // response is a paged model: { content: [...] }
        const items = Array.isArray(data) ? data : data.content || [];
        if (items && items.length > 0) {
          const parsed: Workout[] = items.map((it: any) => normalizeWorkout(it));
          setWorkouts(parsed);
          // if user has workouts, hide recommended
          setRecommendedWorkouts([]);
        } else {
          // no user workouts — leave recommendedWorkouts intact and clear main list
          setWorkouts([]);
        }
      } catch (err) {
        console.log('Failed to load workouts', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, userId, normalizeWorkout]);

  const startWorkout = async (w: Workout) => {
    if (!token || !userId) {
      showMessage({ message: 'Usuário não autenticado.', type: 'danger' });
      return;
    }
    setStarting(true);
    try {
      const payload: any = {
        name: w.name,
        timestamp: new Date().toISOString(),
      };
      if (w.durationMinutes) payload.durationInMinutes = w.durationMinutes;
      if (w.description) payload.description = w.description;
      // include calories if available or estimate from duration/weight
      try {
        const cal = typeof w.caloriesBurnt === 'number' ? w.caloriesBurnt : estimateCalories(w.durationMinutes ?? 20, w.difficulty, weightKg);
        if (typeof cal === 'number' && !Number.isNaN(cal)) payload.caloriesBurnt = Math.round(cal);
      } catch {
        // ignore
      }

      const resp = await fetch(`https://mindfitapi.outis.com.br/users/${userId}/exercises`, {
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
      const respJson = await resp.json().catch(() => null);
      const calories = respJson?.caloriesBurnt ?? w.caloriesBurnt ?? estimateCalories(w.durationMinutes ?? 20, w.difficulty, weightKg);
      showMessage({ message: `Treino '${w.name}' iniciado! (${Math.round(calories)} kcal)`, type: 'success' });
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
      const payload: any = {
        name: customName.trim(),
        timestamp: new Date().toISOString(),
        durationInMinutes: parseInt(customDuration, 10) || 20,
      };
      if (customNotes) payload.description = customNotes;
      if (customExercises && customExercises.length > 0) {
        payload.exercises = customExercises.map((ex) => ({
          name: ex.name,
          sets: typeof ex.sets === 'number' ? ex.sets : undefined,
          reps: ex.reps,
          durationSeconds: typeof ex.durationSeconds === 'number' ? ex.durationSeconds : undefined,
          notes: ex.notes,
        }));
      }

      // estimate calories for the custom workout and include it in payload
      try {
        const est = payload.durationInMinutes ? estimateCalories(payload.durationInMinutes, undefined, weightKg) : undefined;
        if (typeof est === 'number' && !Number.isNaN(est)) payload.caloriesBurnt = Math.round(est);
      } catch {
        // ignore
      }

      let resp;
      if (isEditing && editingId) {
        resp = await fetch(`https://mindfitapi.outis.com.br/users/${userId}/exercises/${editingId}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        resp = await fetch(`https://mindfitapi.outis.com.br/users/${userId}/exercises`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      if (!resp.ok) {
        const text = await resp.text();
        console.log('createCustomWorkout failed', resp.status, text);
        showMessage({ message: 'Erro ao criar treino personalizado.', type: 'danger' });
        return;
      }
      const respJson = await resp.json().catch(() => null);
      const createdDuration = payload.durationInMinutes;
      const createdCalories = respJson?.caloriesBurnt ?? (createdDuration ? estimateCalories(createdDuration, undefined, weightKg) : undefined);
      showMessage({ message: `Treino personalizado criado e iniciado! (${createdCalories ? Math.round(createdCalories) + ' kcal' : ''})`, type: 'success' });
      const createdWorkout = normalizeWorkout({
        id: respJson?.id ?? respJson?._id ?? editingId,
        name: respJson?.name ?? payload.name,
        durationInMinutes: createdDuration,
        caloriesBurnt: respJson?.caloriesBurnt ?? createdCalories,
        caloriesEstimated: typeof respJson?.caloriesBurnt === 'number' ? false : !!createdCalories,
        description: respJson?.description ?? payload.description,
        exercises: Array.isArray(respJson?.exercises) ? respJson.exercises : (Array.isArray(payload.exercises) ? payload.exercises : undefined),
      });
      setWorkouts((prev) => {
        if (isEditing && editingId) {
          return (prev || []).map((w) => (String(w.id) === String(editingId) ? createdWorkout : w));
        }
        return [createdWorkout, ...(prev || [])];
      });
      setIsEditing(false);
      setEditingId(null);
      setCustomExercises([]);
      setExName(''); setExSets(''); setExReps(''); setExDuration('');
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

  const openEdit = (w: Workout) => {
    setIsEditing(true);
    setEditingId(w.id ?? null);
    setCustomName(w.name ?? '');
    setCustomDuration(String(w.durationMinutes ?? 20));
    setCustomNotes(w.description ?? '');
    setCustomExercises(w.exercises ? w.exercises.map((ex: any) => ({ ...ex })) : []);
    setModalVisible(true);
  };

  const handleUseRecommended = (w: Workout) => {
    (async () => {
      if (!token || !userId) {
        setWorkouts((prev) => [w, ...(prev || [])]);
        setRecommendedWorkouts((prev) => prev.filter((r) => String(r.id) !== String(w.id)));
        return;
      }
      try {
        const payload: any = {
          name: w.name,
          timestamp: new Date().toISOString(),
          durationInMinutes: w.durationMinutes,
          description: w.description,
        };
        // include calories for recommended workout (use provided or estimate)
        try {
          const cal = typeof w.caloriesBurnt === 'number' ? w.caloriesBurnt : (w.durationMinutes ? estimateCalories(w.durationMinutes, w.difficulty, weightKg) : undefined);
          if (typeof cal === 'number' && !Number.isNaN(cal)) payload.caloriesBurnt = Math.round(cal);
        } catch {
          // ignore
        }
        if (w.exercises && w.exercises.length > 0) payload.exercises = w.exercises;
        const resp = await fetch(`https://mindfitapi.outis.com.br/users/${userId}/exercises`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const respJson = resp.ok ? await resp.json().catch(() => null) : null;
        const created = normalizeWorkout(respJson ?? { ...payload, id: w.id });
        setWorkouts((prev) => [created, ...(prev || [])]);
        setRecommendedWorkouts((prev) => prev.filter((r) => String(r.id) !== String(w.id)));
      } catch {
        setWorkouts((prev) => [w, ...(prev || [])]);
        setRecommendedWorkouts((prev) => prev.filter((r) => String(r.id) !== String(w.id)));
      }
    })();
  };

  const renderWorkout = ({ item }: { item: Workout }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons name="dumbbell" size={24} color="#0ea5e9" />
        <TouchableOpacity onPress={() => { setSelectedWorkout(item); setDetailsModalVisible(true); }}>
          <Text style={styles.cardTitle}>{item.name}</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.cardSubtitle}>{item.description}</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 12, gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialCommunityIcons name="clock-outline" size={16} color="#64748b" />
          <Text style={{ color: '#64748b', marginLeft: 6, fontWeight: '600' }}>{item.durationMinutes ?? 20} min</Text>
        </View>
        {typeof item.caloriesBurnt === 'number' && (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialCommunityIcons name="fire" size={16} color="#f59e0b" />
            <Text style={{ color: '#64748b', marginLeft: 6, fontWeight: '600' }}>
              {item.caloriesEstimated ? `est. ${Math.round(item.caloriesBurnt)} kcal` : `${Math.round(item.caloriesBurnt)} kcal`}
            </Text>
          </View>
        )}
      </View>
      {item.exercises && item.exercises.length > 0 && (
        <View style={{ marginBottom: 8 }}>
          {item.exercises.map((ex) => (
            <View key={String(ex.id ?? ex.name)} style={styles.exerciseRow}>
              <Text style={styles.exerciseName}>{ex.name}</Text>
              <Text style={styles.exerciseMeta}>
                {ex.sets ? `${ex.sets}x${ex.reps ?? ''}` : ''}
                {ex.durationSeconds ? `${ex.sets ? ' • ' : ''}${Math.round((ex.durationSeconds ?? 0) / 60)}m` : ''}
              </Text>
            </View>
          ))}
        </View>
      )}
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.startBtn} onPress={() => startWorkout(item)} disabled={starting}>
          {starting ? <ActivityIndicator color="#fff" /> : <Text style={styles.startBtnText}>Iniciar</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );

  const closeDetails = () => {
    setDetailsModalVisible(false);
    setSelectedWorkout(null);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Treinos</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity 
            style={[styles.customBtn, { backgroundColor: showHistory ? '#475569' : '#64748b' }]} 
            onPress={() => {
              setShowHistory(!showHistory);
              if (!showHistory) {
                loadHistory();
              }
            }}
          >
            <MaterialCommunityIcons name="history" size={20} color="#fff" />
            <Text style={styles.customBtnText}>Histórico</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.customBtn} onPress={() => { setIsEditing(false); setModalVisible(true); }}>
            <MaterialCommunityIcons name="plus" size={20} color="#fff" />
            <Text style={styles.customBtnText}>Personalizado</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showHistory ? (
        // History View
        <View style={{ flex: 1 }}>
          <Text style={{ 
            fontWeight: '900', 
            marginBottom: 16,
            fontSize: 18,
            color: '#0f172a',
            letterSpacing: -0.25,
          }}>
            Histórico de Treinos
          </Text>
          
          {loadingHistory ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#0ea5e9" />
              <Text style={{ 
                color: '#64748b', 
                marginTop: 16, 
                fontSize: 16,
                fontWeight: '600',
              }}>
                Carregando histórico...
              </Text>
            </View>
          ) : (
            <FlatList
              data={historyWorkouts}
              keyExtractor={(w, i) => String(w.id ?? i)}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <MaterialCommunityIcons name="dumbbell" size={24} color="#0ea5e9" />
                    <TouchableOpacity onPress={() => { setSelectedWorkout(item); setDetailsModalVisible(true); }}>
                      <Text style={styles.cardTitle}>{item.name}</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.cardSubtitle}>{item.description}</Text>
                  {item.timestamp && (
                    <Text style={{ color: '#64748b', fontSize: 12, marginBottom: 8, fontWeight: '600' }}>
                      {new Date(item.timestamp).toLocaleString()}
                    </Text>
                  )}
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 12, gap: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <MaterialCommunityIcons name="clock-outline" size={16} color="#64748b" />
                      <Text style={{ color: '#64748b', marginLeft: 6, fontWeight: '600' }}>{item.durationMinutes ?? 20} min</Text>
                    </View>
                    {typeof item.caloriesBurnt === 'number' && (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <MaterialCommunityIcons name="fire" size={16} color="#f59e0b" />
                        <Text style={{ color: '#64748b', marginLeft: 6, fontWeight: '600' }}>
                          {item.caloriesEstimated ? `est. ${Math.round(item.caloriesBurnt)} kcal` : `${Math.round(item.caloriesBurnt)} kcal`}
                        </Text>
                      </View>
                    )}
                  </View>
                  {item.exercises && item.exercises.length > 0 && (
                    <View style={{ marginBottom: 8 }}>
                      {item.exercises.map((ex) => (
                        <View key={String(ex.id ?? ex.name)} style={styles.exerciseRow}>
                          <Text style={styles.exerciseName}>{ex.name}</Text>
                          <Text style={styles.exerciseMeta}>
                            {ex.sets ? `${ex.sets}x${ex.reps ?? ''}` : ''}
                            {ex.durationSeconds ? `${ex.sets ? ' • ' : ''}${Math.round((ex.durationSeconds ?? 0) / 60)}m` : ''}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                  <View style={styles.cardActions}>
                    <TouchableOpacity 
                      style={[styles.startBtn, { backgroundColor: '#64748b', marginRight: 12 }]} 
                      onPress={() => openEdit(item)}
                    >
                      <MaterialCommunityIcons name="pencil" size={16} color="#fff" style={{ marginRight: 6 }} />
                      <Text style={styles.startBtnText}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.startBtn, { backgroundColor: '#ef4444' }]} 
                      onPress={() => handleDeleteHistory(item)}
                    >
                      <MaterialCommunityIcons name="delete" size={16} color="#fff" style={{ marginRight: 6 }} />
                      <Text style={styles.startBtnText}>Excluir</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              contentContainerStyle={{ paddingBottom: 40 }}
              ListEmptyComponent={
                <View style={{ alignItems: 'center', paddingTop: 60 }}>
                  <MaterialCommunityIcons name="history" size={80} color="#cbd5e1" />
                  <Text style={{ 
                    color: '#64748b', 
                    marginTop: 20, 
                    textAlign: 'center',
                    fontSize: 18,
                    fontWeight: '700',
                  }}>
                    Nenhum treino no histórico
                  </Text>
                  <Text style={{ 
                    color: '#94a3b8', 
                    marginTop: 8, 
                    textAlign: 'center',
                    fontSize: 15,
                    fontWeight: '500',
                    maxWidth: 280,
                    lineHeight: 22,
                  }}>
                    Seus treinos realizados aparecerão aqui
                  </Text>
                </View>
              }
            />
          )}
        </View>
      ) : (
        // Main workouts view
        <>
          {workouts.length === 0 && recommendedWorkouts.length > 0 && (
        <View style={{ marginBottom: 20 }}>
          <Text style={{ 
            fontWeight: '900', 
            marginBottom: 16,
            fontSize: 18,
            color: '#0f172a',
            letterSpacing: -0.25,
          }}>
            Treinos Recomendados
          </Text>
          <FlatList
            data={recommendedWorkouts}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(w) => String(w.id)}
            renderItem={({ item }) => (
              <View style={{ width: 240, marginRight: 16 }}>
                <View style={[styles.card, { marginBottom: 0 }]}> 
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[styles.cardTitle, { marginLeft: 0, fontSize: 16 }]}>{item.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <TouchableOpacity 
                        onPress={() => handleUseRecommended(item)} 
                        style={{ 
                          backgroundColor: '#f0f9ff',
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: '#0ea5e9',
                        }}
                      >
                        <Text style={{ color: '#0ea5e9', fontWeight: '800', fontSize: 12 }}>Usar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => openEdit(item)}
                        style={{
                          padding: 8,
                          backgroundColor: '#f8fafc',
                          borderRadius: 10,
                          borderWidth: 1,
                          borderColor: '#e2e8f0',
                        }}
                      >
                        <MaterialCommunityIcons name="pencil" size={16} color="#475569" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={[styles.cardSubtitle, { marginTop: 8 }]}>{item.description}</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center' }}>
                    <MaterialCommunityIcons name="clock-outline" size={14} color="#64748b" />
                    <Text style={{ color: '#64748b', marginLeft: 4, fontWeight: '600' }}>{item.durationMinutes} min</Text>
                  </View>
                </View>
              </View>
            )}
          />
        </View>
      )}

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 }}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={{ 
            color: '#64748b', 
            marginTop: 16, 
            fontSize: 16,
            fontWeight: '600',
          }}>
            Carregando treinos...
          </Text>
        </View>
      ) : (
        <FlatList
          data={workouts}
          keyExtractor={(w, i) => String(w.id ?? i)}
          renderItem={renderWorkout}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={
            workouts.length === 0 && recommendedWorkouts.length === 0 ? (
              <View style={{ alignItems: 'center', paddingTop: 60 }}>
                <MaterialCommunityIcons name="dumbbell" size={80} color="#cbd5e1" />
                <Text style={{ 
                  color: '#64748b', 
                  marginTop: 20, 
                  textAlign: 'center',
                  fontSize: 18,
                  fontWeight: '700',
                }}>
                  Nenhum treino encontrado
                </Text>
                <Text style={{ 
                  color: '#94a3b8', 
                  marginTop: 8, 
                  textAlign: 'center',
                  fontSize: 15,
                  fontWeight: '500',
                  maxWidth: 280,
                  lineHeight: 22,
                }}>
                  Crie seu primeiro treino personalizado para começar
                </Text>
              </View>
            ) : null
          }
          />
        )}
        </>
      )}      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Treino personalizado</Text>
            <TextInput 
              placeholder="Nome do treino" 
              value={customName} 
              onChangeText={setCustomName} 
              style={styles.input}
              placeholderTextColor="#94a3b8"
            />
            <TextInput 
              placeholder="Duração (min)" 
              value={customDuration} 
              onChangeText={setCustomDuration} 
              keyboardType="numeric" 
              style={styles.input}
              placeholderTextColor="#94a3b8"
            />
            <TextInput 
              placeholder="Notas ou descrição (opcional)" 
              value={customNotes} 
              onChangeText={setCustomNotes} 
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]} 
              multiline
              placeholderTextColor="#94a3b8"
            />

            <View style={{ marginBottom: 12 }}>
              <Text style={{ 
                fontWeight: '800', 
                marginBottom: 12,
                fontSize: 14,
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}>
                Exercícios do treino
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
                {PRESET_MOVEMENTS.map((m: string) => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => { setExName(m); setExSets('3'); setExReps('12'); setExDuration(''); }}
                    style={{ 
                      backgroundColor: '#f0f9ff', 
                      paddingVertical: 8, 
                      paddingHorizontal: 14, 
                      borderRadius: 16, 
                      marginRight: 10, 
                      marginBottom: 10,
                      borderWidth: 1,
                      borderColor: '#bae6fd',
                      shadowColor: '#0ea5e9',
                      shadowOpacity: 0.1,
                      shadowOffset: { width: 0, height: 2 },
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  >
                    <Text style={{ 
                      color: '#0ea5e9', 
                      fontWeight: '800',
                      fontSize: 12,
                      letterSpacing: 0.25,
                    }}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ flexDirection: 'row', marginBottom: 12, gap: 12 }}>
                <TextInput 
                  placeholder="Nome do exercício" 
                  value={exName} 
                  onChangeText={setExName} 
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  placeholderTextColor="#94a3b8"
                />
                <TextInput 
                  placeholder="Sets" 
                  value={exSets} 
                  onChangeText={setExSets} 
                  keyboardType="numeric" 
                  style={[styles.input, { width: 80, marginBottom: 0 }]}
                  placeholderTextColor="#94a3b8"
                />
              </View>
              <View style={{ flexDirection: 'row', marginBottom: 16, gap: 12 }}>
                <TextInput 
                  placeholder="Reps (ex: 12)" 
                  value={exReps} 
                  onChangeText={setExReps} 
                  keyboardType="default" 
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  placeholderTextColor="#94a3b8"
                />
                <TextInput 
                  placeholder="Duração (s)" 
                  value={exDuration} 
                  onChangeText={setExDuration} 
                  keyboardType="numeric" 
                  style={[styles.input, { width: 120, marginBottom: 0 }]}
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 16 }}>
                <TouchableOpacity
                  style={[styles.saveBtn, { paddingHorizontal: 16 }]}
                  onPress={() => {
                    if (!exName.trim()) return;
                    const ex = {
                      id: `local-${Date.now()}`,
                      name: exName.trim(),
                      sets: exSets ? parseInt(exSets, 10) : undefined,
                      reps: exReps || undefined,
                      durationSeconds: exDuration ? parseInt(exDuration, 10) : undefined,
                      notes: undefined,
                    };
                    setCustomExercises((s) => [...s, ex]);
                    setExName(''); setExSets(''); setExReps(''); setExDuration('');
                  }}
                >
                  <MaterialCommunityIcons name="plus" size={16} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.saveBtnText}>Adicionar</Text>
                </TouchableOpacity>
              </View>

              {customExercises && customExercises.length > 0 && (
                <View style={{ 
                  maxHeight: 120,
                  backgroundColor: '#f8fafc',
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 16,
                }}>
                  {customExercises.map((ex, idx) => (
                    <View key={String(ex.id ?? idx)} style={{ 
                      flexDirection: 'row', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      paddingVertical: 8,
                      borderBottomWidth: idx < customExercises.length - 1 ? 1 : 0,
                      borderBottomColor: '#e2e8f0',
                    }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: '800', color: '#0f172a', fontSize: 14 }}>{ex.name}</Text>
                        <Text style={{ color: '#64748b', fontSize: 12, marginTop: 2, fontWeight: '600' }}>
                          {ex.sets ? `${ex.sets}x${ex.reps ?? ''}` : (ex.durationSeconds ? `${Math.round(ex.durationSeconds/60)}m` : '')}
                        </Text>
                      </View>
                      <TouchableOpacity 
                        style={[styles.cancelBtn, { paddingVertical: 6, paddingHorizontal: 12 }]} 
                        onPress={() => setCustomExercises((s) => s.filter((_, i) => i !== idx))}
                      >
                        <Text style={[styles.cancelBtnText, { fontSize: 12 }]}>Remover</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

            </View>

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

      <Modal visible={detailsModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.modalTitle}>{selectedWorkout?.name}</Text>
              <TouchableOpacity onPress={closeDetails} style={{ padding: 6 }}>
                <MaterialCommunityIcons name="close" size={20} color="#475569" />
              </TouchableOpacity>
            </View>
            <Text style={{ color: '#64748b', marginBottom: 12 }}>{selectedWorkout?.description}</Text>
            <View style={{ flexDirection: 'row', marginBottom: 12 }}>
              <Text style={{ color: '#334155', marginRight: 16 }}>{selectedWorkout?.durationMinutes ?? 20} min</Text>
              {selectedWorkout?.caloriesBurnt ? (
                <Text style={{ color: '#334155' }}>
                  {selectedWorkout?.caloriesEstimated ? `est. ${Math.round(selectedWorkout?.caloriesBurnt ?? 0)} kcal` : `${Math.round(selectedWorkout?.caloriesBurnt ?? 0)} kcal`}
                </Text>
              ) : null}
            </View>
            {selectedWorkout?.exercises && selectedWorkout.exercises.length > 0 ? (
              <View>
                {selectedWorkout.exercises.map((ex) => (
                  <View key={String(ex.id ?? ex.name)} style={styles.exerciseRow}>
                    <Text style={styles.exerciseName}>{ex.name}</Text>
                    <Text style={styles.exerciseMeta}>{ex.sets ? `${ex.sets}x${ex.reps ?? ''}` : ''}{ex.durationSeconds ? `${ex.sets ? ' • ' : ''}${Math.round((ex.durationSeconds ?? 0) / 60)}m` : ''}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={{ color: '#64748b' }}>Sem exercícios detalhados.</Text>
            )}
            <View style={{ marginTop: 16, flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeDetails}>
                <Text style={styles.cancelBtnText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom confirmation dialog for history deletions */}
      <Modal visible={confirmDeleteVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmIconContainer}>
              <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#ef4444" />
            </View>
            
            <Text style={styles.confirmTitle}>Remover Treino?</Text>
            
            {workoutToDelete && (
              <View style={styles.workoutPreview}>
                <Text style={styles.workoutPreviewTitle}>{workoutToDelete.name}</Text>
                <View style={styles.workoutPreviewDetails}>
                  <View style={styles.workoutDetailItem}>
                    <MaterialCommunityIcons name="clock-outline" size={16} color="#64748b" />
                    <Text style={styles.workoutDetailText}>{workoutToDelete.durationMinutes ?? 20} min</Text>
                  </View>
                  {typeof workoutToDelete.caloriesBurnt === 'number' && (
                    <View style={styles.workoutDetailItem}>
                      <MaterialCommunityIcons name="fire" size={16} color="#f59e0b" />
                      <Text style={styles.workoutDetailText}>
                        {workoutToDelete.caloriesEstimated ? `est. ${Math.round(workoutToDelete.caloriesBurnt)} kcal` : `${Math.round(workoutToDelete.caloriesBurnt)} kcal`}
                      </Text>
                    </View>
                  )}
                  {workoutToDelete.timestamp && (
                    <View style={styles.workoutDetailItem}>
                      <MaterialCommunityIcons name="calendar" size={16} color="#64748b" />
                      <Text style={styles.workoutDetailText}>{new Date(workoutToDelete.timestamp).toLocaleDateString()}</Text>
                    </View>
                  )}
                </View>
                {workoutToDelete.description && (
                  <Text style={styles.workoutPreviewDescription}>{workoutToDelete.description}</Text>
                )}
              </View>
            )}
            
            <Text style={styles.confirmMessage}>
              Esta ação não pode ser desfeita. O treino será removido permanentemente do seu histórico.
            </Text>
            
            <View style={styles.confirmActions}>
              <TouchableOpacity 
                style={styles.confirmCancelBtn}
                onPress={cancelDeleteHistory}
                activeOpacity={0.7}
                disabled={deleting}
              >
                <Text style={styles.confirmCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmDeleteBtn, deleting && { opacity: 0.7 }]}
                onPress={confirmDeleteHistory}
                activeOpacity={0.8}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="delete" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={styles.confirmDeleteText}>Remover</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f1f5f9', padding: 20 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 24,
    paddingBottom: 8,
  },
  title: { 
    fontSize: 26, 
    fontWeight: '900', 
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  customBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#0ea5e9', 
    paddingVertical: 12, 
    paddingHorizontal: 18, 
    borderRadius: 16,
    shadowColor: '#0ea5e9',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  customBtnText: { 
    color: '#ffffff', 
    fontWeight: '800', 
    marginLeft: 8,
    fontSize: 14,
    letterSpacing: 0.25,
  },
  card: { 
    backgroundColor: '#ffffff', 
    padding: 20, 
    borderRadius: 20, 
    marginBottom: 16, 
    borderWidth: 1, 
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12,
  },
  cardTitle: { 
    marginLeft: 12, 
    fontSize: 18, 
    fontWeight: '900', 
    color: '#0f172a',
    letterSpacing: -0.25,
  },
  cardSubtitle: { 
    color: '#475569', 
    marginBottom: 16,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  cardActions: { 
    flexDirection: 'row', 
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  startBtn: { 
    backgroundColor: '#0ea5e9', 
    paddingVertical: 12, 
    paddingHorizontal: 20, 
    borderRadius: 14,
    shadowColor: '#0ea5e9',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  startBtnText: { 
    color: '#ffffff', 
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.25,
  },
  exerciseRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: 8, 
    borderBottomWidth: 1, 
    borderColor: '#f1f5f9',
    marginBottom: 4,
  },
  exerciseName: { 
    color: '#0f172a', 
    flex: 1,
    fontWeight: '600',
    fontSize: 14,
  },
  exerciseMeta: { 
    color: '#64748b', 
    marginLeft: 16,
    fontWeight: '600',
    fontSize: 13,
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(15,23,42,0.75)', 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20,
  },
  modalCard: { 
    width: '94%', 
    backgroundColor: '#ffffff', 
    borderRadius: 24, 
    padding: 24, 
    borderWidth: 1, 
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 20 },
    shadowRadius: 40,
    elevation: 20,
    maxHeight: '90%',
  },
  modalTitle: { 
    fontSize: 22, 
    fontWeight: '900', 
    marginBottom: 20, 
    color: '#0f172a',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  input: { 
    borderWidth: 2, 
    borderColor: '#cbd5e1', 
    borderRadius: 14, 
    padding: 16, 
    marginBottom: 16, 
    backgroundColor: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    shadowColor: '#64748b',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  modalActions: { 
    flexDirection: 'row', 
    justifyContent: 'flex-end',
    marginTop: 20,
    gap: 12,
  },
  cancelBtn: { 
    paddingVertical: 12, 
    paddingHorizontal: 18, 
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
  cancelBtnText: { 
    color: '#374151', 
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.25,
  },
  saveBtn: { 
    paddingVertical: 12, 
    paddingHorizontal: 18, 
    borderRadius: 14, 
    backgroundColor: '#0ea5e9',
    shadowColor: '#0ea5e9',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: { 
    color: '#ffffff', 
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.25,
  },
  // Enhanced confirmation dialog styles
  confirmCard: {
    width: '92%',
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 20 },
    shadowRadius: 40,
    elevation: 20,
  },
  confirmIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#fecaca',
  },
  confirmTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  workoutPreview: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  workoutPreviewTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.25,
  },
  workoutPreviewDetails: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 8,
  },
  workoutDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  workoutDetailText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginLeft: 6,
  },
  workoutPreviewDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
    marginTop: 8,
  },
  confirmMessage: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    fontWeight: '500',
    paddingHorizontal: 8,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmCancelBtn: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    shadowColor: '#64748b',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  confirmCancelText: {
    color: '#475569',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.25,
  },
  confirmDeleteBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ef4444',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
  confirmDeleteText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.25,
  },
});