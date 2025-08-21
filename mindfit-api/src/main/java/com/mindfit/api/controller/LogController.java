package com.mindfit.api.controller;

import com.mindfit.api.dto.LogCreateRequest;
import com.mindfit.api.dto.LogResponse;
import com.mindfit.api.service.LogService;
import com.mindfit.api.mapper.LogMapper;
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
@RequestMapping("/logs")
@RequiredArgsConstructor
@Tag(name = "Logs", description = "Log management API")
@SecurityRequirement(name = "bearerAuth")
public class LogController {

    private final LogService logService;
    private final LogMapper logMapper;

    @GetMapping
    @Operation(summary = "Get all logs (Admin only)")
    public Page<LogResponse> getAllLogs(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String category,
            Pageable pageable) {

        return logService.findAll(startDate, endDate, type, category, pageable)
                .map(logMapper::toResponse);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get log by ID (Admin only)")
    public LogResponse getLogById(
            @PathVariable String id) {

        return logMapper.toResponse(logService.findById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create new log (Admin only)")
    public LogResponse createLog(
            @Valid @RequestBody LogCreateRequest request) {

        return logMapper.toResponse(logService.create(request));
}
}
