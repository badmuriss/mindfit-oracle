package com.mindfit.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProfileGenerationRequest(
        @NotBlank(message = "Observations are required")
        @Size(max = 1000, message = "Observations must be at most 1000 characters")
        String observations
) {}