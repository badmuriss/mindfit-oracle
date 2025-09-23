package com.mindfit.api.controller;

import com.mindfit.api.dto.LogResponse;
import com.mindfit.api.service.LogService;
import com.mindfit.api.mapper.LogMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/logs")
@RequiredArgsConstructor
@Tag(name = "Logs", description = "Log management API")
public class LogController {

    private final LogService logService;
    private final LogMapper logMapper;

    @GetMapping
    @Operation(summary = "Get all logs")
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
    @Operation(summary = "Get log by ID")
    public LogResponse getLogById(
            @PathVariable String id) {

        return logMapper.toResponse(logService.findById(id));
    }

}
