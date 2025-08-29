package com.mindfit.api.dto;

import com.mindfit.api.model.User;
import com.mindfit.api.enums.Role;
import com.mindfit.api.enums.Sex;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

public record UserResponse(
        String id,
        String email,
        String name,
        Set<Role> roles,
        Sex sex,
        LocalDate birthDate,
        LocalDateTime lastLogonDate,
        LocalDateTime createdAt
) {}
