package com.mindfit.api.dto;

import java.time.LocalDateTime;

public record MealRegisterResponse(
        String id,
        String userId,
        String name,
        LocalDateTime timestamp,
        Integer calories,
        Double carbo,
        Double protein,
        Double fat,
        LocalDateTime createdAt
) {}