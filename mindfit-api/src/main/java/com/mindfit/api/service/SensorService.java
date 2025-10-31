package com.mindfit.api.service;

import com.mindfit.api.common.exception.ResourceNotFoundException;
import com.mindfit.api.common.exception.UnauthorizedException;
import com.mindfit.api.dto.SensorCreateRequest;
import com.mindfit.api.dto.SensorDto;
import com.mindfit.api.dto.SensorUpdateRequest;
import com.mindfit.api.mapper.SensorMapper;
import com.mindfit.api.model.Sensor;
import com.mindfit.api.repository.SensorRepository;
import com.mindfit.api.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SensorService {

    private final SensorRepository sensorRepository;
    private final SensorMapper sensorMapper;

    public Page<SensorDto> findByUserId(String userId, Pageable pageable) {
        if (!SecurityUtil.isAdmin() && !userId.equals(SecurityUtil.getCurrentUserId())) {
            throw new UnauthorizedException("Users can only view their own sensors");
        }

        return sensorRepository.findByUserId(userId, pageable)
                .map(sensorMapper::toDto);
    }

    public SensorDto findById(String id) {
        Sensor sensor = sensorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sensor not found with id: " + id));

        if (!SecurityUtil.isAdmin() && !sensor.getUserId().equals(SecurityUtil.getCurrentUserId())) {
            throw new UnauthorizedException("Users can only view their own sensors");
        }

        return sensorMapper.toDto(sensor);
    }

    public SensorDto create(String userId, SensorCreateRequest request) {
        if (!SecurityUtil.isAdmin() && !userId.equals(SecurityUtil.getCurrentUserId())) {
            throw new UnauthorizedException("Users can only create their own sensors");
        }

        Sensor sensor = sensorMapper.toEntity(request);
        sensor.setUserId(userId);
        sensor = sensorRepository.save(sensor);

        return sensorMapper.toDto(sensor);
    }

    public SensorDto update(String id, SensorUpdateRequest request) {
        Sensor sensor = sensorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sensor not found with id: " + id));

        if (!SecurityUtil.isAdmin() && !sensor.getUserId().equals(SecurityUtil.getCurrentUserId())) {
            throw new UnauthorizedException("Users can only update their own sensors");
        }

        sensorMapper.updateEntity(request, sensor);
        sensor = sensorRepository.save(sensor);

        return sensorMapper.toDto(sensor);
    }

    public void delete(String id) {
        Sensor sensor = sensorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sensor not found with id: " + id));

        if (!SecurityUtil.isAdmin() && !sensor.getUserId().equals(SecurityUtil.getCurrentUserId())) {
            throw new UnauthorizedException("Users can only delete their own sensors");
        }

        sensorRepository.deleteById(id);
    }
}
