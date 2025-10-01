package com.mindfit.api.dto;

public record RecommendationAction(
        String type, // "ADD_WORKOUT" or "ADD_MEAL"
        String title,
        String description,
        WorkoutRecommendationData workoutData, // Optional
        MealRecommendationData mealData // Optional
) {}