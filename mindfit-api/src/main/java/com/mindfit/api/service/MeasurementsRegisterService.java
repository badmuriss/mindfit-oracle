package com.mindfit.api.service;

import com.mindfit.api.common.exception.ResourceNotFoundException;
import com.mindfit.api.common.exception.UnauthorizedException;
import com.mindfit.api.dto.MeasurementsRegisterCreateRequest;
import com.mindfit.api.dto.MeasurementsRegisterDto;
import com.mindfit.api.dto.MeasurementsRegisterUpdateRequest;
import com.mindfit.api.model.MeasurementsRegister;
import com.mindfit.api.repository.MeasurementsRegisterRepository;
import com.mindfit.api.mapper.MeasurementsRegisterMapper;
import com.mindfit.api.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MeasurementsRegisterService {

    private final MeasurementsRegisterRepository measurementsRegisterRepository;
    private final MeasurementsRegisterMapper measurementsRegisterMapper;

    public Page<MeasurementsRegisterDto> findByUserId(String userId, Pageable pageable) {
        String currentUserId = SecurityUtil.getCurrentUserId();
        boolean isAdmin = SecurityUtil.isAdmin();
        
        if (!isAdmin && !userId.equals(currentUserId)) {
            throw new UnauthorizedException("Users can only view their own measurements registers");
        }
        
        return measurementsRegisterRepository.findByUserId(userId, pageable)
                .map(measurementsRegisterMapper::toDto);
    }

    public MeasurementsRegisterDto findById(String id) {
        String currentUserId = SecurityUtil.getCurrentUserId();
        boolean isAdmin = SecurityUtil.isAdmin();
        
        MeasurementsRegister measurementsRegister = measurementsRegisterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Measurements register not found with id: " + id));
        
        if (!isAdmin && !measurementsRegister.getUserId().equals(currentUserId)) {
            throw new UnauthorizedException("Users can only view their own measurements registers");
        }
        
        return measurementsRegisterMapper.toDto(measurementsRegister);
    }

    public MeasurementsRegisterDto create(String userId, MeasurementsRegisterCreateRequest request) {
        String currentUserId = SecurityUtil.getCurrentUserId();
        boolean isAdmin = SecurityUtil.isAdmin();
        
        if (!isAdmin && !userId.equals(currentUserId)) {
            throw new UnauthorizedException("Users can only create their own measurements registers");
        }

        MeasurementsRegister measurementsRegister = measurementsRegisterMapper.toEntity(request);
        measurementsRegister.setUserId(userId);

        return measurementsRegisterMapper.toDto(measurementsRegisterRepository.save(measurementsRegister));
    }

    public MeasurementsRegisterDto update(String id, MeasurementsRegisterUpdateRequest request) {
        String currentUserId = SecurityUtil.getCurrentUserId();
        boolean isAdmin = SecurityUtil.isAdmin();
        
        MeasurementsRegister measurementsRegister = measurementsRegisterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Measurements register not found with id: " + id));
        
        if (!isAdmin && !measurementsRegister.getUserId().equals(currentUserId)) {
            throw new UnauthorizedException("Users can only update their own measurements registers");
        }
        
        measurementsRegisterMapper.updateEntity(request, measurementsRegister);
        measurementsRegister = measurementsRegisterRepository.save(measurementsRegister);
        
        return measurementsRegisterMapper.toDto(measurementsRegister);
    }

    public void delete(String id) {
        String currentUserId = SecurityUtil.getCurrentUserId();
        boolean isAdmin = SecurityUtil.isAdmin();
        
        MeasurementsRegister measurementsRegister = measurementsRegisterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Measurements register not found with id: " + id));
        
        if (!isAdmin && !measurementsRegister.getUserId().equals(currentUserId)) {
            throw new UnauthorizedException("Users can only delete their own measurements registers");
        }
        
        measurementsRegisterRepository.deleteById(id);
    }
}