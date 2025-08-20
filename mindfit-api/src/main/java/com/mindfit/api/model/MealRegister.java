package com.mindfit.api.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;

@Data
@Document(collection = "meal_registers")
public class MealRegister {
    
    @Id
    private String id;
    
    @Indexed
    private String userId;
    
    private String name;
    
    private LocalDateTime timestamp;
    
    private Integer calories;
    
    @CreatedDate
    private LocalDateTime createdAt;
}