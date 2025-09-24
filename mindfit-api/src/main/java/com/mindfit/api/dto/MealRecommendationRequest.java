package com.mindfit.api.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.List;

public record MealRecommendationRequest(
        @NotNull(message = "Current time is required")
        LocalDateTime currentTime,

        MealType mealType,

        List<CurrentMealRecommendation> currentRecommendations
) {
    public enum MealType {
        BREAKFAST, LUNCH, DINNER, SNACK, AUTO
    }

    public record CurrentMealRecommendation(
        String name,
        String description,
        Integer estimatedCalories,
        Integer estimatedCarbs,
        Integer estimatedProtein,
        Integer estimatedFat
    ) {}
}