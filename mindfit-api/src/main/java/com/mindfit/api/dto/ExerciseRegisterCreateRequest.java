package com.mindfit.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

import java.time.LocalDateTime;

public record ExerciseRegisterCreateRequest(
        @NotBlank(message = "Name is required")
        String name,

        String description,
        
        LocalDateTime timestamp,
        
        @Positive(message = "Duration must be positive")
        Integer durationInMinutes,
        
        @Positive(message = "Calories burnt must be positive")
        Integer caloriesBurnt
) {}