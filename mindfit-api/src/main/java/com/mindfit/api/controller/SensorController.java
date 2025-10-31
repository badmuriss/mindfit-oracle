package com.mindfit.api.controller;

import com.mindfit.api.dto.SensorCreateRequest;
import com.mindfit.api.dto.SensorResponse;
import com.mindfit.api.dto.SensorUpdateRequest;
import com.mindfit.api.mapper.SensorMapper;
import com.mindfit.api.service.SensorService;
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
@RequestMapping("/users/{userId}/sensors")
@RequiredArgsConstructor
@Tag(name = "Sensors", description = "Sensor management API")
@SecurityRequirement(name = "bearerAuth")
public class SensorController {

    private final SensorService sensorService;
    private final SensorMapper sensorMapper;

    @GetMapping
    @Operation(summary = "Get all sensors for user")
    public Page<SensorResponse> getAllSensors(
            @PathVariable String userId,
            Pageable pageable) {

        return sensorService.findByUserId(userId, pageable)
                .map(sensorMapper::toResponse);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get sensor by ID")
    public SensorResponse getSensorById(
            @PathVariable String userId,
            @PathVariable String id) {
        return sensorMapper.toResponse(sensorService.findById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create new sensor")
    public SensorResponse createSensor(
            @PathVariable String userId,
            @Valid @RequestBody SensorCreateRequest request) {

        return sensorMapper.toResponse(sensorService.create(userId, request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update sensor")
    public SensorResponse updateSensor(
            @PathVariable String userId,
            @PathVariable String id,
            @Valid @RequestBody SensorUpdateRequest request) {

        return sensorMapper.toResponse(sensorService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete sensor")
    public void deleteSensor(
            @PathVariable String userId,
            @PathVariable String id) {
        sensorService.delete(id);
    }
}
