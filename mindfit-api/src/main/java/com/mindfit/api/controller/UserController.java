package com.mindfit.api.controller;

import com.mindfit.api.dto.*;
import com.mindfit.api.service.UserService;
import com.mindfit.api.service.ChatbotService;
import com.mindfit.api.service.RateLimitService;
import com.mindfit.api.service.RecommendationService;
import com.mindfit.api.mapper.UserMapper;
import com.mindfit.api.common.exception.BadRequestException;
import com.mindfit.api.common.exception.RateLimitExceededException;
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
    private final ChatbotService chatbotService;
    private final RateLimitService rateLimitService;
    private final RecommendationService recommendationService;
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
    @Operation(summary = "Generate user profile based on observations and user data")
    public UserProfileResponse generateUserProfile(
            @PathVariable String id,
            @Valid @RequestBody ProfileGenerationRequest request) {

        // Rate limiting: 5 profile generations per hour per user
        if (!rateLimitService.createBucketForProfileGeneration(id).tryConsume(1)) {
            throw new BadRequestException("Rate limit exceeded. Please try again later.");
        }

        String profile = chatbotService.generateUserProfile(id, request.observations());
        return new UserProfileResponse(profile);
    }

    @GetMapping("/{id}/meal-recommendations")
    @Operation(summary = "Get cached meal recommendations or generate new ones if cache is expired")
    public MealRecommendationResponse getMealRecommendations(@PathVariable String id) {
        return recommendationService.getCachedMealRecommendations(id);
    }

    @GetMapping("/{id}/workout-recommendations")
    @Operation(summary = "Get cached workout recommendations or generate new ones if cache is expired")
    public WorkoutRecommendationResponse getWorkoutRecommendations(@PathVariable String id) {
        return recommendationService.getCachedWorkoutRecommendations(id);
    }

    @PostMapping("/{id}/meal-recommendations/generate")
    @Operation(summary = "Generate new meal recommendations different from current ones")
    public MealRecommendationResponse generateNewMealRecommendations(
            @PathVariable String id,
            @RequestBody(required = false) MealRecommendationRequest request) {

        // Rate limiting: 15 meal recommendation generations per hour per user
        if (!rateLimitService.createBucketForMealRecommendations(id).tryConsume(1)) {
            throw new RateLimitExceededException(
                "Rate limit exceeded for user " + id,
                "Limite de solicitações excedido. Você pode gerar até 15 novas recomendações de refeição por hora. Tente novamente mais tarde.",
                3600 // 1 hour in seconds
            );
        }

        return recommendationService.generateNewMealRecommendations(id, request);
    }

    @PostMapping("/{id}/workout-recommendations/generate")
    @Operation(summary = "Generate new workout recommendations different from current ones")
    public WorkoutRecommendationResponse generateNewWorkoutRecommendations(
            @PathVariable String id,
            @RequestBody(required = false) WorkoutRecommendationRequest request) {

        // Rate limiting: 15 workout recommendation generations per hour per user
        if (!rateLimitService.createBucketForWorkoutRecommendations(id).tryConsume(1)) {
            throw new RateLimitExceededException(
                "Rate limit exceeded for user " + id,
                "Limite de solicitações excedido. Você pode gerar até 15 novas recomendações de treino por hora. Tente novamente mais tarde.",
                3600 // 1 hour in seconds
            );
        }

        return recommendationService.generateNewWorkoutRecommendations(id, request);
    }
}
