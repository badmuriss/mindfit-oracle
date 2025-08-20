package com.mindfit.api.controller;

import com.mindfit.api.dto.MeasurementsRegisterCreateRequest;
import com.mindfit.api.dto.MeasurementsRegisterResponse;
import com.mindfit.api.dto.MeasurementsRegisterUpdateRequest;
import com.mindfit.api.service.MeasurementsRegisterService;
import com.mindfit.api.mapper.MeasurementsRegisterMapper;
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
@RequestMapping("/{userId}/measurements")
@RequiredArgsConstructor
@Tag(name = "Measurements Registers", description = "Measurements register management API")
@SecurityRequirement(name = "bearerAuth")
public class MeasurementsRegisterController {

    private final MeasurementsRegisterService measurementsRegisterService;
    private final MeasurementsRegisterMapper measurementsRegisterMapper;

    @GetMapping
    @Operation(summary = "Get all measurements registers for user")
    public Page<MeasurementsRegisterResponse> getAllMeasurementsRegisters(
            @PathVariable String userId,
            Pageable pageable) {
        
        return measurementsRegisterService.findByUserId(userId, pageable)
                .map(measurementsRegisterMapper::toEntity)
                .map(measurementsRegisterMapper::toResponse);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get measurements register by ID")
    public MeasurementsRegisterResponse getMeasurementsRegisterById(
            @PathVariable String id) {
        
        var measurementsRegisterDto = measurementsRegisterService.findById(id);
        return measurementsRegisterMapper.toResponse(measurementsRegisterMapper.toEntity(measurementsRegisterDto));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create new measurements register")
    public MeasurementsRegisterResponse createMeasurementsRegister(
            @PathVariable String userId,
            @Valid @RequestBody MeasurementsRegisterCreateRequest request) {
        
        var measurementsRegisterDto = measurementsRegisterService.create(userId, request);
        return measurementsRegisterMapper.toResponse(measurementsRegisterMapper.toEntity(measurementsRegisterDto));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update measurements register")
    public MeasurementsRegisterResponse updateMeasurementsRegister(
            @PathVariable String id,
            @Valid @RequestBody MeasurementsRegisterUpdateRequest request) {
        
        var measurementsRegisterDto = measurementsRegisterService.update(id, request);
        return measurementsRegisterMapper.toResponse(measurementsRegisterMapper.toEntity(measurementsRegisterDto));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete measurements register")
    public void deleteMeasurementsRegister(
            @PathVariable String id) {
        
        measurementsRegisterService.delete(id);
    }
}