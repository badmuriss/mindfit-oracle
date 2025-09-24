package com.mindfit.api.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDateTime;
import java.util.List;

public record WorkoutRecommendationRequest(
        @NotNull(message = "Current time is required")
        LocalDateTime currentTime,

        @Positive(message = "Available minutes must be positive")
        Integer availableMinutes,

        IntensityLevel preferredIntensity,

        List<CurrentWorkoutRecommendation> currentRecommendations
) {
    public enum IntensityLevel {
        LOW, MEDIUM, HIGH, AUTO
    }

    public record CurrentWorkoutRecommendation(
        String name,
        String description,
        Integer durationMinutes,
        Integer estimatedCaloriesBurn,
        String difficulty,
        List<CurrentExercise> exercises
    ) {}

    public record CurrentExercise(
        String name,
        Integer sets,
        String reps,
        Integer durationSeconds,
        String instructions
    ) {}
}