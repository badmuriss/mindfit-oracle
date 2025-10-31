package com.mindfit.api.dto;

import java.time.LocalDateTime;

public record ExerciseRegisterDto(
        String id,
        String userId,
        String name,
        String description,
        LocalDateTime timestamp,
        Integer durationInMinutes,
        Integer caloriesBurnt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}