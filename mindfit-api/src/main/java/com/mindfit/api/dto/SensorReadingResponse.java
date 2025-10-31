package com.mindfit.api.dto;

import java.time.LocalDateTime;

public record SensorReadingResponse(
        String id,
        String sensorId,
        Double readingValue,
        String readingType,
        String unit,
        LocalDateTime readingTimestamp
) {}
