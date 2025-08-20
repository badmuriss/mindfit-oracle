package com.mindfit.api.repository;

import com.mindfit.api.model.MealRegister;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface MealRegisterRepository extends MongoRepository<MealRegister, String> {
    
    Page<MealRegister> findByUserId(String userId, Pageable pageable);
    
    Page<MealRegister> findByUserIdAndTimestampBetween(String userId, LocalDateTime start, LocalDateTime end, Pageable pageable);
}