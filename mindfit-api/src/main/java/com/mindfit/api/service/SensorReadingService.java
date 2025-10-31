package com.mindfit.api.service;

import com.mindfit.api.common.exception.ResourceNotFoundException;
import com.mindfit.api.common.exception.UnauthorizedException;
import com.mindfit.api.dto.SensorReadingCreateRequest;
import com.mindfit.api.dto.SensorReadingDto;
import com.mindfit.api.mapper.SensorReadingMapper;
import com.mindfit.api.model.Sensor;
import com.mindfit.api.model.SensorReading;
import com.mindfit.api.repository.SensorReadingRepository;
import com.mindfit.api.repository.SensorRepository;
import com.mindfit.api.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class SensorReadingService {

    private final SensorReadingRepository sensorReadingRepository;
    private final SensorRepository sensorRepository;
    private final SensorReadingMapper sensorReadingMapper;

    public Page<SensorReadingDto> findBySensorId(String sensorId, String startDate, String endDate, Pageable pageable) {
        // Verify sensor exists and user has access
        Sensor sensor = sensorRepository.findById(sensorId)
                .orElseThrow(() -> new ResourceNotFoundException("Sensor not found with id: " + sensorId));

        if (!SecurityUtil.isAdmin() && !sensor.getUserId().equals(SecurityUtil.getCurrentUserId())) {
            throw new UnauthorizedException("Users can only view readings from their own sensors");
        }

        if (startDate != null && endDate != null) {
            LocalDateTime start = LocalDateTime.parse(startDate + "T00:00:00");
            LocalDateTime end = LocalDateTime.parse(endDate + "T23:59:59");
            return sensorReadingRepository.findBySensorIdAndReadingTimestampBetween(sensorId, start, end, pageable)
                    .map(sensorReadingMapper::toDto);
        }

        return sensorReadingRepository.findBySensorId(sensorId, pageable)
                .map(sensorReadingMapper::toDto);
    }

    public Page<SensorReadingDto> findBySensorId(String sensorId, Pageable pageable) {
        return findBySensorId(sensorId, null, null, pageable);
    }

    public SensorReadingDto findById(String id) {
        SensorReading reading = sensorReadingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sensor reading not found with id: " + id));

        // Verify user has access to the sensor
        Sensor sensor = sensorRepository.findById(reading.getSensorId())
                .orElseThrow(() -> new ResourceNotFoundException("Sensor not found"));

        if (!SecurityUtil.isAdmin() && !sensor.getUserId().equals(SecurityUtil.getCurrentUserId())) {
            throw new UnauthorizedException("Users can only view readings from their own sensors");
        }

        return sensorReadingMapper.toDto(reading);
    }

    public SensorReadingDto create(String sensorId, SensorReadingCreateRequest request) {
        // Verify sensor exists and user has access
        Sensor sensor = sensorRepository.findById(sensorId)
                .orElseThrow(() -> new ResourceNotFoundException("Sensor not found with id: " + sensorId));

        if (!SecurityUtil.isAdmin() && !sensor.getUserId().equals(SecurityUtil.getCurrentUserId())) {
            throw new UnauthorizedException("Users can only create readings for their own sensors");
        }

        SensorReading reading = sensorReadingMapper.toEntity(request);
        reading.setSensorId(sensorId);

        // Set timestamp to now if not provided
        if (reading.getReadingTimestamp() == null) {
            reading.setReadingTimestamp(LocalDateTime.now());
        }

        reading = sensorReadingRepository.save(reading);

        return sensorReadingMapper.toDto(reading);
    }

    public void delete(String id) {
        SensorReading reading = sensorReadingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sensor reading not found with id: " + id));

        // Verify user has access to the sensor
        Sensor sensor = sensorRepository.findById(reading.getSensorId())
                .orElseThrow(() -> new ResourceNotFoundException("Sensor not found"));

        if (!SecurityUtil.isAdmin() && !sensor.getUserId().equals(SecurityUtil.getCurrentUserId())) {
            throw new UnauthorizedException("Users can only delete readings from their own sensors");
        }

        sensorReadingRepository.deleteById(id);
    }
}
