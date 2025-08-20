package com.mindfit.api.dto;

import jakarta.validation.constraints.Positive;

import java.time.LocalDateTime;

public record MeasurementsRegisterUpdateRequest(
        @Positive(message = "Weight must be positive")
        Double weight,
        
        @Positive(message = "Height must be positive")
        Double height,
        
        LocalDateTime timestamp
) {}