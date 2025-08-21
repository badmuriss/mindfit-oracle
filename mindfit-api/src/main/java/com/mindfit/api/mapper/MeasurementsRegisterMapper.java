package com.mindfit.api.mapper;

import com.mindfit.api.model.MeasurementsRegister;
import com.mindfit.api.dto.MeasurementsRegisterCreateRequest;
import com.mindfit.api.dto.MeasurementsRegisterDto;
import com.mindfit.api.dto.MeasurementsRegisterResponse;
import com.mindfit.api.dto.MeasurementsRegisterUpdateRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface MeasurementsRegisterMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    MeasurementsRegister toEntity(MeasurementsRegisterCreateRequest request);

    void updateEntity(MeasurementsRegisterUpdateRequest request, @MappingTarget MeasurementsRegister measurementsRegister);

    MeasurementsRegisterResponse toResponse(MeasurementsRegister measurementsRegister);

    MeasurementsRegisterResponse toResponse(MeasurementsRegisterDto dto);

    MeasurementsRegisterDto toDto(MeasurementsRegister measurementsRegister);

    MeasurementsRegister toEntity(MeasurementsRegisterDto dto);
}
