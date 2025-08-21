package com.mindfit.api.controller;

import com.mindfit.api.dto.ExerciseRegisterCreateRequest;
import com.mindfit.api.dto.ExerciseRegisterResponse;
import com.mindfit.api.dto.ExerciseRegisterUpdateRequest;
import com.mindfit.api.service.ExerciseRegisterService;
import com.mindfit.api.mapper.ExerciseRegisterMapper;
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
@RequestMapping("/{userId}/exercises")
@RequiredArgsConstructor
@Tag(name = "Exercise Registers", description = "Exercise register management API")
@SecurityRequirement(name = "bearerAuth")
public class ExerciseRegisterController {

    private final ExerciseRegisterService exerciseRegisterService;
    private final ExerciseRegisterMapper exerciseRegisterMapper;

    @GetMapping
    @Operation(summary = "Get all exercise registers for user")
    public Page<ExerciseRegisterResponse> getAllExerciseRegisters(
            @PathVariable String userId,
            Pageable pageable) {
        
        return exerciseRegisterService.findByUserId(userId, pageable)
                .map(exerciseRegisterMapper::toResponse);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get exercise register by ID")
    public ExerciseRegisterResponse getExerciseRegisterById(
            @PathVariable String userId,
            @PathVariable String id) {

        return exerciseRegisterMapper.toResponse(exerciseRegisterService.findById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create new exercise register")
    public ExerciseRegisterResponse createExerciseRegister(
            @PathVariable String userId,
            @Valid @RequestBody ExerciseRegisterCreateRequest request) {

        return exerciseRegisterMapper.toResponse(exerciseRegisterService.create(userId, request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update exercise register")
    public ExerciseRegisterResponse updateExerciseRegister(
            @PathVariable String userId,
            @PathVariable String id,
            @Valid @RequestBody ExerciseRegisterUpdateRequest request) {

        return exerciseRegisterMapper.toResponse(exerciseRegisterService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete exercise register")
    public void deleteExerciseRegister(
            @PathVariable String userId,
            @PathVariable String id) {
        
        exerciseRegisterService.delete(id);
    }
}
