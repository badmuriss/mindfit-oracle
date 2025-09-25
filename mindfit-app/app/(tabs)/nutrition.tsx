import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, Dimensions, FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { useUser } from '../../components/UserContext';
import { API_ENDPOINTS } from '../../constants/Api';
import { nowUTC, localTimeAsUTC } from '../../utils/dateUtils';
import { searchProcessedFoods, ProcessedFoodItem, debounce } from '../../utils/usdaApi';

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


export default function NutritionScreen() {
  const { token, userId } = useUser();

  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing] = useState(false);
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

  // Food search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProcessedFoodItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Confirmation dialog state
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [mealToDelete, setMealToDelete] = useState<Meal | null>(null);

  // Meal recommendations state
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);
  


  const loadMeals = useCallback(async (date: Date) => {
    if (!token || !userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
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

      const resp = await fetch(`${API_ENDPOINTS.USERS.MEALS(userId)}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!resp.ok) {
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

  // Get meal recommendations (now uses cached endpoint)
  const getMealRecommendations = useCallback(async () => {
    if (!token || !userId) return;

    setLoadingRecommendations(true);
    setRecommendationError(null);

    try {
      // Use new GET endpoint that automatically handles caching
      const response = await fetch(API_ENDPOINTS.USERS.MEAL_RECOMMENDATIONS(userId), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After') || '3600';
          const hours = Math.ceil(parseInt(retryAfter) / 3600);
          throw new Error(`RATE_LIMIT:Limite de recomendações atingido. Tente novamente em ${hours} hora${hours > 1 ? 's' : ''}.`);
        }

        const errorText = await response.text();
        let errorMessage = 'Erro ao buscar sugestões de refeições';

        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.message) {
            errorMessage = errorJson.message;
          }
        } catch (e) {
          console.error(e);
        }

        throw new Error(`GENERAL:${errorMessage}`);
      }

      const data = await response.json();
      setRecommendations(data.recommendations || []);
      setShowRecommendations(true);
    } catch (error) {
      console.error('Error getting meal recommendations:', error);

      const errorMessage = (error as Error).message || 'Unknown error';
      if (errorMessage.startsWith('RATE_LIMIT:')) {
        const message = errorMessage.substring(11);
        setRecommendationError(message);
        showMessage({
          message: message,
          type: 'warning'
        });
      } else {
        const message = errorMessage.startsWith('GENERAL:') ? errorMessage.substring(8) : 'Erro ao buscar sugestões de refeições';
        setRecommendationError(message);
        showMessage({
          message: message,
          type: 'danger'
        });
      }
    } finally {
      setLoadingRecommendations(false);
    }
  }, [token, userId]);

  // Generate new meal recommendations different from current ones
  const generateNewMealRecommendations = useCallback(async () => {
    if (!token || !userId) return;

    setLoadingRecommendations(true);
    setRecommendationError(null);

    try {
      // Send current recommendations to generate different ones
      const requestBody = {
        currentRecommendations: recommendations.map(rec => ({
          name: rec.name,
          description: rec.description,
          estimatedCalories: rec.estimatedCalories,
          estimatedCarbs: rec.estimatedCarbs,
          estimatedProtein: rec.estimatedProtein,
          estimatedFat: rec.estimatedFat
        }))
      };

      const response = await fetch(API_ENDPOINTS.USERS.GENERATE_NEW_MEAL_RECOMMENDATIONS(userId), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        if (response.status === 429) {
          // Rate limit exceeded
          const retryAfter = response.headers.get('Retry-After') || '3600';
          const hours = Math.ceil(parseInt(retryAfter) / 3600);
          throw new Error(`RATE_LIMIT:Você atingiu o limite de gerações. Tente novamente em ${hours} hora${hours > 1 ? 's' : ''}.`);
        }

        const errorText = await response.text();
        let errorMessage = 'Erro ao gerar novas recomendações.';

        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.message) {
            errorMessage = errorJson.message;
          }
        } catch (e) {
          console.error(e);
        }

        throw new Error(`GENERAL:${errorMessage}`);
      }

      const data = await response.json();
      setRecommendations(data.recommendations || []);
      setShowRecommendations(true);
      showMessage({
        message: 'Novas sugestões de refeições geradas!',
        type: 'success'
      });
    } catch (error) {
      console.error('Error generating new meal recommendations:', error);

      const errorMessage = (error as Error).message || 'Unknown error';
      if (errorMessage.startsWith('RATE_LIMIT:')) {
        const message = errorMessage.substring(11); // Remove 'RATE_LIMIT:' prefix
        setRecommendationError(message);
        showMessage({
          message: message,
          type: 'warning'
        });
      } else {
        const message = errorMessage.startsWith('GENERAL:') ? errorMessage.substring(8) : 'Erro ao gerar novas sugestões. Tente novamente.';
        setRecommendationError(message);
        showMessage({
          message: message,
          type: 'danger'
        });
      }
    } finally {
      setLoadingRecommendations(false);
    }
  }, [token, userId, recommendations]);



  useEffect(() => {
    loadMeals(selectedDate);
  }, [loadMeals, selectedDate]);

  const openCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    setName('');
    setCalories('');
    setCarbo('');
    setProtein('');
    setFat('');
    // Set timestamp to selected date with current time
    const now = new Date();
    const newTimestamp = new Date(selectedDate);
    newTimestamp.setHours(now.getHours(), now.getMinutes(), 0, 0);
    setTimestamp(newTimestamp.toISOString());

    // Reset search state
    setSearchQuery('');
    setSearchResults([]);
    setSearchError(null);

    // Reset recommendation state and auto-load recommendations
    setRecommendations([]);
    setShowRecommendations(false);
    setRecommendationError(null);

    setModalVisible(true);

    // Auto-load meal recommendations when modal opens
    setTimeout(() => {
      getMealRecommendations();
    }, 300); // Small delay to ensure modal is visible
  };

  const searchFoods = async (query: string) => {
    if (!query.trim() || query.trim().length < 3) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    
    try {
      const results = await searchProcessedFoods(query.trim(), 20);
      setSearchResults(results);
      
      if (results.length === 0) {
        setSearchError('Nenhum alimento encontrado. Tente outro termo.');
      }
    } catch (error) {
      console.error('Error searching foods:', error);
      
      setSearchError('Erro ao buscar alimentos. ');
      
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Create debounced search function
  const debouncedSearch = debounce(searchFoods, 800);

  const applyFoodItem = (food: ProcessedFoodItem) => {
    setName(food.name + (food.brand ? ` (${food.brand})` : ''));
    setCalories(String(food.calories));
    setCarbo(String(food.carbs));
    setProtein(String(food.protein));
    setFat(String(food.fat));

    // Clear search
    setSearchQuery('');
    setSearchResults([]);
    setSearchError(null);
  };

  // Apply a recommended meal
  const applyRecommendation = (recommendation: any) => {
    setName(recommendation.name || '');
    setCalories(String(recommendation.estimatedCalories || ''));
    setCarbo(String(recommendation.estimatedCarbs || ''));
    setProtein(String(recommendation.estimatedProtein || ''));
    setFat(String(recommendation.estimatedFat || ''));
    setShowRecommendations(false);
    setRecommendations([]);
  };

  const openEdit = (m: Meal) => {
    console.log(nowUTC())
    setIsEditing(true);
    setEditingId((m.apiId || m.id) ?? null);
    setName(m.name);
    // Keep the original timestamp without any timezone conversion
    setTimestamp(m.timestamp || nowUTC());
    setCalories(String(m.calories ?? ''));
    setCarbo(m.carbo != null ? String(m.carbo) : '');
    setProtein(m.protein != null ? String(m.protein) : '');
    setFat(m.fat != null ? String(m.fat) : '');
    
    // Reset search state when editing
    setSearchQuery('');
    setSearchResults([]);
    setSearchError(null);
    
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
        loadMeals(selectedDate);
        return;
      }

      if (resp.status === 404) {
        showMessage({ message: 'Refeição não encontrada no servidor.', type: 'danger' });
        await loadMeals(selectedDate); // refresh list
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

    // Convert local time to UTC time before sending to API
    const utcTimestamp = localTimeAsUTC(timestamp);
    const payload: any = { name: name.trim(), timestamp: utcTimestamp, calories: parseInt(calories, 10) || 0 };
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
      await loadMeals(selectedDate);
    } catch (err) {
      console.log('Error saving meal', err);
      showMessage({ message: 'Erro ao salvar refeição.', type: 'danger' });
    } finally {
      setSaving(false);
    }
  };



  const renderMeal = ({ item }: { item: Meal }) => (
    <View style={styles.mealRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.mealName}>{item.name}</Text>
        <Text style={styles.mealMeta}>{new Date(item.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false })} • {new Date(item.timestamp).toLocaleDateString('pt-BR')} • {item.calories} kcal</Text>
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
          data={meals}
          keyExtractor={(m) => String(m.apiId || m.id || m.timestamp)}
          renderItem={renderMeal}
          refreshing={refreshing}
          onRefresh={() => loadMeals(selectedDate)}
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
              
              {!isEditing && (
                <>
                  <Text style={styles.label}>Buscar Alimentos</Text>
                  <Text style={styles.sublabel}>Digite pelo menos 3 caracteres em inglês para buscar na base USDA</Text>
                  
                  <TextInput
                    value={searchQuery}
                    onChangeText={(text) => {
                      setSearchQuery(text);
                      if (text.length >= 3) {
                        debouncedSearch(text);
                      } else {
                        setSearchResults([]);
                        setSearchError(null);
                      }
                    }}
                    style={styles.searchInput}
                    placeholder="Ex: grilled chicken, brown rice, banana..."
                    placeholderTextColor="#94a3b8"
                  />

                  {/* Search loading */}
                  {isSearching && (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="#22c55e" />
                      <Text style={styles.loadingText}>Buscando alimentos...</Text>
                    </View>
                  )}

                  {/* Search error */}
                  {searchError && !isSearching && (
                    <View style={styles.errorContainer}>
                      <MaterialCommunityIcons name="alert-circle" size={24} color="#ef4444" />
                      <Text style={styles.errorText}>{searchError}</Text>
                    </View>
                  )}

                  {/* Search results */}
                  {!isSearching && !searchError && searchResults.length > 0 && (
                    <>
                      <Text style={styles.label}>Resultados ({searchResults.length})</Text>
                      <View style={styles.foodGrid}>
                        {searchResults.map((food, index) => (
                          <TouchableOpacity
                            key={`${food.fdcId}-${index}`}
                            style={styles.foodCard}
                            onPress={() => applyFoodItem(food)}
                          >
                            <Text style={styles.foodCardTitle} numberOfLines={2}>
                              {food.name}
                            </Text>
                            {food.brand && (
                              <Text style={styles.foodCardBrand} numberOfLines={1}>
                                {food.brand}
                              </Text>
                            )}
                            <Text style={styles.foodCardCalories}>
                              {food.calories} kcal
                            </Text>
                            <View style={styles.macroRow}>
                              <Text style={styles.macroText}>C: {food.carbs}g</Text>
                              <Text style={styles.macroText}>P: {food.protein}g</Text>
                              <Text style={styles.macroText}>G: {food.fat}g</Text>
                            </View>
                            {food.servingSize && (
                              <Text style={styles.foodCardServing}>
                                Por {food.servingSize}
                              </Text>
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    </>
                  )}

                  {/* Empty state when no search query */}
                  {!searchQuery && !isSearching && (
                    <View style={styles.emptySearchContainer}>
                      <MaterialCommunityIcons name="magnify" size={48} color="#cbd5e1" />
                      <Text style={styles.emptySearchText}>Digite para buscar alimentos</Text>
                      <Text style={styles.emptySearchSubtext}>
                        Use termos em inglês para acessar milhares de alimentos da base USDA com informações nutricionais precisas
                      </Text>
                    </View>
                  )}

                  {/* AI Meal Suggestions */}
                  <View style={styles.suggestionSection}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={styles.label}>Sugestões Geradas por IA para vocẽ</Text>
                      {showRecommendations && recommendations.length > 0 && !loadingRecommendations && (
                        <TouchableOpacity
                          style={styles.refreshButton}
                          onPress={generateNewMealRecommendations}
                          disabled={loadingRecommendations}
                        >
                          <MaterialCommunityIcons name="refresh" size={16} color="#0ea5e9" />
                          <Text style={styles.refreshButtonText}>Gerar Novas</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Loading state for recommendations */}
                    {loadingRecommendations && (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color="#22c55e" />
                        <Text style={styles.loadingText}>Carregando sugestões de IA...</Text>
                      </View>
                    )}

                    {/* Recommendation Results */}
                    {!loadingRecommendations && showRecommendations && recommendations.length > 0 && (
                      <View style={styles.recommendationsContainer}>
                        {recommendations.map((rec, index) => (
                          <TouchableOpacity
                            key={index}
                            style={styles.recommendationCard}
                            onPress={() => applyRecommendation(rec)}
                          >
                            <Text style={styles.recommendationName}>{rec.name}</Text>
                            <Text style={styles.recommendationDescription}>
                              {rec.description}
                            </Text>
                            <View style={styles.macroRow}>
                              <Text style={styles.macroText}>Cal: {rec.estimatedCalories}</Text>
                              <Text style={styles.macroText}>C: {rec.estimatedCarbs}g</Text>
                              <Text style={styles.macroText}>P: {rec.estimatedProtein}g</Text>
                              <Text style={styles.macroText}>G: {rec.estimatedFat}g</Text>
                            </View>
                            {rec.suitabilityReason && (
                              <Text style={styles.recommendationReason}>
                                💡 {rec.suitabilityReason}
                              </Text>
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {!loadingRecommendations && recommendationError && (
                      <View style={styles.errorContainer}>
                        <MaterialCommunityIcons name="alert-circle" size={24} color="#ef4444" />
                        <Text style={styles.errorText}>{recommendationError}</Text>
                      </View>
                    )}
                  </View>
                </>
              )}

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
  // AI Recommendations styles
  suggestionSection: {
    marginBottom: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  suggestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#22c55e',
    borderRadius: 14,
    padding: 16,
    gap: 8,
    marginTop: 8,
  },
  suggestionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#22c55e',
    letterSpacing: 0.25,
  },
  recommendationsContainer: {
    marginTop: 16,
    gap: 12,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
    letterSpacing: 0.25,
  },
  recommendationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  recommendationName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
    letterSpacing: 0.25,
  },
  recommendationDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 8,
    fontWeight: '500',
  },
  recommendationReason: {
    fontSize: 12,
    color: '#7c3aed',
    backgroundColor: '#faf5ff',
    padding: 8,
    borderRadius: 8,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginTop: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '600',
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
  // Food search styles
  searchInput: {
    borderWidth: 2,
    borderColor: '#22c55e',
    borderRadius: 14,
    padding: 14,
    marginTop: 0,
    marginBottom: 16,
    backgroundColor: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    shadowColor: '#22c55e',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  emptySearchContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptySearchText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySearchSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  foodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  foodCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
    minHeight: 120,
  },
  foodCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
    letterSpacing: -0.25,
    lineHeight: 16,
  },
  foodCardBrand: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 6,
    fontWeight: '600',
    lineHeight: 14,
  },
  foodCardCalories: {
    fontSize: 14,
    fontWeight: '800',
    color: '#22c55e',
    marginBottom: 6,
    letterSpacing: 0.25,
  },
  foodCardServing: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 4,
    fontWeight: '500',
    letterSpacing: 0.25,
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 12,
    textAlign: 'center',
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#0ea5e9',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 4,
  },
  refreshButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0ea5e9',
    letterSpacing: 0.25,
  },
});
