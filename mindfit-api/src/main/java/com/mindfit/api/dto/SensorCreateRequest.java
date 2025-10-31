package com.mindfit.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SensorCreateRequest(
        @NotBlank(message = "Sensor type is required")
        @Size(max = 50, message = "Sensor type must not exceed 50 characters")
        String sensorType,

        @Size(max = 100, message = "Location must not exceed 100 characters")
        String location
) {}
