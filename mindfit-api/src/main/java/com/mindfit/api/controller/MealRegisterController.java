package com.mindfit.api.controller;

import com.mindfit.api.dto.MealRegisterCreateRequest;
import com.mindfit.api.dto.MealRegisterResponse;
import com.mindfit.api.dto.MealRegisterUpdateRequest;
import com.mindfit.api.service.MealRegisterService;
import com.mindfit.api.mapper.MealRegisterMapper;
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
@RequestMapping("/{userId}/meals")
@RequiredArgsConstructor
@Tag(name = "Meal Registers", description = "Meal register management API")
@SecurityRequirement(name = "bearerAuth")
public class MealRegisterController {

    private final MealRegisterService mealRegisterService;
    private final MealRegisterMapper mealRegisterMapper;

    @GetMapping
    @Operation(summary = "Get all meal registers for user")
    public Page<MealRegisterResponse> getAllMealRegisters(
            @PathVariable String userId,
            Pageable pageable) {
        
        return mealRegisterService.findByUserId(userId, pageable)
                .map(mealRegisterMapper::toResponse);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get meal register by ID")
    public MealRegisterResponse getMealRegisterById(
            @PathVariable String userId,
            @PathVariable String id) {
        return mealRegisterMapper.toResponse(mealRegisterService.findById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create new meal register")
    public MealRegisterResponse createMealRegister(
            @PathVariable String userId,
            @Valid @RequestBody MealRegisterCreateRequest request) {

        return mealRegisterMapper.toResponse(mealRegisterService.create(userId, request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update meal register")
    public MealRegisterResponse updateMealRegister(
            @PathVariable String userId,
            @PathVariable String id,
            @Valid @RequestBody MealRegisterUpdateRequest request) {

        return mealRegisterMapper.toResponse(mealRegisterService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete meal register")
    public void deleteMealRegister(
            @PathVariable String userId,
            @PathVariable String id) {
        mealRegisterService.delete(id);
    }
}
