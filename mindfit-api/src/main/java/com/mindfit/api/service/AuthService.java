package com.mindfit.api.service;

import com.mindfit.api.dto.JwtResponse;
import com.mindfit.api.dto.LoginRequest;
import com.mindfit.api.dto.UserSignupRequest;
import com.mindfit.api.common.exception.UnauthorizedException;
import com.mindfit.api.mapper.UserMapper;
import com.mindfit.api.model.MeasurementsRegister;
import com.mindfit.api.model.User;
import com.mindfit.api.enums.Role;
import com.mindfit.api.repository.MeasurementsRegisterRepository;
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
    private final MeasurementsRegisterRepository measurementsRegisterRepository;
    private final ChatbotService chatbotService;

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

        updateLastLogonDate(user);

        // Create initial weight and height measurements
        createInitialMeasurements(user.getId(), request);
        
        // Generate initial profile with observations if provided
        if (request.observations() != null && !request.observations().trim().isEmpty()) {
            try {
                chatbotService.generateUserProfile(user.getId(), request.observations().trim());
            } catch (Exception e) {
                // Log error but don't fail registration
                logService.logError("AUTH_SERVICE", "Failed to generate initial profile", e.getMessage());
            }
        }
        
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
        if (isFirstLogonThisWeek(lastLogOn, now)) {
            chatbotService.generateUserProfile(user.getId(), "");
        }
        
        user.setLastLogonDate(now);
        userRepository.save(user);
    }
    
    private boolean isFirstLogonThisWeek(LocalDateTime lastLogOn, LocalDateTime now) {
        if (lastLogOn == null) {
            return false;
        }
        
        WeekFields weekFields = WeekFields.of(Locale.getDefault());
        int currentWeek = now.get(weekFields.weekOfWeekBasedYear());
        int currentYear = now.getYear();
        int lastLogOnWeek = lastLogOn.get(weekFields.weekOfWeekBasedYear());
        int lastLogOnYear = lastLogOn.getYear();
        
        return currentYear != lastLogOnYear || currentWeek != lastLogOnWeek;
    }
    
    private void createInitialMeasurements(String userId, UserSignupRequest request) {
        try {
            // Create initial measurement record with both weight and height
            if (request.initialWeightInKG() != null || request.initialHeightInCM() != null) {
                MeasurementsRegister measurements = new MeasurementsRegister();

                measurements.setUserId(userId);
                measurements.setWeightInKG(request.initialWeightInKG());
                measurements.setHeightInCM(request.initialHeightInCM());
                measurements.setTimestamp(LocalDateTime.now());

                measurementsRegisterRepository.save(measurements);
            }
        } catch (Exception e) {
            // Log error but don't fail registration
            logService.logError("AUTH_SERVICE", "Failed to create initial measurements", e.getMessage());
        }
    }
}
