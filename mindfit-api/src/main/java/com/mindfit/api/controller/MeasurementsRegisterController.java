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
    @Operation(summary = "Get all measurements registers for user with optional date range filtering")
    public Page<MeasurementsRegisterResponse> getAllMeasurementsRegisters(
            @PathVariable String userId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            Pageable pageable) {
        
        return measurementsRegisterService.findByUserId(userId, startDate, endDate, pageable)
                .map(measurementsRegisterMapper::toResponse);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get measurements register by ID")
    public MeasurementsRegisterResponse getMeasurementsRegisterById(
            @PathVariable String userId,
            @PathVariable String id) {
        
        return measurementsRegisterMapper.toResponse(measurementsRegisterService.findById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create new measurements register")
    public MeasurementsRegisterResponse createMeasurementsRegister(
            @PathVariable String userId,
            @Valid @RequestBody MeasurementsRegisterCreateRequest request) {
        
        return measurementsRegisterMapper.toResponse(measurementsRegisterService.create(userId, request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update measurements register")
    public MeasurementsRegisterResponse updateMeasurementsRegister(
            @PathVariable String userId,
            @PathVariable String id,
            @Valid @RequestBody MeasurementsRegisterUpdateRequest request) {
        
        return measurementsRegisterMapper.toResponse(measurementsRegisterService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete measurements register")
    public void deleteMeasurementsRegister(
            @PathVariable String userId,
            @PathVariable String id) {
        
        measurementsRegisterService.delete(id);
    }
}
