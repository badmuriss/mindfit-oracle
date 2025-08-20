package com.mindfit.api.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;

@Data
@Document(collection = "exercise_registers")
public class ExerciseRegister {
    
    @Id
    private String id;
    
    @Indexed
    private String userId;
    
    private String name;
    
    private String description;
    
    private LocalDateTime timestamp;
    
    private Integer duration;
    
    private Integer caloriesBurnt;
    
    @CreatedDate
    private LocalDateTime createdAt;
}