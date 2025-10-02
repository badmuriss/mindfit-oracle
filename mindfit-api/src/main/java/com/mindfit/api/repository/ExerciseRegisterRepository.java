package com.mindfit.api.repository;

import com.mindfit.api.model.ExerciseRegister;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface ExerciseRegisterRepository extends JpaRepository<ExerciseRegister, String> {
    
    Page<ExerciseRegister> findByUserId(String userId, Pageable pageable);
    
    Page<ExerciseRegister> findByUserIdAndTimestampBetween(String userId, LocalDateTime start, LocalDateTime end, Pageable pageable);
}