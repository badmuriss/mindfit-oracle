package com.mindfit.api.dto;

import com.mindfit.api.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.Set;

@Schema(name = "UserCreateRequest", description = "Payload to create a new user")
public record UserCreateRequest(
        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        @Schema(description = "Unique email address", example = "user@example.com")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        @Schema(description = "Initial password (min 6 characters)", example = "s3cretPass")
        String password,

        @Size(max = 100, message = "Name must be at most 100 characters")
        @Schema(description = "Display name (optional)", example = "Alex Johnson")
        String name,

        @Schema(description = "Assigned roles", example = "[\"USER\"]")
        Set<Role> roles
) {}
