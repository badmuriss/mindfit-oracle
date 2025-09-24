package com.mindfit.api.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record MealRecommendationRequest(
        @NotNull(message = "Current time is required")
        LocalDateTime currentTime,

        MealType mealType
) {
    public enum MealType {
        BREAKFAST, LUNCH, DINNER, SNACK, AUTO
    }
}