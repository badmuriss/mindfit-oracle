package com.mindfit.api.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "meal_registers")
public class MealRegister {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", length = 36, nullable = false, updatable = false)
    private String id;

    @Column(name = "user_id", length = 36, nullable = false)
    private String userId;

    @Column(name = "name", length = 100)
    private String name;

    @Column(name = "timestamp")
    private LocalDateTime timestamp;

    @Column(name = "calories")
    private Integer calories;

    @Column(name = "carbo")
    private Double carbo;

    @Column(name = "protein")
    private Double protein;

    @Column(name = "fat")
    private Double fat;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}