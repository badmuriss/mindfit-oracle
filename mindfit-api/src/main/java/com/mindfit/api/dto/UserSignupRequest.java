package com.mindfit.api.dto;

import com.mindfit.api.enums.Sex;
import com.mindfit.api.validation.ValidAge;
import jakarta.validation.constraints.*;

import java.time.LocalDate;

public record UserSignupRequest(
        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        String email,
        
        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        String password,
        
        @NotBlank(message = "Name is required")
        @Size(max = 100, message = "Name must be at most 100 characters")
        String name,
        
        @NotNull(message = "Sex is required")
        Sex sex,
        
        @NotNull(message = "Birth date is required")
        @ValidAge(message = "Age must be between 13 and 120 years")
        LocalDate birthDate,

        // Dados físicos iniciais informados no cadastro
        @NotNull(message = "Initial weight is required")
        @Positive(message = "Weight must be positive")
        Double initialWeightInKG,

        @NotNull(message = "Initial height is required")
        @Positive(message = "Height must be positive")
        Integer initialHeightInCM,

        // Observações livres como condições, preferências, restrições etc.
        String observations
) {}
