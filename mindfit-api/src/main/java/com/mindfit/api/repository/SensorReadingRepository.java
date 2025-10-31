package com.mindfit.api.repository;

import com.mindfit.api.model.SensorReading;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface SensorReadingRepository extends JpaRepository<SensorReading, String> {

    Page<SensorReading> findBySensorId(String sensorId, Pageable pageable);

    Page<SensorReading> findBySensorIdAndReadingTimestampBetween(
            String sensorId,
            LocalDateTime start,
            LocalDateTime end,
            Pageable pageable
    );

    Page<SensorReading> findBySensorIdAndReadingType(
            String sensorId,
            String readingType,
            Pageable pageable
    );
}
