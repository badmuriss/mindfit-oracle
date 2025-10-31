package com.mindfit.api.dto;

import java.time.LocalDateTime;

public record SensorDto(
        String id,
        String userId,
        String sensorType,
        String location,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
