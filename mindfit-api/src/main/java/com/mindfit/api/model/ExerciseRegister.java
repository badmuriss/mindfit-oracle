package com.mindfit.api.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "exercise_registers")
public class ExerciseRegister {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", length = 36, nullable = false, updatable = false)
    private String id;

    @Column(name = "user_id", length = 36, nullable = false)
    private String userId;

    @Column(name = "name", length = 100)
    private String name;

    @Lob
    @Column(name = "description")
    private String description;

    @Column(name = "timestamp")
    private LocalDateTime timestamp;

    @Column(name = "duration_in_minutes")
    private Integer durationInMinutes;

    @Column(name = "calories_burnt")
    private Integer caloriesBurnt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}