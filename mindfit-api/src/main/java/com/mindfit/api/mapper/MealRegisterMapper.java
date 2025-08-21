package com.mindfit.api.mapper;

import com.mindfit.api.model.MealRegister;
import com.mindfit.api.dto.MealRegisterCreateRequest;
import com.mindfit.api.dto.MealRegisterDto;
import com.mindfit.api.dto.MealRegisterResponse;
import com.mindfit.api.dto.MealRegisterUpdateRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface MealRegisterMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    MealRegister toEntity(MealRegisterCreateRequest request);

    void updateEntity(MealRegisterUpdateRequest request, @MappingTarget MealRegister mealRegister);

    MealRegisterResponse toResponse(MealRegister mealRegister);

    MealRegisterResponse toResponse(MealRegisterDto dto);

    MealRegisterDto toDto(MealRegister mealRegister);

    MealRegister toEntity(MealRegisterDto dto);
}
