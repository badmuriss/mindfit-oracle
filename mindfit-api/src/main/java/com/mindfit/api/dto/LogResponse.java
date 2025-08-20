package com.mindfit.api.dto;

import com.mindfit.api.model.Log;
import com.mindfit.api.enums.LogType;

import java.time.LocalDateTime;

public record LogResponse(
        String id,
        LogType type,
        String category,
        String name,
        String stackTrace,
        LocalDateTime timestamp
) {}