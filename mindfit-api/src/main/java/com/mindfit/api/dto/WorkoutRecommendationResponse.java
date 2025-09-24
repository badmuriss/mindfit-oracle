package com.mindfit.api.dto;

import lombok.Builder;

import java.util.List;

@Builder
public record WorkoutRecommendationResponse(
        List<RecommendedWorkout> recommendations,
        String reasoning,
        String optimalTime,
        String intensityRecommendation
) {
    public record RecommendedWorkout(
            String name,
            String description,
            Integer durationMinutes,
            Integer estimatedCaloriesBurn,
            String difficulty,
            List<RecommendedExercise> exercises,
            String suitabilityReason
    ) {}

    public record RecommendedExercise(
            String name,
            String type, // cardio, strength, flexibility
            Integer sets,
            Integer reps,
            Integer durationSeconds,
            String instructions,
            String equipment
    ) {}
}