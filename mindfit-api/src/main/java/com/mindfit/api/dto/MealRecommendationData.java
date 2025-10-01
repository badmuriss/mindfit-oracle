package com.mindfit.api.dto;

public record MealRecommendationData(
        String name,
        Integer calories,
        Double carbo,
        Double protein,
        Double fat
) {}