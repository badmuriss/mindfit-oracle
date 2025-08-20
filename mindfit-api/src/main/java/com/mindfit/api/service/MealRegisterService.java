package com.mindfit.api.service;

import com.mindfit.api.common.exception.ResourceNotFoundException;
import com.mindfit.api.common.exception.UnauthorizedException;
import com.mindfit.api.dto.MealRegisterCreateRequest;
import com.mindfit.api.dto.MealRegisterDto;
import com.mindfit.api.dto.MealRegisterUpdateRequest;
import com.mindfit.api.model.MealRegister;
import com.mindfit.api.repository.MealRegisterRepository;
import com.mindfit.api.mapper.MealRegisterMapper;
import com.mindfit.api.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
public class MealRegisterService {

    private final MealRegisterRepository mealRegisterRepository;
    private final MealRegisterMapper mealRegisterMapper;

    public Page<MealRegisterDto> findByUserId(String userId, Pageable pageable) {
        if (!SecurityUtil.isAdmin() && !userId.equals(SecurityUtil.getCurrentUserId())) {
            throw new UnauthorizedException("Users can only view their own meal registers");
        }
        
        return mealRegisterRepository.findByUserId(userId, pageable)
                .map(mealRegisterMapper::toDto);
    }

    public MealRegisterDto findById(String id) {
        MealRegister mealRegister = mealRegisterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Meal register not found with id: " + id));
        
        if (!SecurityUtil.isAdmin() && !mealRegister.getUserId().equals(SecurityUtil.getCurrentUserId())) {
            throw new UnauthorizedException("Users can only view their own meal registers");
        }
        
        return mealRegisterMapper.toDto(mealRegister);
    }

    public MealRegisterDto create(String userId, MealRegisterCreateRequest request) {
        if (!SecurityUtil.isAdmin() && !userId.equals(SecurityUtil.getCurrentUserId())) {
            throw new UnauthorizedException("Users can only create their own meal registers");
        }
        
        MealRegister mealRegister = mealRegisterMapper.toEntity(request);
        mealRegister.setUserId(userId);
        mealRegister = mealRegisterRepository.save(mealRegister);
        
        return mealRegisterMapper.toDto(mealRegister);
    }

    public MealRegisterDto update(String id, MealRegisterUpdateRequest request) {
        MealRegister mealRegister = mealRegisterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Meal register not found with id: " + id));
        
        if (!SecurityUtil.isAdmin() && !mealRegister.getUserId().equals(SecurityUtil.getCurrentUserId())) {
            throw new UnauthorizedException("Users can only update their own meal registers");
        }
        
        mealRegisterMapper.updateEntity(request, mealRegister);
        mealRegister = mealRegisterRepository.save(mealRegister);
        
        return mealRegisterMapper.toDto(mealRegister);
    }

    public void delete(String id) {
        MealRegister mealRegister = mealRegisterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Meal register not found with id: " + id));
        
        if (!SecurityUtil.isAdmin() && !mealRegister.getUserId().equals(SecurityUtil.getCurrentUserId())) {
            throw new UnauthorizedException("Users can only delete their own meal registers");
        }
        
        mealRegisterRepository.deleteById(id);
    }
}