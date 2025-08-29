package com.mindfit.api.dto;

import com.mindfit.api.model.User;
import com.mindfit.api.enums.Role;
import com.mindfit.api.enums.Sex;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

public record UserDto(
        String id,
        String email,
        String name,
        String password,
        Set<Role> roles,
        String profile,
        Sex sex,
        LocalDate birthDate,
        LocalDateTime lastLogonDate,
        LocalDateTime createdAt
) {}
