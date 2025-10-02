package com.mindfit.api.model;

import com.mindfit.api.enums.LogType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "logs")
public class Log {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", length = 36, nullable = false, updatable = false)
    private String id;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", length = 20)
    private LogType type;

    @Column(name = "category", length = 50)
    private String category;

    @Column(name = "name", length = 100)
    private String name;

    @Lob
    @Column(name = "stack_trace")
    private String stackTrace;

    @Column(name = "timestamp")
    private LocalDateTime timestamp;

}