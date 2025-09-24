package com.mindfit.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDateTime;

public record ExerciseRegisterCreateRequest(
        @NotBlank(message = "Name is required")
        String name,

        String description,

        @NotNull(message = "Timestamp is required")
        LocalDateTime timestamp,
        
        @Positive(message = "Duration must be positive")
        Integer durationInMinutes,
        
        @Positive(message = "Calories burnt must be positive")
        Integer caloriesBurnt
) {}