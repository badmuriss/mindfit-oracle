package com.mindfit.api.service;

import com.mindfit.api.dto.JwtResponse;
import com.mindfit.api.dto.LoginRequest;
import com.mindfit.api.dto.SignupRequest;
import com.mindfit.api.common.exception.UnauthorizedException;
import com.mindfit.api.model.User;
import com.mindfit.api.enums.Role;
import com.mindfit.api.util.JwtUtil;
import com.mindfit.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    public JwtResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );
        
        User user = (User) authentication.getPrincipal();
        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRoles());
        
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

    public JwtResponse registerUser(SignupRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email already exists");
        }

        User user = new User();
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRoles(Set.of(Role.USER));
        
        user = userRepository.save(user);
        
        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRoles());
        return JwtResponse.of(token, user.getId(), user.getEmail(), user.getRoles());
    }

    public JwtResponse registerAdmin(SignupRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email already exists");
        }

        User user = new User();
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRoles(Set.of(Role.ADMIN));
        
        user = userRepository.save(user);
        
        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRoles());
        return JwtResponse.of(token, user.getId(), user.getEmail(), user.getRoles());
    }
}