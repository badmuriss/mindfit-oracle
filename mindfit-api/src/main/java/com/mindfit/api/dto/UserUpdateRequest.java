package com.mindfit.api.dto;

import com.mindfit.api.model.User;
import com.mindfit.api.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record UserUpdateRequest(
        @Email(message = "Email must be valid")
        String email,
        
        @Size(min = 6, message = "Password must be at least 6 characters")
        String password,
        
        Set<Role> roles
) {}