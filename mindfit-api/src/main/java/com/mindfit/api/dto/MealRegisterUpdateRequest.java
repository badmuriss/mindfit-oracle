package com.mindfit.api.dto;

import jakarta.validation.constraints.Positive;

import java.time.LocalDateTime;

public record MealRegisterUpdateRequest(
        String name,
        LocalDateTime timestamp,
        
        @Positive(message = "Calories must be positive")
        Integer calories,
        
        @Positive(message = "Carbo must be positive")
        Double carbo,
        
        @Positive(message = "Protein must be positive")
        Double protein,
        
        @Positive(message = "Fat must be positive")
        Double fat
) {}