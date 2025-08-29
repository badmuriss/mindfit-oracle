import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { useUser } from '../../components/UserContext';
import { API_ENDPOINTS } from '../../constants/Api';
import { createLocalTimeAsUTC, nowUTC, formatUTCToLocalTime, formatUTCToLocalDateTime } from '../../utils/dateUtils';

const { width: screenWidth } = Dimensions.get('window');

type Meal = {
  id?: string;
  userId?: string;
  name: string;
  timestamp: string;
  calories: number;
  carbo?: number;
  protein?: number;
  fat?: number;
  createdAt?: string;
  // backend identifier to use in API routes (may differ from display id)
  apiId?: string;
};

type PresetMeal = Meal & {
  icon: string;
  description: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  color: string;
};

const PRESET_MEALS: PresetMeal[] = [
  { 
    name: 'Frango com arroz', 
    timestamp: new Date().toISOString(), 
    calories: 550, 
    carbo: 60, 
    protein: 40, 
    fat: 12,
    icon: 'food-drumstick',
    description: 'Prato balanceado rico em proteína',
    category: 'lunch',
    color: '#f97316'
  },
  { 
    name: 'Ovo mexido (2 ovos)', 
    timestamp: new Date().toISOString(), 
    calories: 200, 
    carbo: 1.5, 
    protein: 14, 
    fat: 15,
    icon: 'egg',
    description: 'Fonte excelente de proteína',
    category: 'breakfast',
    color: '#eab308'
  },
  { 
    name: 'Salada com atum', 
    timestamp: new Date().toISOString(), 
    calories: 320, 
    carbo: 8, 
    protein: 30, 
    fat: 18,
    icon: 'salad',
    description: 'Leve e nutritiva',
    category: 'lunch',
    color: '#22c55e'
  },
  { 
    name: 'Iogurte com granola', 
    timestamp: new Date().toISOString(), 
    calories: 300, 
    carbo: 45, 
    protein: 12, 
    fat: 6,
    icon: 'cup',
    description: 'Perfeito para o café da manhã',
    category: 'breakfast',
    color: '#8b5cf6'
  },
  { 
    name: 'Banana', 
    timestamp: new Date().toISOString(), 
    calories: 105, 
    carbo: 27, 
    protein: 1.3, 
    fat: 0.3,
    icon: 'food-banana',
    description: 'Energia natural e potássio',
    category: 'snack',
    color: '#facc15'
  },
  { 
    name: 'Sanduíche integral', 
    timestamp: new Date().toISOString(), 
    calories: 280, 
    carbo: 35, 
    protein: 15, 
    fat: 8,
    icon: 'food-croissant',
    description: 'Prático e nutritivo',
    category: 'breakfast',
    color: '#a16207'
  },
  { 
    name: 'Salmão grelhado', 
    timestamp: new Date().toISOString(), 
    calories: 380, 
    carbo: 2, 
    protein: 35, 
    fat: 25,
    icon: 'fish',
    description: 'Rico em ômega-3',
    category: 'dinner',
    color: '#ec4899'
  },
  { 
    name: 'Smoothie de frutas', 
    timestamp: new Date().toISOString(), 
    calories: 180, 
    carbo: 42, 
    protein: 4, 
    fat: 1,
    icon: 'cup-water',
    description: 'Refrescante e vitamínico',
    category: 'snack',
    color: '#06b6d4'
  },
];

