package com.mindfit.api.repository;

import com.mindfit.api.enums.LogType;
import com.mindfit.api.model.Log;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface LogRepository extends MongoRepository<Log, String> {
    
    Page<Log> findByType(LogType type, Pageable pageable);
    
    Page<Log> findByCategory(String category, Pageable pageable);
    
    Page<Log> findByTimestampBetween(LocalDateTime start, LocalDateTime end, Pageable pageable);

    Page<Log> findByTypeAndCategory(LogType type, String category, Pageable pageable);

    Page<Log> findByTypeAndTimestampBetween(LogType type, LocalDateTime start, LocalDateTime end, Pageable pageable);

    Page<Log> findByCategoryAndTimestampBetween(String category, LocalDateTime start, LocalDateTime end, Pageable pageable);

    Page<Log> findByTypeAndCategoryAndTimestampBetween(LogType type, String category, LocalDateTime start, LocalDateTime end, Pageable pageable);
}
