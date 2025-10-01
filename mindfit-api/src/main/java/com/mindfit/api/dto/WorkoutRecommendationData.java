package com.mindfit.api.dto;

public record WorkoutRecommendationData(
        String name,
        String description,
        Integer durationInMinutes,
        Integer caloriesBurnt
) {}