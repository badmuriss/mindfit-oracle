package com.mindfit.api.controller;

import com.mindfit.api.dto.SensorReadingCreateRequest;
import com.mindfit.api.dto.SensorReadingResponse;
import com.mindfit.api.mapper.SensorReadingMapper;
import com.mindfit.api.service.SensorReadingService;
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
@RequestMapping("/sensors/{sensorId}/readings")
@RequiredArgsConstructor
@Tag(name = "Sensor Readings", description = "Sensor reading management API")
@SecurityRequirement(name = "bearerAuth")
public class SensorReadingController {

    private final SensorReadingService sensorReadingService;
    private final SensorReadingMapper sensorReadingMapper;

    @GetMapping
    @Operation(summary = "Get all readings for sensor with optional date range filtering")
    public Page<SensorReadingResponse> getAllReadings(
            @PathVariable String sensorId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            Pageable pageable) {

        return sensorReadingService.findBySensorId(sensorId, startDate, endDate, pageable)
                .map(sensorReadingMapper::toResponse);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get sensor reading by ID")
    public SensorReadingResponse getReadingById(
            @PathVariable String sensorId,
            @PathVariable String id) {
        return sensorReadingMapper.toResponse(sensorReadingService.findById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create new sensor reading")
    public SensorReadingResponse createReading(
            @PathVariable String sensorId,
            @Valid @RequestBody SensorReadingCreateRequest request) {

        return sensorReadingMapper.toResponse(sensorReadingService.create(sensorId, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete sensor reading")
    public void deleteReading(
            @PathVariable String sensorId,
            @PathVariable String id) {
        sensorReadingService.delete(id);
    }
}
