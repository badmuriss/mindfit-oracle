package com.mindfit.api.dto;

import java.time.LocalDateTime;

public record MealRegisterResponse(
        String id,
        String userId,
        String name,
        LocalDateTime timestamp,
        Integer calories,
        LocalDateTime createdAt
) {}