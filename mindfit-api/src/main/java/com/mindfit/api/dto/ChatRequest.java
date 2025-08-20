package com.mindfit.api.dto;

import jakarta.validation.constraints.NotBlank;

public record ChatRequest(
        @NotBlank(message = "Prompt is required")
        String prompt
) {}