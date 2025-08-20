package com.mindfit.api.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;

@Data
@Document(collection = "measurements_registers")
public class MeasurementsRegister {
    
    @Id
    private String id;
    
    @Indexed
    private String userId;
    
    private Double weight;
    
    private Double height;
    
    private LocalDateTime timestamp;
    
    @CreatedDate
    private LocalDateTime createdAt;
}