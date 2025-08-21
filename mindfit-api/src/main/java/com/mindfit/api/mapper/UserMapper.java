package com.mindfit.api.mapper;

import com.mindfit.api.model.User;
import com.mindfit.api.dto.UserCreateRequest;
import com.mindfit.api.dto.UserDto;
import com.mindfit.api.dto.UserResponse;
import com.mindfit.api.dto.UserDetailResponse;
import com.mindfit.api.dto.UserUpdateRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface UserMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "password", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "enabled", ignore = true)
    @Mapping(target = "accountNonExpired", ignore = true)
    @Mapping(target = "accountNonLocked", ignore = true)
    @Mapping(target = "credentialsNonExpired", ignore = true)
    @Mapping(target = "authorities", ignore = true)
    User toEntity(UserCreateRequest request);

    @Mapping(target = "password", ignore = true)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "enabled", ignore = true)
    @Mapping(target = "accountNonExpired", ignore = true)
    @Mapping(target = "accountNonLocked", ignore = true)
    @Mapping(target = "credentialsNonExpired", ignore = true)
    @Mapping(target = "authorities", ignore = true)
    void updateEntity(UserUpdateRequest request, @MappingTarget User user);

    UserResponse toResponse(User user);

    UserResponse toResponse(UserDto dto);

    UserDetailResponse toDetailResponse(User user);

    UserDetailResponse toDetailResponse(UserDto dto);

    @Mapping(target = "password", source = "password")
    UserDto toDto(User user);

    @Mapping(target = "enabled", ignore = true)
    @Mapping(target = "accountNonExpired", ignore = true)
    @Mapping(target = "accountNonLocked", ignore = true)
    @Mapping(target = "credentialsNonExpired", ignore = true)
    @Mapping(target = "authorities", ignore = true)
    User toEntity(UserDto dto);
}
