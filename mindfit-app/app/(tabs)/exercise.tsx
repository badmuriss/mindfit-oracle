import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { useUser } from '../../components/UserContext';
import { API_ENDPOINTS } from '../../constants/Api';
import { nowAsLocalTime, formatUTCToLocalDateTime, localTimeAsUTC } from '../../utils/dateUtils';

const { width: screenWidth } = Dimensions.get('window');

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


const PRESET_MOVEMENTS: string[] = ['Abdominais', 'Prancha', 'Polia', 'Rosca', 'Agachamento', 'Flexão'];

export default function ExploreScreen() {
  const { token, userId } = useUser();
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [customName, setCustomName] = useState('');
  const [customDuration, setCustomDuration] = useState('');
  const [customCalories, setCustomCalories] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timestamp, setTimestamp] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [customExercises, setCustomExercises] = useState<any[]>([]);
  const [exName, setExName] = useState('');
  const [exSets, setExSets] = useState('');
  const [exReps, setExReps] = useState('');
  const [exDuration, setExDuration] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [weightKg, setWeightKg] = useState<number | null>(null);
  
  const [historyWorkouts, setHistoryWorkouts] = useState<Workout[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [currentTab, setCurrentTab] = useState<'treinos' | 'history'>('treinos');
  const [currentSection, setCurrentSection] = useState<'my' | 'recommended'>('my');
  const [selectedHistoryDate, setSelectedHistoryDate] = useState(new Date());

  // Recommended workouts state
  const [recommendedWorkouts, setRecommendedWorkouts] = useState<Workout[]>([]);
  const [loadingRecommended, setLoadingRecommended] = useState(false);
  

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

  const loadHistory = useCallback(async (date: Date) => {
    if (!token || !userId) return;
    setLoadingHistory(true);
    try {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      const toYYYYMMDD = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }

      const params = new URLSearchParams({
        startDate: toYYYYMMDD(startDate),
        endDate: toYYYYMMDD(endDate),
        page: '0',
        size: '100',
      });

      const resp = await fetch(`${API_ENDPOINTS.USERS.EXERCISES(userId)}?${params.toString()}`, {
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
    } catch {
      setHistoryWorkouts([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [token, userId, normalizeWorkout]);

  useEffect(() => {
    if (currentTab === 'history') {
      loadHistory(selectedHistoryDate);
    }
  }, [selectedHistoryDate, currentTab, loadHistory]);

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
      const url = API_ENDPOINTS.USERS.EXERCISE_BY_ID(userId, workoutId);
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
        await loadHistory(selectedHistoryDate);
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

      await resp.text();
      showMessage({ message: 'Erro ao remover treino.', type: 'danger' });
    } catch {
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
          const mParams = new URLSearchParams({ page: '0', size: '1' });
          const mResp = await fetch(`${API_ENDPOINTS.USERS.MEASUREMENTS(userId)}?${mParams.toString()}`, {
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
        const params = new URLSearchParams({ page: '0', size: '200' });
        const resp = await fetch(`${API_ENDPOINTS.USERS.EXERCISES(userId)}?${params.toString()}`, {
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
          // Remove duplicates based on workout name
          const uniqueWorkouts = parsed.filter((workout, index, self) => 
            index === self.findIndex(w => w.name.toLowerCase().trim() === workout.name.toLowerCase().trim())
          );
          setWorkouts(uniqueWorkouts);
        } else {
          setWorkouts([]);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, userId, normalizeWorkout]);

  // Load recommended workouts from cache or generate new ones
  const loadRecommendedWorkouts = useCallback(async () => {
    if (!token || !userId) return;

    setLoadingRecommended(true);

    try {
      const response = await fetch(API_ENDPOINTS.USERS.WORKOUT_RECOMMENDATIONS(userId), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After') || '3600';
          const hours = Math.ceil(parseInt(retryAfter) / 3600);
          throw new Error(`RATE_LIMIT:Você atingiu o limite de gerações. Tente novamente em ${hours} hora${hours > 1 ? 's' : ''}.`);
        }
        const errorText = await response.text();
        throw new Error(`Failed to get workout recommendations: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const recommendations = data.recommendations || [];

      // Convert recommendation format to workout format
      const convertedWorkouts: Workout[] = recommendations.map((rec: any, index: number) => ({
        id: `rec-${index}`,
        name: rec.name,
        description: rec.description,
        durationMinutes: rec.durationMinutes,
        caloriesBurnt: rec.estimatedCaloriesBurn,
        difficulty: rec.difficulty,
        exercises: rec.exercises ? rec.exercises.map((ex: any, exIndex: number) => ({
          id: `rec-ex-${index}-${exIndex}`,
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          durationSeconds: ex.durationSeconds,
          notes: ex.instructions
        })) : []
      }));

      setRecommendedWorkouts(convertedWorkouts);
    } catch (error) {
      console.error('Error loading recommended workouts:', error);
      const errorMessage = (error as Error)?.message;
      if (errorMessage?.startsWith('RATE_LIMIT:')) {
        showMessage({
          message: errorMessage.replace('RATE_LIMIT:', ''),
          type: 'warning',
          duration: 5000
        });
      }
    } finally {
      setLoadingRecommended(false);
    }
  }, [token, userId]);

  // Generate new workout recommendations different from current ones
  const generateNewWorkoutRecommendations = useCallback(async () => {
    if (!token || !userId) return;

    setLoadingRecommended(true);

    try {
      // Send current recommendations to generate different ones
      const requestBody = {
        currentRecommendations: recommendedWorkouts.map(rec => ({
          name: rec.name,
          description: rec.description,
          durationMinutes: rec.durationMinutes,
          estimatedCaloriesBurn: rec.caloriesBurnt,
          difficulty: rec.difficulty,
          exercises: rec.exercises?.map(ex => ({
            name: ex.name,
            sets: ex.sets,
            reps: ex.reps,
            durationSeconds: ex.durationSeconds,
            instructions: ex.notes
          }))
        }))
      };

      const response = await fetch(API_ENDPOINTS.USERS.GENERATE_NEW_WORKOUT_RECOMMENDATIONS(userId), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After') || '3600';
          const hours = Math.ceil(parseInt(retryAfter) / 3600);
          throw new Error(`RATE_LIMIT:Você atingiu o limite de gerações. Tente novamente em ${hours} hora${hours > 1 ? 's' : ''}.`);
        }
        const errorText = await response.text();
        throw new Error(`Failed to generate new workout recommendations: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const recommendations = data.recommendations || [];

      // Convert recommendation format to workout format
      const convertedWorkouts: Workout[] = recommendations.map((rec: any, index: number) => ({
        id: `rec-${index}`,
        name: rec.name,
        description: rec.description,
        durationMinutes: rec.durationMinutes,
        caloriesBurnt: rec.estimatedCaloriesBurn,
        difficulty: rec.difficulty,
        exercises: rec.exercises ? rec.exercises.map((ex: any, exIndex: number) => ({
          id: `rec-ex-${index}-${exIndex}`,
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          durationSeconds: ex.durationSeconds,
          notes: ex.instructions
        })) : []
      }));

      setRecommendedWorkouts(convertedWorkouts);
      showMessage({
        message: 'Novos treinos recomendados gerados!',
        type: 'success'
      });
    } catch (error) {
      console.error('Error generating new workout recommendations:', error);
      const errorMessage = (error as Error)?.message;
      if (errorMessage?.startsWith('RATE_LIMIT:')) {
        showMessage({
          message: errorMessage.replace('RATE_LIMIT:', ''),
          type: 'warning',
          duration: 5000
        });
      } else {
        showMessage({
          message: 'Erro ao gerar novos treinos. Tente novamente.',
          type: 'danger'
        });
      }
    } finally {
      setLoadingRecommended(false);
    }
  }, [token, userId, recommendedWorkouts]);

  const startWorkout = async (w: Workout) => {
    if (!token || !userId) {
      showMessage({ message: 'Usuário não autenticado.', type: 'danger' });
      return;
    }
    setStarting(true);
    try {
      const payload: any = {
        name: w.name,
        timestamp: nowAsLocalTime(),
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

      const resp = await fetch(API_ENDPOINTS.USERS.EXERCISES(userId), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        await resp.text();
        showMessage({ message: 'Não foi possível iniciar o treino.', type: 'danger' });
        return;
      }
      const respJson = await resp.json().catch(() => null);
      const calories = respJson?.caloriesBurnt ?? w.caloriesBurnt ?? estimateCalories(w.durationMinutes ?? 20, w.difficulty, weightKg);
      showMessage({ message: `Treino '${w.name}' iniciado! (${Math.round(calories)} kcal)`, type: 'success' });

      // Navigate to history tab after successful workout start
      setCurrentTab('history');
      loadHistory(new Date());
    } catch {
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
    if (customCalories && (Number.isNaN(parseInt(customCalories, 10)) || parseInt(customCalories, 10) < 0)) {
      showMessage({ message: 'Informe um valor válido para as calorias.', type: 'danger' });
      return;
    }
    if (!token || !userId) {
      showMessage({ message: 'Usuário não autenticado.', type: 'danger' });
      return;
    }
    setStarting(true);
    try {
      // Convert local time to UTC time before sending to API
      const utcTimestamp = localTimeAsUTC(timestamp);
      const payload: any = {
        name: customName.trim(),
        timestamp: utcTimestamp,
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

      // Use manual calorie input if provided, otherwise estimate
      if (customCalories && !Number.isNaN(parseInt(customCalories, 10))) {
        payload.caloriesBurnt = parseInt(customCalories, 10);
        payload.caloriesEstimated = false;
      } else {
        // estimate calories for the custom workout and include it in payload
        try {
          const est = payload.durationInMinutes ? estimateCalories(payload.durationInMinutes, undefined, weightKg) : undefined;
          if (typeof est === 'number' && !Number.isNaN(est)) {
            payload.caloriesBurnt = Math.round(est);
            payload.caloriesEstimated = true;
          }
        } catch {
          // ignore
        }
      }

      let resp;
      if (isEditing && editingId) {
        resp = await fetch(API_ENDPOINTS.USERS.EXERCISE_BY_ID(userId, editingId), {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        resp = await fetch(API_ENDPOINTS.USERS.EXERCISES(userId), {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      if (!resp.ok) {
        await resp.text();
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
        const updated = [createdWorkout, ...(prev || [])];
        // Remove duplicates based on workout name
        return updated.filter((workout, index, self) => 
          index === self.findIndex(w => w.name.toLowerCase().trim() === workout.name.toLowerCase().trim())
        );
      });
      setIsEditing(false);
      setEditingId(null);
      setCustomExercises([]);
      setExName(''); setExSets(''); setExReps(''); setExDuration('');
      setModalVisible(false);
      setCustomName('');
      setCustomDuration('20');
      setCustomNotes('');
      setCustomCalories('');
      setShowTimePicker(false);
    } catch {
      showMessage({ message: 'Erro ao criar treino.', type: 'danger' });
    } finally {
      setStarting(false);
      loadHistory(selectedHistoryDate);
    }
  };

  const openEdit = (w: Workout) => {
    setIsEditing(true);
    setEditingId(w.id ?? null);
    setCustomName(w.name ?? '');
    setCustomDuration(String(w.durationMinutes ?? 20));
    setCustomNotes(w.description ?? '');
    setCustomCalories(w.caloriesBurnt && !w.caloriesEstimated ? String(Math.round(w.caloriesBurnt)) : '');
    setCustomExercises(w.exercises ? w.exercises.map((ex: any) => ({ ...ex })) : []);

    // Set the workout date/time or current date/time if not available
    if (w.timestamp) {
      const workoutDate = new Date(w.timestamp);
      setSelectedDate(workoutDate);
      setTimestamp(w.timestamp);
    } else {
      const now = new Date();
      setSelectedDate(now);
      setTimestamp(now.toISOString());
    }
    setShowTimePicker(false);

    setModalVisible(true);
  };

  const handleUseRecommended = (w: Workout) => {
    // Switch to my workouts section and add the workout
    setCurrentSection('my');
    
    (async () => {
      if (!token || !userId) {
        // If not authenticated, just add to local workouts
        setWorkouts((prev) => [w, ...(prev || [])]);
        showMessage({ message: `Treino '${w.name}' adicionado aos seus treinos!`, type: 'success' });
        return;
      }
      try {
        const payload: any = {
          name: w.name,
          timestamp: nowAsLocalTime(),
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
        const resp = await fetch(API_ENDPOINTS.USERS.EXERCISES(userId), {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (resp.ok) {
          const respJson = await resp.json().catch(() => null);
          const created = normalizeWorkout(respJson ?? { ...payload, id: respJson?.id ?? Date.now() });
          setWorkouts((prev) => {
            const updated = [created, ...(prev || [])];
            // Remove duplicates based on workout name
            return updated.filter((workout, index, self) => 
              index === self.findIndex(w => w.name.toLowerCase().trim() === workout.name.toLowerCase().trim())
            );
          });
          showMessage({ message: `Treino '${w.name}' salvo nos seus treinos!`, type: 'success' });
        } else {
          // If API fails, still add to local workouts but show warning
          setWorkouts((prev) => {
            const updated = [{ ...w, id: `local-${Date.now()}` }, ...(prev || [])];
            // Remove duplicates based on workout name
            return updated.filter((workout, index, self) => 
              index === self.findIndex(w => w.name.toLowerCase().trim() === workout.name.toLowerCase().trim())
            );
          });
          showMessage({ message: `Treino '${w.name}' adicionado localmente (erro ao salvar no servidor)`, type: 'warning' });
        }
      } catch {
        // If network fails, still add to local workouts
        setWorkouts((prev) => {
          const updated = [{ ...w, id: `local-${Date.now()}` }, ...(prev || [])];
          // Remove duplicates based on workout name
          return updated.filter((workout, index, self) => 
            index === self.findIndex(w => w.name.toLowerCase().trim() === workout.name.toLowerCase().trim())
          );
        });
        showMessage({ message: `Treino '${w.name}' adicionado localmente (sem conexão)`, type: 'warning' });
      }
    setCurrentTab('history');
    })();
  };



  const closeDetails = () => {
    setDetailsModalVisible(false);
    setSelectedWorkout(null);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Treinos</Text>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => {
            setIsEditing(false);
            setEditingId(null);
            setCustomName('');
            setCustomDuration('20');
            setCustomCalories('');
            setCustomNotes('');
            setCustomExercises([]);
            setExName(''); setExSets(''); setExReps(''); setExDuration('');

            // Set current date and time
            const now = new Date();
            setSelectedDate(now);
            setTimestamp(now.toISOString());
            setShowTimePicker(false);

            setModalVisible(true);
          }}
        >
          <MaterialCommunityIcons name="plus" size={20} color="#fff" />
          <Text style={styles.headerBtnText}>Novo Treino</Text>
        </TouchableOpacity>
      </View>

      {/* Main Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, currentTab === 'treinos' && styles.activeTab]}
          onPress={() => setCurrentTab('treinos')}
        >
          <MaterialCommunityIcons
            name="dumbbell"
            size={20}
            color={currentTab === 'treinos' ? '#22c55e' : '#64748b'}
          />
          <Text style={[styles.tabText, currentTab === 'treinos' && styles.activeTabText]}>
            Treinos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, currentTab === 'history' && styles.activeTab]}
          onPress={() => {
            setCurrentTab('history');
          }}
        >
          <MaterialCommunityIcons
            name="history"
            size={20}
            color={currentTab === 'history' ? '#22c55e' : '#64748b'}
          />
          <Text style={[styles.tabText, currentTab === 'history' && styles.activeTabText]}>
            Histórico
          </Text>
        </TouchableOpacity>
      </View>

      {currentTab === 'history' ? (
        // History View
        <View style={{ flex: 1 }}>
          {/* Day Navigation */}
          <View style={styles.dayNavigation}>
            <TouchableOpacity
              style={styles.dayNavButton}
              onPress={() => {
                const newDate = new Date(selectedHistoryDate);
                newDate.setDate(newDate.getDate() - 1);
                setSelectedHistoryDate(newDate);
              }}
            >
              <MaterialCommunityIcons name="chevron-left" size={24} color="#64748b" />
            </TouchableOpacity>

            <View style={styles.dateDisplay}>
              <Text style={styles.dateText}>
                {selectedHistoryDate.toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                })}
              </Text>
              <Text style={styles.dayText}>
                {selectedHistoryDate.toLocaleDateString('pt-BR', { year: 'numeric' })}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.dayNavButton}
              onPress={() => {
                const newDate = new Date(selectedHistoryDate);
                newDate.setDate(newDate.getDate() + 1);
                setSelectedHistoryDate(newDate);
              }}
            >
              <MaterialCommunityIcons name="chevron-right" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          
          {loadingHistory ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#22c55e" />
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
              contentContainerStyle={{ paddingBottom: 10 }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <MaterialCommunityIcons name="dumbbell" size={24} color="#22c55e" />
                    <TouchableOpacity onPress={() => { setSelectedWorkout(item); setDetailsModalVisible(true); }}>
                      <Text style={styles.cardTitle}>{item.name}</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.cardSubtitle}>{item.description}</Text>
                  {item.timestamp && (
                    <Text style={{ color: '#64748b', fontSize: 12, marginBottom: 8, fontWeight: '600' }}>
                      {formatUTCToLocalDateTime(item.timestamp)}
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
                      style={[styles.actionBtn, styles.editBtn]} 
                      onPress={() => openEdit(item)}
                    >
                      <MaterialCommunityIcons name="pencil" size={16} color="#fff" />
                      <Text style={styles.actionBtnText}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.deleteBtn]} 
                      onPress={() => handleDeleteHistory(item)}
                    >
                      <MaterialCommunityIcons name="delete" size={16} color="#fff" />
                      <Text style={styles.actionBtnText}>Excluir</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
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
        // Treinos tab content with sections
        <View style={{ flex: 1 }}>
          {/* Section Navigation */}
          <View style={styles.sectionTabs}>
            <TouchableOpacity
              style={[styles.sectionTab, currentSection === 'my' && styles.activeSectionTab]}
              onPress={() => setCurrentSection('my')}
            >
              <Text style={[styles.sectionTabText, currentSection === 'my' && styles.activeSectionTabText]}>
                Meus Treinos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sectionTab, currentSection === 'recommended' && styles.activeSectionTab]}
              onPress={() => {
                setCurrentSection('recommended');
                if (recommendedWorkouts.length === 0) {
                  loadRecommendedWorkouts();
                }
              }}
            >
              <Text style={[styles.sectionTabText, currentSection === 'recommended' && styles.activeSectionTabText]}>
                Treinos Recomendados
              </Text>
            </TouchableOpacity>
          </View>

          {/* Generate New Recommendations Button for Recommended Section */}
          {currentSection === 'recommended' && recommendedWorkouts.length > 0 && !loadingRecommended && (
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={generateNewWorkoutRecommendations}
              disabled={loadingRecommended}
            >
              <MaterialCommunityIcons name="refresh" size={20} color="#0ea5e9" />
              <Text style={styles.refreshButtonText}>Gerar Novos Treinos</Text>
            </TouchableOpacity>
          )}

          {/* Section Content */}
          {currentSection === 'my' ? (
            // Meus Treinos section
            <View style={{ flex: 1 }}>
              {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 }}>
                  <ActivityIndicator size="large" color="#22c55e" />
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
                  renderItem={({ item }) => (
                    <View style={styles.card}>
                      <View style={styles.cardHeader}>
                        <MaterialCommunityIcons name="dumbbell" size={24} color="#22c55e" />
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
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.editBtn]}
                          onPress={() => startWorkout(item)}
                        >
                          <MaterialCommunityIcons name="play" size={16} color="#fff" />
                          <Text style={styles.actionBtnText}>Iniciar Treino</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.deleteBtn]}
                          onPress={() => openEdit(item)}
                        >
                          <MaterialCommunityIcons name="pencil" size={16} color="#fff" />
                          <Text style={styles.actionBtnText}>Personalizar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                  contentContainerStyle={{ paddingBottom: 10 }}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={
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
                  }
                />
              )}
            </View>
          ) : (
            // Treinos Recomendados section
            <View style={{ flex: 1 }}>
              {loadingRecommended ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 }}>
                  <ActivityIndicator size="large" color="#22c55e" />
                  <Text style={{
                    color: '#64748b',
                    marginTop: 16,
                    fontSize: 16,
                    fontWeight: '600',
                  }}>
                    Carregando recomendações...
                  </Text>
                </View>
              ) : (
                <View style={{ flex: 1 }}>

                  <FlatList
                    data={recommendedWorkouts}
                    keyExtractor={(w) => String(w.id)}
                    contentContainerStyle={{ paddingBottom: 10 }}
                    showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <View style={styles.card}>
                      <View style={styles.cardHeader}>
                        <MaterialCommunityIcons name="star" size={24} color="#22c55e" />
                        <TouchableOpacity onPress={() => { setSelectedWorkout(item); setDetailsModalVisible(true); }}>
                          <Text
                            style={styles.cardTitle}
                            numberOfLines={screenWidth <= 400 ? 2 : 1}
                            ellipsizeMode={screenWidth <= 400 ? 'tail' : 'middle'}
                            >
                            {item.name}
                          </Text>
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
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.editBtn]}
                          onPress={() => handleUseRecommended(item)}
                        >
                          <MaterialCommunityIcons name="play" size={16} color="#fff" />
                          <Text style={styles.actionBtnText}>Iniciar Treino</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.deleteBtn]}
                          onPress={() => openEdit(item)}
                        >
                          <MaterialCommunityIcons name="pencil" size={16} color="#fff" />
                          <Text style={styles.actionBtnText}>Personalizar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                  ListEmptyComponent={
                    <View style={{ alignItems: 'center', paddingTop: 60 }}>
                      {/* Refresh Button  */}
                      <TouchableOpacity
                        style={styles.refreshButton}
                        onPress={generateNewWorkoutRecommendations}
                        disabled={loadingRecommended}
                      >
                        <MaterialCommunityIcons name="refresh" size={20} color="#0ea5e9" />
                        <Text style={styles.refreshButtonText}>Atualizar Treinos</Text>
                      </TouchableOpacity>
                      <MaterialCommunityIcons name="star" size={80} color="#cbd5e1" />
                      <Text style={{
                        color: '#64748b',
                        marginTop: 20,
                        textAlign: 'center',
                        fontSize: 18,
                        fontWeight: '700',
                      }}>
                        Erro ao gerar recomendações
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
                        Toque em atualizar para gerar novamente
                      </Text>
                    </View>
                  }
                />
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* Create/Edit Custom Workout Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView 
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          >
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Treino personalizado</Text>
              <TextInput
                placeholder="Nome do treino"
                value={customName}
                onChangeText={setCustomName}
                style={styles.input}
                placeholderTextColor="#94a3b8"
              />

              <Text style={{
                fontWeight: '800',
                marginBottom: 8,
                fontSize: 14,
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                marginTop: 16,
              }}>
                Data
              </Text>
              <TextInput
                style={[styles.input, styles.inputDisabled, { marginBottom: 16 }]}
                value={selectedDate.toLocaleDateString('pt-BR')}
                editable={false}
                placeholder="DD/MM/AAAA"
                placeholderTextColor="#94a3b8"
              />

              <Text style={{
                fontWeight: '800',
                marginBottom: 8,
                fontSize: 14,
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}>
                Hora
              </Text>
              <View style={styles.timePickerContainer}>
                <TouchableOpacity
                  style={styles.timeDisplay}
                  onPress={() => setShowTimePicker(!showTimePicker)}
                >
                  <MaterialCommunityIcons name="clock" size={20} color="#22c55e" style={{ marginRight: 8 }} />
                  <Text style={styles.timeDisplayText}>
                    {new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </Text>
                  <MaterialCommunityIcons
                    name={showTimePicker ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#22c55e"
                    style={{ marginLeft: 8 }}
                  />
                </TouchableOpacity>

                {showTimePicker && (
                  <View style={styles.timePickerRow}>
                    <View style={styles.timePicker}>
                      <Text style={styles.timeLabel}>Horas</Text>
                      <View style={styles.hourGrid}>
                        {Array.from({ length: 24 }, (_, i) => (
                          <TouchableOpacity
                            key={i}
                            style={[
                              styles.hourButton,
                              new Date(timestamp).getHours() === i && styles.hourButtonActive
                            ]}
                            onPress={() => {
                              const currentDate = new Date(timestamp);
                              currentDate.setHours(i);
                              setTimestamp(currentDate.toISOString());
                            }}
                          >
                            <Text style={[
                              styles.hourButtonText,
                              new Date(timestamp).getHours() === i && styles.hourButtonTextActive
                            ]}>
                              {String(i).padStart(2, '0')}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View style={styles.timePicker}>
                      <Text style={styles.timeLabel}>Minutos</Text>
                      <View style={styles.minuteGrid}>
                        {Array.from({ length: 12 }, (_, i) => i * 5).map(minute => (
                          <TouchableOpacity
                            key={minute}
                            style={[
                              styles.minuteButton,
                              Math.floor(new Date(timestamp).getMinutes() / 5) * 5 === minute && styles.minuteButtonActive
                            ]}
                            onPress={() => {
                              const currentDate = new Date(timestamp);
                              currentDate.setMinutes(minute);
                              setTimestamp(currentDate.toISOString());
                            }}
                          >
                            <Text style={[
                              styles.minuteButtonText,
                              Math.floor(new Date(timestamp).getMinutes() / 5) * 5 === minute && styles.minuteButtonTextActive
                            ]}>
                              {String(minute).padStart(2, '0')}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                )}
              </View>
              <View style={{ 
                flexDirection: screenWidth <= 400 ? 'column' : 'row', 
                gap: screenWidth <= 400 ? 0 : 12,
                marginBottom: screenWidth <= 400 ? 0 : 16,
              }}>
                <TextInput 
                  placeholder="Duração (min)" 
                  value={customDuration} 
                  onChangeText={setCustomDuration} 
                  keyboardType="numeric" 
                  style={[styles.input, { flex: screenWidth <= 400 ? 1 : 0.5 }]}
                  placeholderTextColor="#94a3b8"
                />
                <TextInput 
                  placeholder="Calorias queimadas" 
                  value={customCalories} 
                  onChangeText={setCustomCalories} 
                  keyboardType="numeric" 
                  style={[styles.input, { flex: screenWidth <= 400 ? 1 : 0.5 }]}
                  placeholderTextColor="#94a3b8"
                />
              </View>
              <TextInput 
                placeholder="Notas ou descrição (opcional)" 
                value={customNotes} 
                onChangeText={setCustomNotes} 
                style={[styles.input, { 
                  height: screenWidth <= 400 ? 70 : 80, 
                  textAlignVertical: 'top' 
                }]} 
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
                      shadowColor: '#22c55e',
                      shadowOpacity: 0.1,
                      shadowOffset: { width: 0, height: 2 },
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  >
                    <Text style={{ 
                      color: '#22c55e', 
                      fontWeight: '800',
                      fontSize: 12,
                      letterSpacing: 0.25,
                    }}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ flexDirection: screenWidth <= 400 ? 'column' : 'row', marginBottom: 12, gap: 12 }}>
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
                  style={[styles.input, { 
                    width: screenWidth <= 400 ? '100%' : 80, 
                    marginBottom: 0 
                  }]}
                  placeholderTextColor="#94a3b8"
                />
              </View>
              <View style={{ flexDirection: screenWidth <= 400 ? 'column' : 'row', marginBottom: 16, gap: 12 }}>
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
                  style={[styles.input, { 
                    width: screenWidth <= 400 ? '100%' : 120, 
                    marginBottom: 0 
                  }]}
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'flex-end', width: '100%', marginBottom: 16 }}>
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
                  marginBottom: 80,
                  marginTop: 10
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
              <TouchableOpacity 
                style={[styles.modalCancelBtn]} 
                onPress={() => setModalVisible(false)}
              >
                <MaterialCommunityIcons name="close" size={18} color="#475569" />
                <Text style={styles.modalCancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalSaveBtn]} 
                onPress={createCustomWorkout} 
                disabled={starting}
              >
                {starting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="rocket-launch" size={18} color="#fff" />
                    <Text style={styles.modalSaveBtnText}>Criar e Iniciar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            </View>
          </ScrollView>
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
              <Text style={{ color: '#334155', marginRight: 16 }}>{selectedWorkout?.durationMinutes} min</Text>
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
                    <Text style={styles.workoutDetailText}>{workoutToDelete.durationMinutes} min</Text>
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
  screen: { 
    flex: 1, 
    backgroundColor: '#f1f5f9', 
    padding: screenWidth <= 400 ? 20 : 24,
    paddingBottom: 40, // Para não ficar atrás da tab bar
  },
  header: { 
    flexDirection: screenWidth <= 400 ? 'column' : 'row', 
    justifyContent: 'space-between', 
    alignItems: screenWidth <= 400 ? 'stretch' : 'center', 
    marginBottom: screenWidth <= 400 ? 20 : 24,
    paddingBottom: 8,
  },
  headerButtons: {
    flexDirection: screenWidth <= 400 ? 'column' : 'row',
    gap: 12,
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#22c55e',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
    minHeight: 48,
  },
  headerBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    marginLeft: 8,
    fontSize: 14,
    letterSpacing: 0.25,
  },
  title: { 
    fontSize: screenWidth <= 400 ? 22 : 26, 
    fontWeight: '900', 
    color: '#0f172a',
    letterSpacing: -0.5,
    marginBottom: screenWidth <= 400 ? 16 : 0,
  },
  customBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#22c55e', 
    paddingVertical: screenWidth <= 400 ? 10 : 12, 
    paddingHorizontal: screenWidth <= 400 ? 14 : 18, 
    borderRadius: 16,
    shadowColor: '#22c55e',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
    flex: screenWidth <= 400 ? 1 : 0,
    justifyContent: 'center',
  },
  customBtnText: { 
    color: '#ffffff', 
    fontWeight: '800', 
    marginLeft: 8,
    fontSize: screenWidth <= 400 ? 12 : 14,
    letterSpacing: 0.25,
  },
  card: { 
    backgroundColor: '#ffffff', 
    padding: screenWidth <= 400 ? 20 : 24, 
    borderRadius: 20, 
    marginBottom: 20, 
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
    fontSize: screenWidth <= 400 ? 16 : 18, 
    fontWeight: '900', 
    color: '#0f172a',
    letterSpacing: -0.25,
  },
  cardSubtitle: { 
    color: '#475569', 
    marginBottom: 16,
    fontSize: screenWidth <= 400 ? 13 : 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  cardActions: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  startBtn: { 
    backgroundColor: '#22c55e', 
    paddingVertical: screenWidth <= 400 ? 10 : 12, 
    paddingHorizontal: screenWidth <= 400 ? 16 : 20, 
    borderRadius: 14,
    shadowColor: '#22c55e',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
    width: screenWidth <= 400 ? '100%' : 'auto',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtnText: { 
    color: '#ffffff', 
    fontWeight: '800',
    fontSize: screenWidth <= 400 ? 12 : 14,
    letterSpacing: 0.25,
  },
  exerciseRow: { 
    flexDirection: screenWidth <= 400 ? 'column' : 'row', 
    justifyContent: 'space-between', 
    paddingVertical: 8, 
    borderBottomWidth: 1, 
    borderColor: '#f1f5f9',
    marginBottom: 4,
  },
  exerciseName: { 
    color: '#0f172a', 
    flex: screenWidth <= 400 ? 0 : 1,
    fontWeight: '600',
    fontSize: screenWidth <= 400 ? 13 : 14,
    marginBottom: screenWidth <= 400 ? 4 : 0,
  },
  exerciseMeta: { 
    color: '#64748b', 
    marginLeft: screenWidth <= 400 ? 0 : 16,
    fontWeight: '600',
    fontSize: screenWidth <= 400 ? 12 : 13,
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(15,23,42,0.75)', 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: screenWidth <= 400 ? 16 : 20,
  },
  modalScrollView: {
    width: '100%',
    maxHeight: '95%',
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingBottom: 16,
  },
  modalCard: { 
    width: '100%', 
    backgroundColor: '#ffffff', 
    borderRadius: 24, 
    padding: screenWidth <= 400 ? 20 : 24, 
    borderWidth: 1, 
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 20 },
    shadowRadius: 40,
    elevation: 20,
  },
  modalTitle: { 
    fontSize: screenWidth <= 400 ? 18 : 22, 
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
    padding: screenWidth <= 400 ? 14 : 16, 
    marginBottom: 16, 
    backgroundColor: '#ffffff',
    fontSize: screenWidth <= 400 ? 14 : 16,
    fontWeight: '600',
    color: '#0f172a',
    shadowColor: '#64748b',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  modalActions: { 
    flexDirection: screenWidth <= 440 ? 'column' : 'row', 
    justifyContent: 'flex-end',
    alignItems: 'stretch',
    width: '100%',
    marginTop: 24,
    gap: 12,
  },
  cancelBtn: { 
    paddingVertical: screenWidth <= 400 ? 14 : 12, 
    paddingHorizontal: screenWidth <= 400 ? 16 : 18, 
    borderRadius: 14, 
    backgroundColor: '#f8fafc', 
    borderWidth: 1,
    borderColor: '#cbd5e1',
    shadowColor: '#64748b',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  cancelBtnText: { 
    color: '#374151', 
    fontWeight: '800',
    fontSize: screenWidth <= 400 ? 13 : 14,
    letterSpacing: 0.25,
  },
  saveBtn: { 
    paddingVertical: screenWidth <= 400 ? 14 : 12, 
    paddingHorizontal: screenWidth <= 400 ? 16 : 18, 
    borderRadius: 14, 
    backgroundColor: '#22c55e',
    shadowColor: '#22c55e',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
  },
  saveBtnText: { 
    color: '#ffffff', 
    fontWeight: '800',
    fontSize: screenWidth <= 400 ? 13 : 14,
    letterSpacing: 0.25,
  },
  // Enhanced confirmation dialog styles
  confirmCard: {
    width: '92%',
    maxWidth: screenWidth <= 400 ? 350 : 400,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: screenWidth <= 400 ? 24 : 28,
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
    width: screenWidth <= 400 ? 70 : 80,
    height: screenWidth <= 400 ? 70 : 80,
    borderRadius: screenWidth <= 400 ? 35 : 40,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#fecaca',
  },
  confirmTitle: {
    fontSize: screenWidth <= 400 ? 18 : 22,
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
    padding: screenWidth <= 400 ? 14 : 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  workoutPreviewTitle: {
    fontSize: screenWidth <= 400 ? 16 : 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.25,
  },
  workoutPreviewDetails: {
    flexDirection: screenWidth <= 400 ? 'column' : 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: screenWidth <= 400 ? 8 : 16,
    marginBottom: 8,
  },
  workoutDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: screenWidth <= 400 ? 10 : 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignSelf: screenWidth <= 400 ? 'flex-start' : 'center',
  },
  workoutDetailText: {
    fontSize: screenWidth <= 400 ? 12 : 13,
    fontWeight: '600',
    color: '#64748b',
    marginLeft: 6,
  },
  workoutPreviewDescription: {
    fontSize: screenWidth <= 400 ? 13 : 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
    marginTop: 8,
  },
  confirmMessage: {
    fontSize: screenWidth <= 400 ? 14 : 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    fontWeight: '500',
    paddingHorizontal: 8,
  },
  confirmActions: {
    flexDirection: screenWidth <= 400 ? 'column' : 'row',
    gap: 12,
    width: '100%',
  },
  confirmCancelBtn: {
    flex: 1,
    paddingVertical: screenWidth <= 400 ? 14 : 16,
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
    fontSize: screenWidth <= 400 ? 14 : 15,
    letterSpacing: 0.25,
  },
  confirmDeleteBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: screenWidth <= 400 ? 14 : 16,
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
    fontSize: screenWidth <= 400 ? 14 : 15,
    letterSpacing: 0.25,
  },
  // Novos estilos para botões melhorados
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
    minHeight: 44,
  },
  editBtn: {
    backgroundColor: '#64748b',
    shadowColor: '#64748b',
  },
  deleteBtn: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
  },
  actionBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.25,
    marginLeft: 6,
  },
  recommendedBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    minHeight: 44,
  },
  useBtn: {
    backgroundColor: '#22c55e',
    shadowColor: '#22c55e',
  },
  customizeBtn: {
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#22c55e',
    shadowColor: '#22c55e',
  },
  recommendedBtnText: {
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.25,
    marginLeft: 6,
    color: '#ffffff',
  },
  // Estilos dos botões do modal
  modalCancelBtn: {
    flex: screenWidth <= 440 ? 1 : 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#64748b',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    minWidth: 120,
    minHeight: 52,
  },
  modalCancelBtnText: {
    color: '#475569',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.25,
    marginLeft: 6,
  },
  modalSaveBtn: {
    flex: screenWidth <= 440 ? 1 : 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: '#22c55e',
    shadowColor: '#22c55e',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
    minWidth: 120,
    minHeight: 32,
  },
  modalSaveBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.25,
    marginLeft: 6,
  },
  // Tab styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
    height: 90,
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: screenWidth <= 400 ? 12 : 16,
    borderRadius: 10,
    gap: 3,
    height: 80,
  },
  activeTab: {
    backgroundColor: '#ffffff',
    shadowColor: '#22c55e',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: screenWidth <= 400 ? 10 : 11,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.25,
    textAlign: 'center',
    lineHeight: 14,
  },
  activeTabText: {
    color: '#22c55e',
  },
  // Section navigation styles
  sectionContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 2,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTabs: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    marginHorizontal: 4,
  },
  sectionTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
  },
  activeSectionTab: {
    backgroundColor: '#ffffff',
    shadowColor: '#22c55e',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 1,
  },
  sectionTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    letterSpacing: 0.25,
  },
  activeSectionTabText: {
    color: '#22c55e',
    fontWeight: '700',
  },
  // Recommended workout styles
  recommendedCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#7c3aed',
    backgroundColor: '#fefbff',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f9ff',
    borderWidth: 2,
    borderColor: '#0ea5e9',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
    shadowColor: '#0ea5e9',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0ea5e9',
    letterSpacing: 0.25,
  },
  saveBtnRecommended: {
    backgroundColor: '#7c3aed',
    shadowColor: '#7c3aed',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  // Day Navigation styles
  dayNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  dayNavButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
  },
  dateDisplay: {
    alignItems: 'center',
    flex: 1,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    textTransform: 'capitalize',
    textAlign: 'center',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  // Time Picker styles
  timePickerContainer: {
    marginBottom: 16,
  },
  timeDisplay: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#22c55e',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#22c55e',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  timeDisplayText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#22c55e',
    letterSpacing: 2,
  },
  timePickerRow: {
    flexDirection: 'row',
    gap: 16,
  },
  timePicker: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
    textAlign: 'center',
  },
  hourGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'center',
  },
  hourButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  hourButtonActive: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  hourButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  hourButtonTextActive: {
    color: '#ffffff',
  },
  minuteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  minuteButton: {
    width: 42,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  minuteButtonActive: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  minuteButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  minuteButtonTextActive: {
    color: '#ffffff',
  },
  inputDisabled: {
    opacity: 0.6,
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
});
