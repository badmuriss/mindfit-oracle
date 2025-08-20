package com.mindfit.api.dto;

import java.time.LocalDateTime;

public record ExerciseRegisterDto(
        String id,
        String userId,
        String name,
        String description,
        LocalDateTime timestamp,
        Integer duration,
        Integer caloriesBurnt,
        LocalDateTime createdAt
) {}