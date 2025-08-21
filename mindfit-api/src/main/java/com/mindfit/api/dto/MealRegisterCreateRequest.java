package com.mindfit.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDateTime;

public record MealRegisterCreateRequest(
        @NotBlank(message = "Name is required")
        String name,
        
        @NotNull(message = "Timestamp is required")
        LocalDateTime timestamp,
        
        @NotNull(message = "Calories is required")
        @Positive(message = "Calories must be positive")
        Integer calories,
        
        @Positive(message = "Carbo must be positive")
        Double carbo,
        
        @Positive(message = "Protein must be positive")
        Double protein,
        
        @Positive(message = "Fat must be positive")
        Double fat
) {}