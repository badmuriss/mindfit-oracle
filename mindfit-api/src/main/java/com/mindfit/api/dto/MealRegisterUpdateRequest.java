package com.mindfit.api.dto;

import jakarta.validation.constraints.Positive;

import java.time.LocalDateTime;

public record MealRegisterUpdateRequest(
        String name,
        LocalDateTime timestamp,
        
        @Positive(message = "Calories must be positive")
        Integer calories
) {}