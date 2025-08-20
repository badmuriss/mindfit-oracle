package com.mindfit.api.service;

import com.mindfit.api.common.exception.ResourceNotFoundException;
import com.mindfit.api.common.exception.UnauthorizedException;
import com.mindfit.api.dto.LogCreateRequest;
import com.mindfit.api.dto.LogDto;
import com.mindfit.api.model.Log;
import com.mindfit.api.repository.LogRepository;
import com.mindfit.api.mapper.LogMapper;
import com.mindfit.api.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
public class LogService {

    private final LogRepository logRepository;
    private final LogMapper logMapper;

    public Page<LogDto> findAll(Pageable pageable) {
        if (!SecurityUtil.isAdmin()) {
            throw new UnauthorizedException("Only admins can view logs");
        }
        
        return logRepository.findAll(pageable)
                .map(logMapper::toDto);
    }

    public LogDto findById(String id) {
        if (!SecurityUtil.isAdmin()) {
            throw new UnauthorizedException("Only admins can view logs");
        }
        
        Log log = logRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Log not found with id: " + id));
        
        return logMapper.toDto(log);
    }

    public LogDto create(LogCreateRequest request) {
        if (!SecurityUtil.isAdmin()) {
            throw new UnauthorizedException("Only admins can create logs");
        }

        return logMapper.toDto(logRepository.save(logMapper.toEntity(request)));
    }
}