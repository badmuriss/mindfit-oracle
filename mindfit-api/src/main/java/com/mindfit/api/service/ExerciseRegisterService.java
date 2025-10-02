package com.mindfit.api.service;

import com.mindfit.api.common.exception.ResourceNotFoundException;
import com.mindfit.api.common.exception.UnauthorizedException;
import com.mindfit.api.dto.ExerciseRegisterCreateRequest;
import com.mindfit.api.dto.ExerciseRegisterDto;
import com.mindfit.api.dto.ExerciseRegisterUpdateRequest;
import com.mindfit.api.model.ExerciseRegister;
import com.mindfit.api.repository.ExerciseRegisterRepository;
import com.mindfit.api.mapper.ExerciseRegisterMapper;
import com.mindfit.api.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;


@Service
@RequiredArgsConstructor
public class ExerciseRegisterService {

    private final ExerciseRegisterRepository exerciseRegisterRepository;
    private final ExerciseRegisterMapper exerciseRegisterMapper;

    public Page<ExerciseRegisterDto> findByUserId(String userId, String startDate, String endDate, Pageable pageable) {
        if (!SecurityUtil.isAdmin() && !userId.equals(SecurityUtil.getCurrentUserId())) {
            throw new UnauthorizedException("Users can only view their own exercise registers");
        }
        
        if (startDate != null && endDate != null) {
            LocalDateTime start = LocalDateTime.parse(startDate + "T00:00:00");
            LocalDateTime end = LocalDateTime.parse(endDate + "T23:59:59");
            return exerciseRegisterRepository.findByUserIdAndTimestampBetween(userId, start, end, pageable)
                    .map(exerciseRegisterMapper::toDto);
        }
        
        return exerciseRegisterRepository.findByUserId(userId, pageable)
                .map(exerciseRegisterMapper::toDto);
    }
    
    public Page<ExerciseRegisterDto> findByUserId(String userId, Pageable pageable) {
        return findByUserId(userId, null, null, pageable);
    }

    public ExerciseRegisterDto findById(String id) {
        ExerciseRegister exerciseRegister = exerciseRegisterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Exercise register not found with id: " + id));
        
        if (!SecurityUtil.isAdmin() && !exerciseRegister.getUserId().equals(SecurityUtil.getCurrentUserId())) {
            throw new UnauthorizedException("Users can only view their own exercise registers");
        }
        
        return exerciseRegisterMapper.toDto(exerciseRegister);
    }

    public ExerciseRegisterDto create(String userId, ExerciseRegisterCreateRequest request) {
        if (!SecurityUtil.isAdmin() && !userId.equals(SecurityUtil.getCurrentUserId())) {
            throw new UnauthorizedException("Users can only create their own exercise registers");
        }

        ExerciseRegister exerciseRegister = exerciseRegisterMapper.toEntity(request);
        exerciseRegister.setUserId(userId);

        // Define a data/hora atual quando não for informada
        if (exerciseRegister.getTimestamp() == null) {
            exerciseRegister.setTimestamp(LocalDateTime.now());
        }

        return exerciseRegisterMapper.toDto(exerciseRegisterRepository.save(exerciseRegister));
    }

    public ExerciseRegisterDto update(String id, ExerciseRegisterUpdateRequest request) {
        ExerciseRegister exerciseRegister = exerciseRegisterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Exercise register not found with id: " + id));
        
        if (!SecurityUtil.isAdmin() && !exerciseRegister.getUserId().equals(SecurityUtil.getCurrentUserId())) {
            throw new UnauthorizedException("Users can only update their own exercise registers");
        }
        
        exerciseRegisterMapper.updateEntity(request, exerciseRegister);
        exerciseRegister = exerciseRegisterRepository.save(exerciseRegister);

        return exerciseRegisterMapper.toDto(exerciseRegister);
    }

    public void delete(String id) {
        ExerciseRegister exerciseRegister = exerciseRegisterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Exercise register not found with id: " + id));
        
        if (!SecurityUtil.isAdmin() && !exerciseRegister.getUserId().equals(SecurityUtil.getCurrentUserId())) {
            throw new UnauthorizedException("Users can only delete their own exercise registers");
        }
        
        exerciseRegisterRepository.deleteById(id);
    }
}