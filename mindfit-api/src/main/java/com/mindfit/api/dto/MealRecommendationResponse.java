package com.mindfit.api.dto;

import lombok.Builder;

import java.util.List;

@Builder
public record MealRecommendationResponse(
        List<RecommendedMeal> recommendations,
        String reasoning,
        String optimalTime
) {
    public record RecommendedMeal(
            String name,
            String description,
            Integer estimatedCalories,
            Integer estimatedCarbs,
            Integer estimatedProtein,
            Integer estimatedFat,
            String preparationTime,
            List<String> ingredients,
            String suitabilityReason
    ) {}
}