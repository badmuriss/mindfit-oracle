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
                .map(mealRegisterMapper::toEntity)
                .map(mealRegisterMapper::toResponse);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get meal register by ID")
    public MealRegisterResponse getMealRegisterById(@PathVariable String id) {
        var mealRegisterDto = mealRegisterService.findById(id);
        return mealRegisterMapper.toResponse(mealRegisterMapper.toEntity(mealRegisterDto));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create new meal register")
    public MealRegisterResponse createMealRegister(
            @PathVariable String userId,
            @Valid @RequestBody MealRegisterCreateRequest request) {
        
        var mealRegisterDto = mealRegisterService.create(userId, request);
        return mealRegisterMapper.toResponse(mealRegisterMapper.toEntity(mealRegisterDto));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update meal register")
    public MealRegisterResponse updateMealRegister(
            @PathVariable String id,
            @Valid @RequestBody MealRegisterUpdateRequest request) {
        
        var mealRegisterDto = mealRegisterService.update(id, request);
        return mealRegisterMapper.toResponse(mealRegisterMapper.toEntity(mealRegisterDto));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete meal register")
    public void deleteMealRegister(@PathVariable String id) {
        mealRegisterService.delete(id);
    }
}