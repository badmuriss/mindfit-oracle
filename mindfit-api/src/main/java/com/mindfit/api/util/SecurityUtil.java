package com.mindfit.api.util;

import com.mindfit.api.model.User;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class SecurityUtil {
    
    public static User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("No authenticated user found");
        }
        
        Object principal = authentication.getPrincipal();
        if (!(principal instanceof User)) {
            throw new IllegalStateException("Authenticated principal is not a User");
        }
        
        return (User) principal;
    }
    
    public static String getCurrentUserId() {
        return getCurrentUser().getId();
    }
    
    public static boolean isCurrentUser(String userId) {
        return getCurrentUserId().equals(userId);
    }
    
    public static boolean isAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof User user) {
            return user.getRoles().stream()
                    .anyMatch(role -> role.name().equals("ADMIN") || role.name().equals("SUPER_ADMIN"));
        }

        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(auth -> auth.equals("ROLE_ADMIN") || auth.equals("ROLE_SUPER_ADMIN"));
    }

    public static boolean isSuperAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof User user) {
            return user.getRoles().stream()
                    .anyMatch(role -> role.name().equals("SUPER_ADMIN"));
        }

        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(auth -> auth.equals("ROLE_SUPER_ADMIN"));
    }

    public static boolean isRegularAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof User user) {
            return user.getRoles().stream()
                    .anyMatch(role -> role.name().equals("ADMIN")) &&
                   !isSuperAdmin();
        }

        boolean isAdminAuthority = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(auth -> auth.equals("ROLE_ADMIN"));
        return isAdminAuthority && !isSuperAdmin();
    }
}