package com.mindfit.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record SensorReadingCreateRequest(
        @NotNull(message = "Reading value is required")
        Double readingValue,

        @NotBlank(message = "Reading type is required")
        @Size(max = 50, message = "Reading type must not exceed 50 characters")
        String readingType,

        @Size(max = 20, message = "Unit must not exceed 20 characters")
        String unit,

        LocalDateTime readingTimestamp
) {}
