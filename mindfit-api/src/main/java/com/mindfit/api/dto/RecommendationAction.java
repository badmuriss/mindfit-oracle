package com.mindfit.api.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;

public record RecommendationAction(

        @NotBlank
        String type,

        @NotBlank
        String title,

        String description,

        WorkoutRecommendationData workoutData,

        MealRecommendationData mealData,

        LocalDateTime timestamp
) {}