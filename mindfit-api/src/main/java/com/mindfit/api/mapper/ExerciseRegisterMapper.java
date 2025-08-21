package com.mindfit.api.mapper;

import com.mindfit.api.model.ExerciseRegister;
import com.mindfit.api.dto.ExerciseRegisterCreateRequest;
import com.mindfit.api.dto.ExerciseRegisterDto;
import com.mindfit.api.dto.ExerciseRegisterResponse;
import com.mindfit.api.dto.ExerciseRegisterUpdateRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface ExerciseRegisterMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    ExerciseRegister toEntity(ExerciseRegisterCreateRequest request);

    void updateEntity(ExerciseRegisterUpdateRequest request, @MappingTarget ExerciseRegister exerciseRegister);

    ExerciseRegisterResponse toResponse(ExerciseRegister exerciseRegister);

    ExerciseRegisterResponse toResponse(ExerciseRegisterDto dto);

    ExerciseRegisterDto toDto(ExerciseRegister exerciseRegister);

    ExerciseRegister toEntity(ExerciseRegisterDto dto);
}
