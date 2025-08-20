package com.mindfit.api.dto;

import com.mindfit.api.model.User;
import com.mindfit.api.enums.Role;

import java.util.Set;

public record JwtResponse(
        String token,
        String type,
        String id,
        String email,
        Set<Role> roles
) {
    public static JwtResponse of(String token, String id, String email, Set<Role> roles) {
        return new JwtResponse(token, "Bearer", id, email, roles);
    }
}