package com.mindfit.api.controller;

import com.mindfit.api.dto.*;
import com.mindfit.api.service.UserService;
import com.mindfit.api.service.ProfileGenerationService;
import com.mindfit.api.mapper.UserMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User management API")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final UserService userService;
    private final ProfileGenerationService profileGenerationService;
    private final UserMapper userMapper;

    @GetMapping
    @Operation(summary = "Get all users")
    public Page<UserResponse> getAllUsers(Pageable pageable) {
        return userService.findAll(pageable)
                .map(userMapper::toResponse);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get user by ID")
    public UserDetailResponse getUserById(@PathVariable String id) {
        return userMapper.toDetailResponse(userService.findById(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update user")
    public UserResponse updateUser(
            @PathVariable String id,
            @Valid @RequestBody UserUpdateRequest request) {
        return userMapper.toResponse(userService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete user")
    public void deleteUser(@PathVariable String id) {
        userService.delete(id);
    }
    
    @PostMapping("/{id}/generate-profile")
    @Operation(summary = "Generate user profile based on their activity data")
    public UserProfileResponse generateUserProfile(@PathVariable String id) {
        String profile = profileGenerationService.generateUserProfile(id);
        profileGenerationService.updateUserProfile(id, profile);
        return new UserProfileResponse(profile);
    }
}