export default function NutritionScreen() {
  const { token, userId } = useUser();

  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [timestamp, setTimestamp] = useState(nowUTC());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [calories, setCalories] = useState('');
  const [carbo, setCarbo] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [saving, setSaving] = useState(false);

  // Confirmation dialog state
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [mealToDelete, setMealToDelete] = useState<Meal | null>(null);
  
  // Filter meals by selected date
  const filteredMeals = meals.filter(meal => {
    const mealDate = new Date(meal.timestamp);
    return mealDate.toDateString() === selectedDate.toDateString();
  });

  const loadMeals = useCallback(async () => {
    if (!token || !userId) return;
    setLoading(true);
    try {
      const pageable = encodeURIComponent(JSON.stringify({ page: 0, size: 50 }));
      const resp = await fetch(API_ENDPOINTS.USERS.MEALS(userId, pageable), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) {
        console.log('Failed to fetch meals', resp.status);
        setMeals([]);
        return;
      }
      const data = await resp.json();
      const items = Array.isArray(data) ? data : data.content || [];
      setMeals(items.map((it: any) => ({
        // prefer a stable display id, but also keep a raw api id for operations
        id: String(it.id ?? it._id ?? it.mealId ?? it.uuid ?? it.createdAt ?? it.timestamp ?? ''),
        apiId: String(it.id ?? it._id ?? it.mealId ?? it.uuid ?? ''),
        userId: it.userId,
        name: it.name,
        timestamp: it.timestamp,
        calories: it.calories ?? 0,
        carbo: it.carbo,
        protein: it.protein,
        fat: it.fat,
        createdAt: it.createdAt,
      })));
    } catch (err) {
      console.log('Error loading meals', err);
    } finally {
      setLoading(false);
    }
  }, [token, userId]);

  useEffect(() => {
    loadMeals();
  }, [loadMeals]);

  const openCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    setName(''); 
    setCalories(''); 
    setCarbo(''); 
    setProtein(''); 
    setFat('');
    // Set timestamp to selected date with current time in UTC
    const now = new Date();
    setTimestamp(createLocalTimeAsUTC(selectedDate, now.getHours(), now.getMinutes()));
    setModalVisible(true);
  };

  const applyPreset = (p: PresetMeal) => {
    setName(p.name);
    // don't overwrite the timestamp when creating a new meal - keep the moment the user opened the modal
    if (isEditing) {
      setTimestamp(p.timestamp || nowUTC());
    }
    setCalories(String(p.calories ?? ''));
    setCarbo(p.carbo != null ? String(p.carbo) : '');
    setProtein(p.protein != null ? String(p.protein) : '');
    setFat(p.fat != null ? String(p.fat) : '');
  };

  const openEdit = (m: Meal) => {
    setIsEditing(true);
  setEditingId((m.apiId || m.id) ?? null);
    setName(m.name);
    setTimestamp(m.timestamp || nowUTC());
    setCalories(String(m.calories ?? ''));
    setCarbo(m.carbo != null ? String(m.carbo) : '');
    setProtein(m.protein != null ? String(m.protein) : '');
    setFat(m.fat != null ? String(m.fat) : '');
    setModalVisible(true);
  };

  const handleDelete = (m: Meal) => {
    console.log('handleDelete called for meal', m?.name, m?.id, m?.apiId);
    setMealToDelete(m);
    setConfirmDeleteVisible(true);
  };

  const confirmDelete = async () => {
    if (!mealToDelete) return;
    
    const m = mealToDelete;
    setConfirmDeleteVisible(false);
    setMealToDelete(null);

    // prefer the stable `id` that other parts of the app use; fall back to raw api id
    const mealId = m.id || m.apiId;
    if (!token || !userId) {
      showMessage({ message: 'Usuário não autenticado.', type: 'danger' });
      return;
    }
    if (!mealId) {
      showMessage({ message: 'ID da refeição não encontrado.', type: 'danger' });
      return;
    }
    try {
      const url = API_ENDPOINTS.USERS.MEAL_BY_ID(userId, mealId);
      const resp = await fetch(url, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });

      // Handle common HTTP responses with clearer messages
      if (resp.status === 204 || resp.ok) {
        // optimistic update: remove locally immediately for snappy UX
        setMeals((prev) => prev.filter((it) => (it.apiId || it.id) !== (m.apiId || m.id)));
        showMessage({ message: 'Refeição removida.', type: 'success' });
        // still refresh in background to ensure consistency
        loadMeals();
        return;
      }

      if (resp.status === 404) {
        showMessage({ message: 'Refeição não encontrada no servidor.', type: 'danger' });
        await loadMeals();
        return;
      }

      if (resp.status === 401 || resp.status === 403) {
        showMessage({ message: 'Você não tem permissão para remover esta refeição.', type: 'danger' });
        return;
      }

      // try to get server error text for debugging
      const txt = await resp.text();
      console.log('Failed to delete meal', resp.status, txt, { url });
      showMessage({ message: 'Erro ao remover refeição.', type: 'danger' });
    } catch (err) {
      console.log('Error deleting meal', err);
      showMessage({ message: 'Erro ao remover refeição.', type: 'danger' });
    }
  };

  const cancelDelete = () => {
    setConfirmDeleteVisible(false);
    setMealToDelete(null);
  };

  const handleSubmit = async () => {
    if (!name.trim()) { showMessage({ message: 'Informe o nome da refeição.', type: 'danger' }); return; }
    if (!token || !userId) { showMessage({ message: 'Usuário não autenticado.', type: 'danger' }); return; }

    const payload: any = { name: name.trim(), timestamp: timestamp, calories: parseInt(calories, 10) || 0 };
    if (carbo) payload.carbo = parseFloat(carbo);
    if (protein) payload.protein = parseFloat(protein);
    if (fat) payload.fat = parseFloat(fat);

    setSaving(true);
    try {
      let resp;
      if (isEditing && editingId) {
        resp = await fetch(API_ENDPOINTS.USERS.MEAL_BY_ID(userId, editingId), {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        resp = await fetch(API_ENDPOINTS.USERS.MEALS(userId), {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      if (!resp.ok) {
        const txt = await resp.text();
        console.log('Failed to save meal', resp.status, txt);
        showMessage({ message: 'Erro ao salvar refeição.', type: 'danger' });
        return;
      }
  showMessage({ message: isEditing ? 'Refeição atualizada.' : 'Refeição criada.', type: 'success' });
      setModalVisible(false);
      // refresh list: optimistic update if respJson has id
      await loadMeals();
    } catch (err) {
      console.log('Error saving meal', err);
      showMessage({ message: 'Erro ao salvar refeição.', type: 'danger' });
    } finally {
      setSaving(false);
    }
  };

  const onRefresh = async () => { setRefreshing(true); await loadMeals(); setRefreshing(false); };

  const renderMeal = ({ item }: { item: Meal }) => (
    <View style={styles.mealRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.mealName}>{item.name}</Text>
        <Text style={styles.mealMeta}>{formatUTCToLocalDateTime(item.timestamp)} • {item.calories} kcal</Text>
        <Text style={styles.mealMacro}>{item.carbo ? `C: ${item.carbo}g ` : ''}{item.protein ? `P: ${item.protein}g ` : ''}{item.fat ? `F: ${item.fat}g` : ''}</Text>
      </View>
      <View style={styles.mealActions}>
        <TouchableOpacity onPress={() => openEdit(item)} style={styles.iconBtn}>
          <MaterialCommunityIcons name="pencil" size={20} color="#475569" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item)} style={styles.iconBtn}>
          <MaterialCommunityIcons name="delete" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="food-apple" size={32} color="#10b981" />
        <Text style={styles.title}>Nutrição</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <Text style={styles.addBtnText}>+ Nova</Text>
        </TouchableOpacity>
      </View>

      {/* Day Navigation */}
      <View style={styles.dayNavigation}>
        <TouchableOpacity 
          style={styles.dayNavButton}
          onPress={() => {
            const newDate = new Date(selectedDate);
            newDate.setDate(newDate.getDate() - 1);
            setSelectedDate(newDate);
          }}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color="#64748b" />
        </TouchableOpacity>
        
        <View style={styles.dateDisplay}>
          <Text style={styles.dateText}>
            {selectedDate.toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric', 
              month: 'long'
            })}
          </Text>
          <Text style={styles.dayText}>
            {selectedDate.toLocaleDateString('pt-BR', { year: 'numeric' })}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.dayNavButton}
          onPress={() => {
            const newDate = new Date(selectedDate);
            newDate.setDate(newDate.getDate() + 1);
            setSelectedDate(newDate);
          }}
        >
          <MaterialCommunityIcons name="chevron-right" size={24} color="#64748b" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#22c55e" />
        </View>
      ) : (
        <FlatList
          data={filteredMeals}
          keyExtractor={(m) => String(m.apiId || m.id || m.timestamp)}
          renderItem={renderMeal}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <MaterialCommunityIcons name="food-off" size={64} color="#cbd5e1" />
              <Text style={{ 
                color: '#64748b', 
                marginTop: 16, 
                textAlign: 'center',
                fontSize: 16,
                fontWeight: '600',
              }}>
                Nenhuma refeição encontrada.
              </Text>
              <Text style={{ 
                color: '#94a3b8', 
                marginTop: 8, 
                textAlign: 'center',
                fontSize: 14,
                fontWeight: '500',
              }}>
                Comece adicionando sua primeira refeição
              </Text>
            </View>
          }
        />
      )}

      {modalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
              <Text style={styles.modalTitle}>{isEditing ? 'Editar Refeição' : 'Nova Refeição'}</Text>
              
              <Text style={styles.label}>Sugestões Rápidas</Text>
              <Text style={styles.sublabel}>Toque em uma opção para preenchimento automático</Text>
              
              <View style={styles.presetGrid}>
                {PRESET_MEALS.map((p) => (
                  <TouchableOpacity key={p.name} style={[styles.presetCard, { borderColor: p.color + '30' }]} onPress={() => applyPreset(p)}>
                    <View style={[styles.presetIcon, { backgroundColor: p.color + '15' }]}>
                      <MaterialCommunityIcons name={p.icon as any} size={22} color={p.color} />
                    </View>
                    <Text style={styles.presetCardTitle}>{p.name}</Text>
                    <Text style={styles.presetCardDescription}>{p.description}</Text>
                    <View style={styles.presetCardFooter}>
                      <Text style={[styles.presetCardCalories, { color: p.color }]}>
                        {p.calories} kcal
                      </Text>
                      <View style={[styles.categoryBadge, { backgroundColor: p.color + '20' }]}>
                        <Text style={[styles.categoryBadgeText, { color: p.color }]}>
                          {p.category === 'breakfast' ? 'Café' : 
                           p.category === 'lunch' ? 'Almoço' : 
                           p.category === 'dinner' ? 'Jantar' : 'Lanche'}
                        </Text>
                      </View>
                    </View>
                    {p.carbo && p.protein && p.fat && (
                      <View style={styles.macroRow}>
                        <Text style={styles.macroText}>C: {p.carbo}g</Text>
                        <Text style={styles.macroText}>P: {p.protein}g</Text>
                        <Text style={styles.macroText}>G: {p.fat}g</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Nome</Text>
              <TextInput 
                value={name} 
                onChangeText={setName} 
                style={styles.input}
                placeholder="Digite o nome da refeição"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.label}>Data</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={selectedDate.toLocaleDateString('pt-BR')}
                editable={false}
                placeholder="DD/MM/AAAA"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.label}>Hora</Text>
              <View style={styles.timePickerContainer}>
                <TouchableOpacity 
                  style={styles.timeDisplay}
                  onPress={() => setShowTimePicker(!showTimePicker)}
                >
                  <MaterialCommunityIcons name="clock" size={20} color="#22c55e" style={{ marginRight: 8 }} />
                  <Text style={styles.timeDisplayText}>
                    {formatUTCToLocalTime(timestamp)}
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
                            new Date(timestamp).getUTCHours() === i && styles.hourButtonActive
                          ]}
                          onPress={() => {
                            setTimestamp(createLocalTimeAsUTC(selectedDate, i, new Date(timestamp).getUTCMinutes()));
                          }}
                        >
                          <Text style={[
                            styles.hourButtonText,
                            new Date(timestamp).getUTCHours() === i && styles.hourButtonTextActive
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
                            Math.floor(new Date(timestamp).getUTCMinutes() / 5) * 5 === minute && styles.minuteButtonActive
                          ]}
                          onPress={() => {
                            setTimestamp(createLocalTimeAsUTC(selectedDate, new Date(timestamp).getUTCHours(), minute));
                          }}
                        >
                          <Text style={[
                            styles.minuteButtonText,
                            Math.floor(new Date(timestamp).getUTCMinutes() / 5) * 5 === minute && styles.minuteButtonTextActive
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

              <Text style={styles.label}>Calorias (kcal)</Text>
              <TextInput 
                value={calories} 
                onChangeText={setCalories} 
                keyboardType="numeric" 
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.label}>Carboidratos (g)</Text>
              <TextInput 
                value={carbo} 
                onChangeText={setCarbo} 
                keyboardType="numeric" 
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.label}>Proteínas (g)</Text>
              <TextInput 
                value={protein} 
                onChangeText={setProtein} 
                keyboardType="numeric" 
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.label}>Gorduras (g)</Text>
              <TextInput 
                value={fat} 
                onChangeText={setFat} 
                keyboardType="numeric" 
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#94a3b8"
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>{isEditing ? 'Atualizar' : 'Salvar'}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Custom confirmation dialog */}
      {confirmDeleteVisible && mealToDelete && (
        <View style={styles.modalOverlay}>
          <View style={styles.confirmCard}>
            <MaterialCommunityIcons name="alert-circle" size={48} color="#ef4444" />
            <Text style={styles.confirmTitle}>Remover Refeição?</Text>
            <Text style={styles.confirmMessage}>
              Tem certeza que deseja remover &ldquo;{mealToDelete.name}&rdquo;?{'\n'}
              Esta ação não pode ser desfeita.
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.confirmCancelBtn} onPress={cancelDelete}>
                <Text style={styles.confirmCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmDeleteBtn} onPress={confirmDelete}>
                <Text style={styles.confirmDeleteText}>Remover</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f1f5f9', 
    padding: screenWidth <= 400 ? 16 : 20,
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 20,
    paddingBottom: 8,
  },
  title: { 
    fontSize: 24, 
    fontWeight: '900', 
    marginLeft: 16, 
    color: '#0f172a', 
    flex: 1,
    letterSpacing: -0.5,
  },
  addBtn: { 
    backgroundColor: '#22c55e', 
    paddingVertical: 12, 
    paddingHorizontal: 20, 
    borderRadius: 16,
    shadowColor: '#22c55e',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  addBtnText: { 
    color: '#ffffff', 
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.25,
  },
  mealRow: { 
    backgroundColor: '#ffffff', 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 16, 
    flexDirection: 'row', 
    borderWidth: 1, 
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  mealName: { 
    fontWeight: '900', 
    color: '#0f172a', 
    marginBottom: 6,
    fontSize: 16,
    letterSpacing: -0.25,
  },
  mealMeta: { 
    color: '#475569', 
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  mealMacro: { 
    color: '#64748b', 
    fontSize: 12, 
    marginTop: 8,
    fontWeight: '600',
    letterSpacing: 0.25,
  },
  mealActions: { 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginLeft: 16,
    gap: 12,
  },
  iconBtn: { 
    padding: 12, 
    backgroundColor: '#f8fafc', 
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#64748b',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  presetRow: { 
    marginTop: 8, 
    marginBottom: 12,
    paddingVertical: 4,
  },
  presetChip: { 
    backgroundColor: '#f0f9ff', 
    paddingVertical: 10, 
    paddingHorizontal: 16, 
    borderRadius: 16, 
    marginRight: 12, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bae6fd',
    shadowColor: '#22c55e',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  presetChipText: { 
    fontWeight: '800', 
    color: '#0f172a',
    fontSize: 13,
    letterSpacing: 0.25,
    marginBottom: 2,
  },
  sublabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 16,
    fontWeight: '500',
    letterSpacing: 0.25,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  presetCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  presetIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    alignSelf: 'center',
  },
  presetCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 3,
    letterSpacing: -0.25,
  },
  presetCardDescription: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
    lineHeight: 14,
  },
  presetCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  presetCardCalories: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.25,
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  macroText: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '600',
    letterSpacing: 0.25,
  },
  modalOverlay: { 
    position: 'absolute', 
    left: 0, 
    right: 0, 
    top: 0, 
    bottom: 0, 
    backgroundColor: 'rgba(15,23,42,0.6)', 
    justifyContent: 'center', 
    alignItems: 'center',
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
  modalScroll: {
    maxHeight: '85%',
  },
  modalTitle: { 
    fontSize: 22, 
    fontWeight: '900', 
    marginBottom: 20, 
    color: '#0f172a',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  label: { 
    fontSize: 14, 
    fontWeight: '800', 
    color: '#475569', 
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: { 
    borderWidth: 2, 
    borderColor: '#cbd5e1', 
    borderRadius: 14, 
    padding: 14, 
    marginTop: 0, 
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
  inputDisabled: { 
    opacity: 0.6, 
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  modalActions: { 
    flexDirection: 'row', 
    justifyContent: 'flex-end', 
    marginTop: 24,
    gap: 12,
  },
  cancelBtn: { 
    paddingVertical: 14, 
    paddingHorizontal: 20, 
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
  cancelText: { 
    color: '#374151', 
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.25,
  },
  saveBtn: { 
    paddingVertical: 14, 
    paddingHorizontal: 20, 
    borderRadius: 14, 
    backgroundColor: '#22c55e',
    shadowColor: '#22c55e',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  saveText: { 
    color: '#ffffff', 
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.25,
  },
  // Confirmation dialog styles
  confirmCard: { 
    width: '90%', 
    backgroundColor: '#ffffff', 
    borderRadius: 20, 
    padding: 24, 
    alignItems: 'center',
    borderWidth: 1, 
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 20 },
    shadowRadius: 40,
    elevation: 20,
  },
  confirmTitle: { 
    fontSize: 20, 
    fontWeight: '900', 
    marginTop: 16,
    marginBottom: 12, 
    color: '#0f172a',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  confirmMessage: { 
    fontSize: 15, 
    color: '#64748b', 
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    fontWeight: '500',
  },
  confirmActions: { 
    flexDirection: 'row', 
    gap: 12,
    width: '100%',
  },
  confirmCancelBtn: { 
    flex: 1,
    paddingVertical: 14, 
    paddingHorizontal: 20, 
    borderRadius: 14, 
    backgroundColor: '#f8fafc', 
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
  },
  confirmCancelText: { 
    color: '#374151', 
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.25,
  },
  confirmDeleteBtn: { 
    flex: 1,
    paddingVertical: 14, 
    paddingHorizontal: 20, 
    borderRadius: 14, 
    backgroundColor: '#ef4444',
    alignItems: 'center',
    shadowColor: '#ef4444',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  confirmDeleteText: { 
    color: '#ffffff', 
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.25,
  },
  dateTimeContainer: {
    marginBottom: 16,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateTimeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    padding: 16,
    gap: 12,
    shadowColor: '#64748b',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  dateTimeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    flex: 1,
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
});
