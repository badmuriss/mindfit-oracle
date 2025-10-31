package com.mindfit.api.mapper;

import com.mindfit.api.dto.SensorReadingCreateRequest;
import com.mindfit.api.dto.SensorReadingDto;
import com.mindfit.api.dto.SensorReadingResponse;
import com.mindfit.api.model.SensorReading;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface SensorReadingMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "sensorId", ignore = true)
    SensorReading toEntity(SensorReadingCreateRequest request);

    SensorReadingResponse toResponse(SensorReading sensorReading);

    SensorReadingResponse toResponse(SensorReadingDto dto);

    SensorReadingDto toDto(SensorReading sensorReading);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "sensorId", ignore = true)
    SensorReading toEntity(SensorReadingDto dto);
}
