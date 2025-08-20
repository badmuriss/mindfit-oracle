package com.mindfit.api.dto;

import com.mindfit.api.model.Log;
import com.mindfit.api.enums.LogType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record LogCreateRequest(
        @NotNull(message = "Type is required")
        LogType type,
        
        @NotBlank(message = "Category is required")
        String category,
        
        @NotBlank(message = "Name is required")
        String name,
        
        String stackTrace,
        
        @NotNull(message = "Timestamp is required")
        LocalDateTime timestamp
) {}