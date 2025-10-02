package com.mindfit.api.repository;

import com.mindfit.api.model.MealRegister;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface MealRegisterRepository extends JpaRepository<MealRegister, String> {
    
    Page<MealRegister> findByUserId(String userId, Pageable pageable);
    
    Page<MealRegister> findByUserIdAndTimestampBetween(String userId, LocalDateTime start, LocalDateTime end, Pageable pageable);
}