package com.mindfit.api.dto;

import java.time.LocalDateTime;

public record MeasurementsRegisterDto(
        String id,
        String userId,
        Double weightInKG,
        Integer heightInCM,
        LocalDateTime timestamp,
        LocalDateTime createdAt
) {}