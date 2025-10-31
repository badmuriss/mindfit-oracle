package com.mindfit.api.dto;

import java.time.LocalDateTime;

public record SensorResponse(
        String id,
        String userId,
        String sensorType,
        String location,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
