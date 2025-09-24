# Recommendation Caching & Workout Screen Redesign - Implementation Tracker

## 🎯 Overview
Transform the recommendation system to use smart caching and redesign the workout screen for better user experience.

---

## 📋 Phase 1: Backend - Recommendation Caching System

### 1.1: Create Cache Models
- [ ] Create `MealRecommendationCache` entity (userId, recommendations, generatedAt, expiresAt)
- [ ] Create `WorkoutRecommendationCache` entity (similar structure)
- [ ] Create `MealRecommendationCacheRepository` for MongoDB operations
- [ ] Create `WorkoutRecommendationCacheRepository` for MongoDB operations
- [ ] Add MongoDB indexes for efficient queries (userId, expiresAt)

### 1.2: Enhance RecommendationService
- [ ] Add cache checking logic with 2-hour expiry
- [ ] Create `getCachedMealRecommendations()` method
- [ ] Create `getCachedWorkoutRecommendations()` method
- [ ] Update existing `recommendMeal()` to save to cache after generation
- [ ] Update existing `recommendWorkout()` to save to cache after generation

### 1.3: Create New GET Endpoints
- [ ] Add `GET /users/{id}/meal-recommendations` endpoint in UserController
- [ ] Add `GET /users/{id}/workout-recommendations` endpoint in UserController
- [ ] Remove rate limiting from GET endpoints
- [ ] Keep rate limiting on existing POST endpoints for force generation

---

## 📋 Phase 2: Frontend - Instant Meal Recommendations

### 2.1: Update Nutrition Screen API Integration
- [ ] Replace POST call with GET call to new endpoint in nutrition.tsx
- [ ] Remove manual request body construction
- [ ] Implement automatic loading on modal open
- [ ] Update error handling for GET endpoint

### 2.2: Enhanced UX for Meal Recommendations
- [ ] Add "Refresh Suggestions" button for forcing new recommendations
- [ ] Display cache timestamp ("Sugestões atualizadas há X minutos")
- [ ] Update loading states and UI feedback
- [ ] Test instant loading experience

---

## 📋 Phase 3: Frontend - Workout Screen Redesign

### 3.1: Modify Tab Structure in exercise.tsx
- [ ] Keep "Treinos" and "Histórico" tabs
- [ ] Remove "Sugeridos" tab functionality
- [ ] Add section navigation within Treinos tab
- [ ] Update tab state management

### 3.2: Create Two Sections within Treinos Tab
- [ ] Add "Meus Treinos" section header and navigation
- [ ] Add "Treinos Recomendados" section header and navigation
- [ ] Implement section switching logic (`currentSection: 'my' | 'recommended'`)
- [ ] Add visual separation between sections
- [ ] Update styles for section headers

### 3.3: Meus Treinos Section Features
- [ ] Display user's saved workouts (existing functionality)
- [ ] Keep existing "+" button for custom workouts
- [ ] Keep edit/delete functionality for user workouts
- [ ] Keep "Start Workout" functionality
- [ ] Ensure section shows only user-created workouts

### 3.4: Treinos Recomendados Section Features
- [ ] Auto-load AI recommendations from GET endpoint
- [ ] Display recommended workouts with full details
- [ ] Add "Salvar Treino" button on each recommendation card
- [ ] Keep "Use This Workout" to start immediately
- [ ] Add "Refresh Suggestions" button
- [ ] Add loading states for recommendations
- [ ] Handle empty state when no recommendations available

### 3.5: Save Workout Functionality
- [ ] Implement "Salvar Treino" button click handler
- [ ] POST to create workout in user's collection via API
- [ ] Add saved workout to "Meus Treinos" section locally
- [ ] Show success message when workout is saved
- [ ] Auto-switch to "Meus Treinos" view after saving
- [ ] Handle duplicate workout names gracefully

---

## 📋 Phase 4: API Integration & State Management

