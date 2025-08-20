package com.mindfit.api.controller;

import com.mindfit.api.dto.UserCreateRequest;
import com.mindfit.api.dto.UserResponse;
import com.mindfit.api.dto.UserUpdateRequest;
import com.mindfit.api.service.UserService;
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
    private final UserMapper userMapper;

    @GetMapping
    @Operation(summary = "Get all users")
    public Page<UserResponse> getAllUsers(Pageable pageable) {
        return userService.findAll(pageable)
                .map(userMapper::toEntity)
                .map(userMapper::toResponse);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get user by ID")
    public UserResponse getUserById(@PathVariable String id) {
        var userDto = userService.findById(id);
        return userMapper.toResponse(userMapper.toEntity(userDto));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create new user")
    public UserResponse createUser(@Valid @RequestBody UserCreateRequest request) {
        var userDto = userService.create(request);
        return userMapper.toResponse(userMapper.toEntity(userDto));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update user")
    public UserResponse updateUser(
            @PathVariable String id,
            @Valid @RequestBody UserUpdateRequest request) {
        var userDto = userService.update(id, request);
        return userMapper.toResponse(userMapper.toEntity(userDto));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete user")
    public void deleteUser(@PathVariable String id) {
        userService.delete(id);
    }
}