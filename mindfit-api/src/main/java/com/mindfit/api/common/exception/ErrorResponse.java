package com.mindfit.api.common.exception;

import java.time.LocalDateTime;

public record ErrorResponse(
        String message,
        String error,
        int status,
        String path,
        LocalDateTime timestamp
) {
    public static ErrorResponse of(String message, String error, int status, String path) {
        return new ErrorResponse(message, error, status, path, LocalDateTime.now());
    }
}