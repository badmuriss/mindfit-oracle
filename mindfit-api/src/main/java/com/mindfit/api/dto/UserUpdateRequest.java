package com.mindfit.api.dto;

import com.mindfit.api.enums.Sex;
import com.mindfit.api.validation.ValidAge;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDate;

@Schema(name = "UserUpdateRequest", description = "Payload to update user profile information")
public record UserUpdateRequest(
        @Email(message = "Email must be valid")
        @Schema(description = "New email (optional)", example = "new.email@example.com")
        String email,

        @Size(min = 6, message = "Password must be at least 6 characters")
        @Schema(description = "New password (optional)", example = "n3wPassw0rd")
        String password,

        @Size(max = 100, message = "Name must be at most 100 characters")
        @Schema(description = "Display name (optional)", example = "Alex Johnson")
        String name,

        @Schema(description = "User sex (optional)", example = "FEMALE")
        Sex sex,

        @ValidAge(message = "Age must be between 13 and 120 years")
        @Schema(description = "Birth date (optional)", example = "1990-01-15")
        LocalDate birthDate
) {}
