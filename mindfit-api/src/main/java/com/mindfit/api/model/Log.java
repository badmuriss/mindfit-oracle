package com.mindfit.api.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.mindfit.api.enums.LogType;
import java.time.LocalDateTime;

@Data
@Document(collection = "logs")
public class Log {
    
    @Id
    private String id;
    
    private LogType type;
    
    private String category;
    
    private String name;
    
    private String stackTrace;
    
    private LocalDateTime timestamp;
    
}