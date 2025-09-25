package com.mindfit.api.mapper;

import com.mindfit.api.model.User;
import com.mindfit.api.dto.UserSignupRequest;
import com.mindfit.api.dto.UserDto;
import com.mindfit.api.dto.UserResponse;
import com.mindfit.api.dto.UserDetailResponse;
import com.mindfit.api.dto.UserUpdateRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE, uses = {com.mindfit.api.mapper.PasswordEncodingMapper.class})
public abstract class UserMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "password", source = "password", qualifiedByName = "encodePassword")
    @Mapping(target = "roles", ignore = true)
    @Mapping(target = "profile", ignore = true)
    @Mapping(target = "lastLogonDate", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    public abstract UserDto toDto(UserSignupRequest request);
    
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "password", source = "password", qualifiedByName = "encodePassword")
    @Mapping(target = "roles", ignore = true)
    @Mapping(target = "profile", ignore = true)
    @Mapping(target = "lastLogonDate", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "enabled", ignore = true)
    @Mapping(target = "accountNonExpired", ignore = true)
    @Mapping(target = "accountNonLocked", ignore = true)
    @Mapping(target = "credentialsNonExpired", ignore = true)
    @Mapping(target = "authorities", ignore = true)
    @Mapping(target = "mealRecommendationsCache", ignore = true)
    @Mapping(target = "mealCacheExpiry", ignore = true)
    @Mapping(target = "workoutRecommendationsCache", ignore = true)
    @Mapping(target = "workoutCacheExpiry", ignore = true)
    public abstract User toEntity(UserSignupRequest request);

    @Mapping(target = "password", source = "password", qualifiedByName = "encodePassword")
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "roles", ignore = true)
    @Mapping(target = "profile", ignore = true)
    @Mapping(target = "lastLogonDate", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "enabled", ignore = true)
    @Mapping(target = "accountNonExpired", ignore = true)
    @Mapping(target = "accountNonLocked", ignore = true)
    @Mapping(target = "credentialsNonExpired", ignore = true)
    @Mapping(target = "authorities", ignore = true)
    @Mapping(target = "mealRecommendationsCache", ignore = true)
    @Mapping(target = "mealCacheExpiry", ignore = true)
    @Mapping(target = "workoutRecommendationsCache", ignore = true)
    @Mapping(target = "workoutCacheExpiry", ignore = true)
    public abstract void updateEntity(UserUpdateRequest request, @MappingTarget User user);

    public abstract UserResponse toResponse(User user);

    public abstract UserResponse toResponse(UserDto dto);

    public abstract UserDetailResponse toDetailResponse(User user);

    public abstract UserDetailResponse toDetailResponse(UserDto dto);

    @Mapping(target = "password", source = "password")
    public abstract UserDto toDto(User user);

    @Mapping(target = "enabled", ignore = true)
    @Mapping(target = "accountNonExpired", ignore = true)
    @Mapping(target = "accountNonLocked", ignore = true)
    @Mapping(target = "credentialsNonExpired", ignore = true)
    @Mapping(target = "authorities", ignore = true)
    @Mapping(target = "mealRecommendationsCache", ignore = true)
    @Mapping(target = "mealCacheExpiry", ignore = true)
    @Mapping(target = "workoutRecommendationsCache", ignore = true)
    @Mapping(target = "workoutCacheExpiry", ignore = true)
    public abstract User toEntity(UserDto dto);
}
