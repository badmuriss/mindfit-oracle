package com.mindfit.api.controller;

import com.mindfit.api.dto.JwtResponse;
import com.mindfit.api.dto.LoginRequest;
import com.mindfit.api.dto.UserSignupRequest;
import com.mindfit.api.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Authentication API")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/user/login")
    @Operation(summary = "User login")
    public ResponseEntity<JwtResponse> userLogin(@Valid @RequestBody LoginRequest request) {
        JwtResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/user/signup")
    @Operation(summary = "User signup")
    public ResponseEntity<JwtResponse> userSignup(@Valid @RequestBody UserSignupRequest request) {
        JwtResponse response = authService.registerUser(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/admin/login")
    @Operation(summary = "Admin login")
    public ResponseEntity<JwtResponse> adminLogin(@Valid @RequestBody LoginRequest request) {
        JwtResponse response = authService.adminLogin(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/admin/signup")
    @Operation(summary = "Admin signup")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<JwtResponse> adminSignup(@Valid @RequestBody UserSignupRequest request) {
        JwtResponse response = authService.registerAdmin(request);
        return ResponseEntity.ok(response);
    }
}