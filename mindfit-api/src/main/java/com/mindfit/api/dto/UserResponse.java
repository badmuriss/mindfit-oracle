package com.mindfit.api.dto;

import com.mindfit.api.model.User;
import com.mindfit.api.enums.Role;

import java.time.LocalDateTime;
import java.util.Set;

public record UserResponse(
        String id,
        String email,
        Set<Role> roles,
        String profile,
        LocalDateTime lastLogOnDate,
        LocalDateTime createdAt
) {}