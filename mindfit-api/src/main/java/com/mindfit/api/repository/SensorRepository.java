package com.mindfit.api.repository;

import com.mindfit.api.model.Sensor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SensorRepository extends JpaRepository<Sensor, String> {

    Page<Sensor> findByUserId(String userId, Pageable pageable);

    List<Sensor> findByUserId(String userId);

    List<Sensor> findBySensorType(String sensorType);

    boolean existsByIdAndUserId(String id, String userId);
}
