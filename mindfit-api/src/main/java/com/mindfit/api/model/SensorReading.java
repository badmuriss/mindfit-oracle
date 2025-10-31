package com.mindfit.api.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "sensor_readings")
public class SensorReading {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", length = 36, nullable = false, updatable = false)
    private String id;

    @Column(name = "sensor_id", length = 36, nullable = false)
    private String sensorId;

    @Column(name = "reading_value", nullable = false)
    private Double readingValue;

    @Column(name = "reading_type", length = 50, nullable = false)
    private String readingType;

    @Column(name = "unit", length = 20)
    private String unit;

    @Column(name = "reading_timestamp")
    private LocalDateTime readingTimestamp;
}
