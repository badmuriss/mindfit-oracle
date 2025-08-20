package com.mindfit.api.dto;

import java.time.LocalDateTime;

public record MeasurementsRegisterDto(
        String id,
        String userId,
        Double weight,
        Double height,
        LocalDateTime timestamp,
        LocalDateTime createdAt
) {}