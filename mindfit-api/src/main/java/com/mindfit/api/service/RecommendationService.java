package com.mindfit.api.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mindfit.api.dto.*;
import com.mindfit.api.model.User;
import com.mindfit.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final OpenAiChatModel openAiChatModel;
    private final UserRepository userRepository;
    private final MealRegisterService mealRegisterService;
    private final ExerciseRegisterService exerciseRegisterService;
    private final MeasurementsRegisterService measurementsRegisterService;
    private final LogService logService;
    private final ObjectMapper objectMapper;

    public MealRecommendationResponse recommendMeal(String userId, MealRecommendationRequest request) {
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                return MealRecommendationResponse.builder()
                        .recommendations(List.of())
                        .reasoning("User not found")
                        .build();
            }

            String mealPrompt = buildMealPrompt(user, request);

            OpenAiChatOptions options = OpenAiChatOptions.builder()
                    .temperature(0.3)
                    .maxTokens(800)
                    .build();

            Prompt prompt = new Prompt(
                    List.of(new UserMessage(mealPrompt)),
                    options
            );

            var aiResponse = openAiChatModel.call(prompt);
            String response = aiResponse.getResult().getOutput().getText();

            MealRecommendationResponse mealResponse = parseMealRecommendation(response);

            // Save to cache for future requests (store in user entity)
            try {
                String cacheJson = objectMapper.writeValueAsString(mealResponse);
                user.setMealRecommendationsCache(cacheJson);
                user.setMealCacheExpiry(LocalDateTime.now().plusHours(2)); // 2-hour expiry
                userRepository.save(user);
                logService.logApiCall("RECOMMENDATION_SERVICE", "CACHE_SAVE", "Saved meal recommendation to cache for user: " + userId);
            } catch (Exception e) {
                logService.logError("RECOMMENDATION_SERVICE", "Failed to save meal recommendation to cache", e.getMessage());
            }

            return mealResponse;

        } catch (Exception e) {
            logService.logError("RECOMMENDATION_SERVICE", "Failed to generate meal recommendation", e.getMessage());
            return MealRecommendationResponse.builder()
                    .recommendations(List.of())
                    .reasoning("Failed to generate recommendation: " + e.getMessage())
                    .build();
        }
    }

    public WorkoutRecommendationResponse recommendWorkout(String userId, WorkoutRecommendationRequest request) {
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                return WorkoutRecommendationResponse.builder()
                        .recommendations(List.of())
                        .reasoning("User not found")
                        .build();
            }

            String workoutPrompt = buildWorkoutPrompt(user, request);

            OpenAiChatOptions options = OpenAiChatOptions.builder()
                    .temperature(0.3)
                    .maxTokens(1000)
                    .build();

            Prompt prompt = new Prompt(
                    List.of(new UserMessage(workoutPrompt)),
                    options
            );

            var aiResponse = openAiChatModel.call(prompt);
            String response = aiResponse.getResult().getOutput().getText();

            WorkoutRecommendationResponse workoutResponse = parseWorkoutRecommendation(response);

            // Save to cache for future requests (store in user entity)
            try {
                String cacheJson = objectMapper.writeValueAsString(workoutResponse);
                user.setWorkoutRecommendationsCache(cacheJson);
                user.setWorkoutCacheExpiry(LocalDateTime.now().plusHours(2)); // 2-hour expiry
                userRepository.save(user);
                logService.logApiCall("RECOMMENDATION_SERVICE", "CACHE_SAVE", "Saved workout recommendation to cache for user: " + userId);
            } catch (Exception e) {
                logService.logError("RECOMMENDATION_SERVICE", "Failed to save workout recommendation to cache", e.getMessage());
            }

            return workoutResponse;

        } catch (Exception e) {
            logService.logError("RECOMMENDATION_SERVICE", "Failed to generate workout recommendation", e.getMessage());
            return WorkoutRecommendationResponse.builder()
                    .recommendations(List.of())
                    .reasoning("Failed to generate recommendation: " + e.getMessage())
                    .build();
        }
    }

    private String buildMealPrompt(User user, MealRecommendationRequest request) {
        StringBuilder promptBuilder = new StringBuilder();

        promptBuilder.append("You are a nutrition expert. Generate personalized meal recommendations in JSON format.\n\n");

        // Add user context
        promptBuilder.append("USER CONTEXT:\n");
        promptBuilder.append("Name: ").append(user.getName()).append("\n");
        if (user.getProfile() != null && !user.getProfile().trim().isEmpty()) {
            promptBuilder.append("Profile: ").append(user.getProfile()).append("\n");
        }

        // Add current time context
        String timeOfDay = getTimeOfDay(request.currentTime());
        promptBuilder.append("Current Time: ").append(request.currentTime().format(DateTimeFormatter.ofPattern("HH:mm")))
                .append(" (").append(timeOfDay).append(")\n");

        // Add meal type
        String mealType = determineMealType(request);
        promptBuilder.append("Meal Type: ").append(mealType).append("\n\n");

        // Add recent meal history
        addRecentMealHistory(promptBuilder, user.getId());

        // Add recent measurements for calorie guidance
        addRecentMeasurements(promptBuilder, user.getId());

        promptBuilder.append("\nTASK: Generate 2-3 meal recommendations suitable for ").append(mealType.toLowerCase())
                .append(" at ").append(timeOfDay).append(".\n\n");

        promptBuilder.append("RESPONSE FORMAT (JSON):\n");
        promptBuilder.append("{\n");
        promptBuilder.append("  \"recommendations\": [\n");
        promptBuilder.append("    {\n");
        promptBuilder.append("      \"name\": \"Meal Name\",\n");
        promptBuilder.append("      \"description\": \"Brief description\",\n");
        promptBuilder.append("      \"estimatedCalories\": 500,\n");
        promptBuilder.append("      \"estimatedCarbs\": 50,\n");
        promptBuilder.append("      \"estimatedProtein\": 25,\n");
        promptBuilder.append("      \"estimatedFat\": 15,\n");
        promptBuilder.append("      \"preparationTime\": \"15 minutes\",\n");
        promptBuilder.append("      \"ingredients\": [\"ingredient1\", \"ingredient2\"],\n");
        promptBuilder.append("      \"suitabilityReason\": \"Why this meal fits the user's profile and time\"\n");
        promptBuilder.append("    }\n");
        promptBuilder.append("  ],\n");
        promptBuilder.append("  \"reasoning\": \"Overall reasoning for recommendations\",\n");
        promptBuilder.append("  \"optimalTime\": \"Best time to eat based on user's patterns\"\n");
        promptBuilder.append("}\n\n");

        promptBuilder.append("ANSWER IN BRAZILIAN PORTUGUESE. Respond only with valid JSON. No additional text.");

        return promptBuilder.toString();
    }

    private String buildWorkoutPrompt(User user, WorkoutRecommendationRequest request) {
        StringBuilder promptBuilder = new StringBuilder();

        promptBuilder.append("You are a fitness expert. Generate personalized workout recommendations in JSON format.\n\n");

        // Add user context
        promptBuilder.append("USER CONTEXT:\n");
        promptBuilder.append("Name: ").append(user.getName()).append("\n");
        if (user.getProfile() != null && !user.getProfile().trim().isEmpty()) {
            promptBuilder.append("Profile: ").append(user.getProfile()).append("\n");
        }

        // Add current time context
        String timeOfDay = getTimeOfDay(request.currentTime());
        promptBuilder.append("Current Time: ").append(request.currentTime().format(DateTimeFormatter.ofPattern("HH:mm")))
                .append(" (").append(timeOfDay).append(")\n");

        promptBuilder.append("Available Time: ").append(request.availableMinutes()).append(" minutes\n");

        String intensity = request.preferredIntensity() != null ?
                request.preferredIntensity().toString() : "AUTO";
        promptBuilder.append("Preferred Intensity: ").append(intensity).append("\n\n");

        // Add recent exercise history
        addRecentExerciseHistory(promptBuilder, user.getId());

        // Add recent measurements for fitness guidance
        addRecentMeasurements(promptBuilder, user.getId());

        promptBuilder.append("\nTASK: Generate 1-2 workout recommendations suitable for ")
                .append(timeOfDay).append(" with ").append(request.availableMinutes()).append(" minutes available.\n\n");

        promptBuilder.append("RESPONSE FORMAT (JSON):\n");
        promptBuilder.append("{\n");
        promptBuilder.append("  \"recommendations\": [\n");
        promptBuilder.append("    {\n");
        promptBuilder.append("      \"name\": \"Workout Name\",\n");
        promptBuilder.append("      \"description\": \"Brief description\",\n");
        promptBuilder.append("      \"durationMinutes\": 30,\n");
        promptBuilder.append("      \"estimatedCaloriesBurn\": 250,\n");
        promptBuilder.append("      \"difficulty\": \"Medium\",\n");
        promptBuilder.append("      \"exercises\": [\n");
        promptBuilder.append("        {\n");
        promptBuilder.append("          \"name\": \"Exercise Name\",\n");
        promptBuilder.append("          \"type\": \"cardio/strength/flexibility\",\n");
        promptBuilder.append("          \"sets\": 3,\n");
        promptBuilder.append("          \"reps\": 12,\n");
        promptBuilder.append("          \"durationSeconds\": 60,\n");
        promptBuilder.append("          \"instructions\": \"How to perform\",\n");
        promptBuilder.append("          \"equipment\": \"none/dumbbells/etc\"\n");
        promptBuilder.append("        }\n");
        promptBuilder.append("      ],\n");
        promptBuilder.append("      \"suitabilityReason\": \"Why this workout fits the user's profile and time\"\n");
        promptBuilder.append("    }\n");
        promptBuilder.append("  ],\n");
        promptBuilder.append("  \"reasoning\": \"Overall reasoning for recommendations\",\n");
        promptBuilder.append("  \"optimalTime\": \"Best time to workout based on user's patterns\",\n");
        promptBuilder.append("  \"intensityRecommendation\": \"Recommended intensity for this time of day\"\n");
        promptBuilder.append("}\n\n");

        promptBuilder.append("ANSWER IN BRAZILIAN PORTUGUESE. Respond only with valid JSON. No additional text.");

        return promptBuilder.toString();
    }

    private void addRecentMealHistory(StringBuilder promptBuilder, String userId) {
        try {
            var meals = mealRegisterService.findByUserId(userId, PageRequest.of(0, 10));
            if (meals.hasContent()) {
                promptBuilder.append("RECENT MEALS:\n");
                meals.getContent().forEach(meal -> {
                    promptBuilder.append("- ").append(meal.name())
                            .append(" (").append(meal.calories()).append(" kcal, at ")
                            .append(meal.timestamp().format(DateTimeFormatter.ofPattern("HH:mm")))
                            .append(")\n");
                });
                promptBuilder.append("\n");
            }
        } catch (Exception e) {
            // Continue without meal history
        }
    }

    private void addRecentExerciseHistory(StringBuilder promptBuilder, String userId) {
        try {
            var exercises = exerciseRegisterService.findByUserId(userId, PageRequest.of(0, 8));
            if (exercises.hasContent()) {
                promptBuilder.append("RECENT EXERCISES:\n");
                exercises.getContent().forEach(exercise -> {
                    promptBuilder.append("- ").append(exercise.name());
                    if (exercise.durationInMinutes() != null) {
                        promptBuilder.append(" (").append(exercise.durationInMinutes()).append(" min");
                    }
                    promptBuilder.append(", at ").append(exercise.timestamp().format(DateTimeFormatter.ofPattern("HH:mm")))
                            .append(")\n");
                });
                promptBuilder.append("\n");
            }
        } catch (Exception e) {
            // Continue without exercise history
        }
    }

    private void addRecentMeasurements(StringBuilder promptBuilder, String userId) {
        try {
            var measurements = measurementsRegisterService.findByUserId(userId, PageRequest.of(0, 3));
            if (measurements.hasContent()) {
                var latest = measurements.getContent().get(0);
                promptBuilder.append("LATEST MEASUREMENTS:\n");
                promptBuilder.append("Weight: ").append(latest.weightInKG()).append(" kg");
                if (latest.heightInCM() != null) {
                    promptBuilder.append(", Height: ").append(latest.heightInCM()).append(" cm");
                }
                promptBuilder.append("\n\n");
            }
        } catch (Exception e) {
            // Continue without measurements
        }
    }

    private String getTimeOfDay(LocalDateTime time) {
        int hour = time.getHour();
        if (hour < 6) return "early morning";
        if (hour < 12) return "morning";
        if (hour < 17) return "afternoon";
        if (hour < 21) return "evening";
        return "night";
    }

    private String determineMealType(MealRecommendationRequest request) {
        if (request.mealType() != null && request.mealType() != MealRecommendationRequest.MealType.AUTO) {
            return request.mealType().toString();
        }

        // Auto-determine based on time
        int hour = request.currentTime().getHour();
        if (hour < 10) return "BREAKFAST";
        if (hour < 15) return "LUNCH";
        if (hour < 19) return "DINNER";
        return "SNACK";
    }

    private MealRecommendationResponse parseMealRecommendation(String jsonResponse) {
        try {
            // Clean up the response to ensure it's valid JSON
            String cleanJson = jsonResponse.trim();
            if (cleanJson.startsWith("```json")) {
                cleanJson = cleanJson.substring(7);
            }
            if (cleanJson.endsWith("```")) {
                cleanJson = cleanJson.substring(0, cleanJson.length() - 3);
            }
            cleanJson = cleanJson.trim();

            TypeReference<MealRecommendationResponse> typeRef = new TypeReference<MealRecommendationResponse>() {};
            return objectMapper.readValue(cleanJson, typeRef);

        } catch (JsonProcessingException e) {
            logService.logError("RECOMMENDATION_SERVICE", "Failed to parse meal recommendation JSON", e.getMessage());

            return MealRecommendationResponse.builder()
                    .recommendations(List.of())
                    .reasoning("Unable to parse AI response: " + jsonResponse)
                    .build();
        }
    }

    private WorkoutRecommendationResponse parseWorkoutRecommendation(String jsonResponse) {
        try {
            // Clean up the response to ensure it's valid JSON
            String cleanJson = jsonResponse.trim();
            if (cleanJson.startsWith("```json")) {
                cleanJson = cleanJson.substring(7);
            }
            if (cleanJson.endsWith("```")) {
                cleanJson = cleanJson.substring(0, cleanJson.length() - 3);
            }
            cleanJson = cleanJson.trim();

            TypeReference<WorkoutRecommendationResponse> typeRef = new TypeReference<WorkoutRecommendationResponse>() {};
            return objectMapper.readValue(cleanJson, typeRef);

        } catch (JsonProcessingException e) {
            logService.logError("RECOMMENDATION_SERVICE", "Failed to parse workout recommendation JSON", e.getMessage());

            return WorkoutRecommendationResponse.builder()
                    .recommendations(List.of())
                    .reasoning("Unable to parse AI response: " + jsonResponse)
                    .build();
        }
    }

    /**
     * Get cached meal recommendations or generate new ones if cache is expired/missing
     * @param userId The user ID
     * @return Cached or freshly generated meal recommendations
     */
    public MealRecommendationResponse getCachedMealRecommendations(String userId) {
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                return MealRecommendationResponse.builder()
                        .recommendations(List.of())
                        .reasoning("User not found")
                        .build();
            }

            // Check if cache is valid (exists and not expired)
            if (user.getMealRecommendationsCache() != null &&
                user.getMealCacheExpiry() != null &&
                LocalDateTime.now().isBefore(user.getMealCacheExpiry())) {

                try {
                    // Deserialize cached recommendations
                    MealRecommendationResponse cachedResponse = objectMapper.readValue(
                        user.getMealRecommendationsCache(),
                        MealRecommendationResponse.class
                    );
                    logService.logApiCall("RECOMMENDATION_SERVICE", "CACHE_HIT", "Retrieved meal recommendations from cache for user: " + userId);
                    return cachedResponse;
                } catch (JsonProcessingException e) {
                    logService.logError("RECOMMENDATION_SERVICE", "Failed to deserialize cached meal recommendations", e.getMessage());
                    // Fall through to generate new recommendations
                }
            }

            // If no valid cache exists, generate new recommendations with auto meal type
            MealRecommendationRequest request = new MealRecommendationRequest(LocalDateTime.now(), MealRecommendationRequest.MealType.AUTO);
            return recommendMeal(userId, request);

        } catch (Exception e) {
            logService.logError("RECOMMENDATION_SERVICE", "Failed to get cached meal recommendations", e.getMessage());
            return MealRecommendationResponse.builder()
                    .recommendations(List.of())
                    .reasoning("Failed to retrieve recommendations: " + e.getMessage())
                    .build();
        }
    }

    /**
     * Get cached workout recommendations or generate new ones if cache is expired/missing
     * @param userId The user ID
     * @return Cached or freshly generated workout recommendations
     */
    public WorkoutRecommendationResponse getCachedWorkoutRecommendations(String userId) {
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                return WorkoutRecommendationResponse.builder()
                        .recommendations(List.of())
                        .reasoning("User not found")
                        .build();
            }

            // Check if cache is valid (exists and not expired)
            if (user.getWorkoutRecommendationsCache() != null &&
                user.getWorkoutCacheExpiry() != null &&
                LocalDateTime.now().isBefore(user.getWorkoutCacheExpiry())) {

                try {
                    // Deserialize cached recommendations
                    WorkoutRecommendationResponse cachedResponse = objectMapper.readValue(
                        user.getWorkoutRecommendationsCache(),
                        WorkoutRecommendationResponse.class
                    );
                    logService.logApiCall("RECOMMENDATION_SERVICE", "CACHE_HIT", "Retrieved workout recommendations from cache for user: " + userId);
                    return cachedResponse;
                } catch (JsonProcessingException e) {
                    logService.logError("RECOMMENDATION_SERVICE", "Failed to deserialize cached workout recommendations", e.getMessage());
                    // Fall through to generate new recommendations
                }
            }

            // If no valid cache exists, generate new recommendations with auto settings
            WorkoutRecommendationRequest request = new WorkoutRecommendationRequest(
                LocalDateTime.now(),
                30, // Default 30 minutes
                WorkoutRecommendationRequest.IntensityLevel.AUTO
            );
            return recommendWorkout(userId, request);

        } catch (Exception e) {
            logService.logError("RECOMMENDATION_SERVICE", "Failed to get cached workout recommendations", e.getMessage());
            return WorkoutRecommendationResponse.builder()
                    .recommendations(List.of())
                    .reasoning("Failed to retrieve recommendations: " + e.getMessage())
                    .build();
        }
    }

    /**
     * Clear cache for a specific user (useful for testing or user data cleanup)
     * @param userId The user ID
     */
    public void clearUserCache(String userId) {
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                user.setMealRecommendationsCache(null);
                user.setMealCacheExpiry(null);
                user.setWorkoutRecommendationsCache(null);
                user.setWorkoutCacheExpiry(null);
                userRepository.save(user);
                logService.logApiCall("RECOMMENDATION_SERVICE", "CACHE_CLEAR", "Cleared recommendation cache for user: " + userId);
            }
        } catch (Exception e) {
            logService.logError("RECOMMENDATION_SERVICE", "Failed to clear cache for user: " + userId, e.getMessage());
        }
    }

    /**
     * Get cache status for a user (useful for debugging and UI indicators)
     * @param userId The user ID
     * @return Cache status information
     */
    public CacheStatus getCacheStatus(String userId) {
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                return new CacheStatus(false, null, false, null);
            }

            boolean mealCacheValid = user.getMealRecommendationsCache() != null &&
                                   user.getMealCacheExpiry() != null &&
                                   LocalDateTime.now().isBefore(user.getMealCacheExpiry());

            boolean workoutCacheValid = user.getWorkoutRecommendationsCache() != null &&
                                      user.getWorkoutCacheExpiry() != null &&
                                      LocalDateTime.now().isBefore(user.getWorkoutCacheExpiry());

            return new CacheStatus(
                mealCacheValid,
                user.getMealCacheExpiry(),
                workoutCacheValid,
                user.getWorkoutCacheExpiry()
            );
        } catch (Exception e) {
            logService.logError("RECOMMENDATION_SERVICE", "Failed to get cache status for user: " + userId, e.getMessage());
            return new CacheStatus(false, null, false, null);
        }
    }

    // Helper record for cache status
    public record CacheStatus(
        boolean mealCacheValid,
        LocalDateTime mealCacheGeneratedAt,
        boolean workoutCacheValid,
        LocalDateTime workoutCacheGeneratedAt
    ) {}
}