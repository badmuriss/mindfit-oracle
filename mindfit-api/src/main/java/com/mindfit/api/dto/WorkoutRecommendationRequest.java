package com.mindfit.api.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDateTime;

public record WorkoutRecommendationRequest(
        @NotNull(message = "Current time is required")
        LocalDateTime currentTime,

        @Positive(message = "Available minutes must be positive")
        Integer availableMinutes,

        IntensityLevel preferredIntensity
) {
    public enum IntensityLevel {
        LOW, MEDIUM, HIGH, AUTO
    }
}