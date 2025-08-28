package com.mindfit.api.service;

import com.mindfit.api.dto.JwtResponse;
import com.mindfit.api.dto.LoginRequest;
import com.mindfit.api.dto.UserSignupRequest;
import com.mindfit.api.common.exception.UnauthorizedException;
import com.mindfit.api.mapper.UserMapper;
import com.mindfit.api.model.User;
import com.mindfit.api.enums.Role;
import com.mindfit.api.util.JwtUtil;
import com.mindfit.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.WeekFields;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserMapper userMapper;
    private final UserRepository userRepository;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final LogService logService;

    public JwtResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );
        
        User user = (User) authentication.getPrincipal();
        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRoles());
        
        // Update last login date and potentially generate profile
        updateLastLogonDate(user);
        
        return JwtResponse.of(token, user.getId(), user.getEmail(), user.getRoles());
    }

    public JwtResponse adminLogin(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );
        
        User user = (User) authentication.getPrincipal();
        
        if (!user.getRoles().contains(Role.ADMIN) && !user.getRoles().contains(Role.SUPER_ADMIN)) {
            throw new UnauthorizedException("Admin access required");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRoles());
        
        return JwtResponse.of(token, user.getId(), user.getEmail(), user.getRoles());
    }

    public JwtResponse registerUser(UserSignupRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email already exists");
        }

        User user = userMapper.toEntity(userMapper.toDto(request));
        user.setRoles(Set.of(Role.USER));
        
        user = userRepository.save(user);
        
        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRoles());
        return JwtResponse.of(token, user.getId(), user.getEmail(), user.getRoles());
    }

    public JwtResponse registerAdmin(UserSignupRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email already exists");
        }

        User user = userMapper.toEntity(userMapper.toDto(request));
        user.setRoles(Set.of(Role.ADMIN));
        
        user = userRepository.save(user);
        
        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRoles());
        return JwtResponse.of(token, user.getId(), user.getEmail(), user.getRoles());
    }
    
    private void updateLastLogonDate(User user) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime lastLogOn = user.getLastLogonDate();
        
        // Check if this is first login this week
        if (isFirstLoginThisWeek(lastLogOn, now)) {
            // Profile generation is now handled by ChatbotService on first chat interaction
        }
        
        user.setLastLogonDate(now);
        userRepository.save(user);
    }
    
    private boolean isFirstLoginThisWeek(LocalDateTime lastLogOn, LocalDateTime now) {
        if (lastLogOn == null) {
            return true; // First login ever
        }
        
        WeekFields weekFields = WeekFields.of(Locale.getDefault());
        int currentWeek = now.get(weekFields.weekOfWeekBasedYear());
        int currentYear = now.getYear();
        int lastLogOnWeek = lastLogOn.get(weekFields.weekOfWeekBasedYear());
        int lastLogOnYear = lastLogOn.getYear();
        
        return currentYear != lastLogOnYear || currentWeek != lastLogOnWeek;
    }
}
