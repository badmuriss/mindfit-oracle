package com.mindfit.api.mapper;

import com.mindfit.api.dto.SensorCreateRequest;
import com.mindfit.api.dto.SensorDto;
import com.mindfit.api.dto.SensorResponse;
import com.mindfit.api.dto.SensorUpdateRequest;
import com.mindfit.api.model.Sensor;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface SensorMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Sensor toEntity(SensorCreateRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(SensorUpdateRequest request, @MappingTarget Sensor sensor);

    SensorResponse toResponse(Sensor sensor);

    SensorResponse toResponse(SensorDto dto);

    SensorDto toDto(Sensor sensor);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Sensor toEntity(SensorDto dto);
}
