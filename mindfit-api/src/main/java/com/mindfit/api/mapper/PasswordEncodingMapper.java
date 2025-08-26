package com.mindfit.api.mapper;

import lombok.RequiredArgsConstructor;
import org.mapstruct.Named;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PasswordEncodingMapper {

    private final PasswordEncoder passwordEncoder;
    
    @Named("encodePassword")
    public String encodePassword(String password) {
        if (password == null || password.trim().isEmpty()) {
            return null;
        }
        return passwordEncoder.encode(password);
    }
}