package com.mindfit.api.dto;

import com.mindfit.api.enums.Role;

import java.time.LocalDateTime;
import java.util.Set;

public record UserDetailResponse(
        String id,
        String email,
        Set<Role> roles,
        String profile,
        LocalDateTime lastLogonDate,
        LocalDateTime createdAt
) {}
