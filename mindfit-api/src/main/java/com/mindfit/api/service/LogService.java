package com.mindfit.api.service;

import com.mindfit.api.common.exception.ResourceNotFoundException;
import com.mindfit.api.common.exception.BadRequestException;
import com.mindfit.api.common.exception.UnauthorizedException;
import com.mindfit.api.util.SecurityUtil;
import com.mindfit.api.dto.LogCreateRequest;
import com.mindfit.api.dto.LogDto;
import com.mindfit.api.enums.LogType;
import com.mindfit.api.model.Log;
import com.mindfit.api.repository.LogRepository;
import com.mindfit.api.mapper.LogMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;


@Slf4j
@Service
@RequiredArgsConstructor
public class LogService {

    private final LogRepository logRepository;
    private final LogMapper logMapper;

    public Page<LogDto> findAll(Pageable pageable) {
        return findAll(null, null, pageable);
    }

    public Page<LogDto> findAll(String startDate, String endDate, Pageable pageable) {
        return findAll(startDate, endDate, null, null, pageable);
    }

    public Page<LogDto> findAll(String startDate, String endDate, String type, String category, Pageable pageable) {
        if (!SecurityUtil.isAdmin()) {
            throw new UnauthorizedException("Only admins can view logs");
        }

        LogType logType = null;
        if (type != null && !type.isBlank()) {
            try {
                logType = LogType.valueOf(type.trim().toUpperCase());
            } catch (IllegalArgumentException ex) {
                throw new BadRequestException("Invalid log type: " + type + ". Valid: ERROR, WARNING, INFO");
            }
        }

        boolean hasDates = startDate != null && endDate != null;
        if (hasDates) {
            LocalDateTime start = LocalDateTime.parse(startDate + "T00:00:00");
            LocalDateTime end = LocalDateTime.parse(endDate + "T23:59:59");

            if (logType != null && category != null && !category.isBlank()) {
                return logRepository.findByTypeAndCategoryAndTimestampBetween(logType, category, start, end, pageable)
                        .map(logMapper::toDto);
            }
            if (logType != null) {
                return logRepository.findByTypeAndTimestampBetween(logType, start, end, pageable)
                        .map(logMapper::toDto);
            }
            if (category != null && !category.isBlank()) {
                return logRepository.findByCategoryAndTimestampBetween(category, start, end, pageable)
                        .map(logMapper::toDto);
            }
            return logRepository.findByTimestampBetween(start, end, pageable)
                    .map(logMapper::toDto);
        }

        if (logType != null && category != null && !category.isBlank()) {
            return logRepository.findByTypeAndCategory(logType, category, pageable)
                    .map(logMapper::toDto);
        }
        if (logType != null) {
            return logRepository.findByType(logType, pageable)
                    .map(logMapper::toDto);
        }
        if (category != null && !category.isBlank()) {
            return logRepository.findByCategory(category, pageable)
                    .map(logMapper::toDto);
        }

        return logRepository.findAll(pageable).map(logMapper::toDto);
    }

    public LogDto findById(String id) {
        if (!SecurityUtil.isAdmin()) {
            throw new UnauthorizedException("Only admins can view logs");
        }
        
        Log log = logRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Log not found with id: " + id));
        
        return logMapper.toDto(log);
    }

    public void logApiCall(String endpoint, String method, String details) {
        try {
            LogCreateRequest request = new LogCreateRequest(
                LogType.INFO,
                "API",
                method + " " + endpoint,
                details,
                LocalDateTime.now()
            );
            // Cria o registro sem checagem de admin para permitir log automatizado
            logRepository.save(logMapper.toEntity(request));
        } catch (Exception e) {
            log.error("Failed to log API call: {}", e.getMessage(), e);
        }
    }
    
    public void logError(String category, String name, String stackTrace) {
        try {
            LogCreateRequest request = new LogCreateRequest(
                LogType.ERROR,
                category,
                name,
                stackTrace,
                LocalDateTime.now()
            );
            // Cria o registro sem checagem de admin para permitir log automatizado
            logRepository.save(logMapper.toEntity(request));
        } catch (Exception e) {
            log.error("Failed to log error: {}", e.getMessage(), e);
        }
    }
    
    public void logWarning(String category, String name, String details) {
        try {
            LogCreateRequest request = new LogCreateRequest(
                LogType.WARNING,
                category,
                name,
                details,
                LocalDateTime.now()
            );
            // Cria o registro sem checagem de admin para permitir log automatizado
            logRepository.save(logMapper.toEntity(request));
        } catch (Exception e) {
            log.error("Failed to log warning: {}", e.getMessage(), e);
        }
    }
}