### 4.1: Update API Constants
- [ ] Add `MEAL_RECOMMENDATIONS: (userId) => GET endpoint` to Api.ts
- [ ] Add `WORKOUT_RECOMMENDATIONS: (userId) => GET endpoint` to Api.ts
- [ ] Update existing workout creation endpoints if needed

### 4.2: React Native State Management
- [ ] Add `recommendedWorkouts` state to exercise.tsx
- [ ] Add `currentSection: 'my' | 'recommended'` state
- [ ] Add loading states for each section (`loadingMyWorkouts`, `loadingRecommended`)
- [ ] Update existing state management to work with sections
- [ ] Optimize re-render performance with useCallback and useMemo

### 4.3: Workout Operations Implementation
- [ ] Create `loadMyWorkouts()` function (existing exercise API)
- [ ] Create `loadRecommendedWorkouts()` function (new GET endpoint)
- [ ] Create `saveRecommendedWorkout()` function (POST to exercise API)
- [ ] Update existing custom workout creation flow
- [ ] Handle API errors gracefully for all operations

---

## 📋 Phase 5: UX Enhancements & Polish

### 5.1: Visual Design Updates
- [ ] Create distinct styling for section headers within Treinos tab
- [ ] Design special styling for recommendation cards vs user workout cards
- [ ] Style action buttons ("Salvar", "Usar Treino", "Editar") with distinct colors
- [ ] Add visual indicators for cached vs fresh recommendations
- [ ] Update spacing and layout for better visual hierarchy

### 5.2: Smart Interactions
- [ ] Implement auto-refresh logic (suggestions refresh every 2 hours)
- [ ] Add smooth transitions between sections within Treinos tab
- [ ] Implement optimistic updates when saving recommendations
- [ ] Add pull-to-refresh functionality for recommendations

### 5.3: Error Handling & Offline Support
- [ ] Add cache fallback for network failures
- [ ] Implement graceful degradation to static workouts if AI fails
- [ ] Add skeleton screens for better loading experience
- [ ] Handle offline scenarios gracefully
- [ ] Add retry logic for failed API calls

---

## 📋 Phase 6: Testing & Documentation

### 6.1: Functionality Testing
- [ ] Test cache expiry logic (2-hour timeout)
- [ ] Test meal recommendations instant loading
- [ ] Test workout section switching between "Meus" and "Recomendados"
- [ ] Test save recommendation workflow end-to-end
- [ ] Test offline functionality and error scenarios
- [ ] Test performance with large numbers of workouts

### 6.2: User Experience Testing
- [ ] Test smooth transitions and animations
- [ ] Verify loading states and feedback
- [ ] Test cache timestamp display accuracy
- [ ] Verify all button actions work correctly
- [ ] Test edge cases (no recommendations, API failures, etc.)

### 6.3: Final Polish & Documentation
- [ ] Update API documentation for new endpoints
- [ ] Performance optimization review
- [ ] Code review and cleanup
- [ ] Update any relevant documentation

---

## 📊 Progress Tracking

**Overall Progress: 0% Complete**

- **Phase 1**: 0/5 tasks completed (0%)
- **Phase 2**: 0/4 tasks completed (0%)
- **Phase 3**: 0/11 tasks completed (0%)
- **Phase 4**: 0/7 tasks completed (0%)
- **Phase 5**: 0/8 tasks completed (0%)
- **Phase 6**: 0/6 tasks completed (0%)

**Total**: 0/41 tasks completed

---

## 🎯 Key Benefits Expected
1. **⚡ Instant Experience**: Meal recommendations appear immediately
2. **💾 Reduced API Calls**: Smart caching reduces OpenAI usage
3. **🎯 Better UX**: Clear separation between user and AI content within Treinos tab
4. **📱 Intuitive Flow**: Save → Use workflow for recommendations
5. **⚡ Performance**: Faster loading, better perceived performance

---

## 📝 Notes
- Remember to test thoroughly after each phase
- Keep user experience smooth during implementation
- Monitor API usage and performance improvements
- Update this file as tasks are completed (mark with [x])