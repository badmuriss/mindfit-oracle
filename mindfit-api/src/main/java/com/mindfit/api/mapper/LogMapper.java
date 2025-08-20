package com.mindfit.api.mapper;

import com.mindfit.api.model.Log;
import com.mindfit.api.dto.LogCreateRequest;
import com.mindfit.api.dto.LogDto;
import com.mindfit.api.dto.LogResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface LogMapper {

    @Mapping(target = "id", ignore = true)
    Log toEntity(LogCreateRequest request);

    LogResponse toResponse(Log log);

    LogDto toDto(Log log);

    Log toEntity(LogDto dto);
}