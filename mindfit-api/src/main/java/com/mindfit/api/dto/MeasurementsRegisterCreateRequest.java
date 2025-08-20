package com.mindfit.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDateTime;

public record MeasurementsRegisterCreateRequest(
        @Positive(message = "Weight must be positive")
        Double weight,

        @Positive(message = "Height must be positive")
        Double height,
        
        @NotNull(message = "Timestamp is required")
        LocalDateTime timestamp
) {}