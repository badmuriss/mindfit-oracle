package com.mindfit.api.repository;

import com.mindfit.api.model.MeasurementsRegister;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface MeasurementsRegisterRepository extends MongoRepository<MeasurementsRegister, String> {
    
    Page<MeasurementsRegister> findByUserId(String userId, Pageable pageable);
    
    Page<MeasurementsRegister> findByUserIdAndTimestampBetween(String userId, LocalDateTime start, LocalDateTime end, Pageable pageable);
}