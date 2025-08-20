package com.mindfit.api.dto;

import jakarta.validation.constraints.Positive;

import java.time.LocalDateTime;

public record ExerciseRegisterUpdateRequest(
        String name,
        String description,
        LocalDateTime timestamp,
        
        @Positive(message = "Duration must be positive")
        Integer duration,
        
        @Positive(message = "Calories burnt must be positive")
        Integer caloriesBurnt
) {}