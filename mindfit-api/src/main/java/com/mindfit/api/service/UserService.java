package com.mindfit.api.service;

import com.mindfit.api.common.exception.BadRequestException;
import com.mindfit.api.common.exception.ResourceNotFoundException;
import com.mindfit.api.common.exception.UnauthorizedException;
import com.mindfit.api.dto.UserDto;
import com.mindfit.api.dto.UserUpdateRequest;
import com.mindfit.api.model.User;
import com.mindfit.api.repository.UserRepository;
import com.mindfit.api.mapper.UserMapper;
import com.mindfit.api.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;



@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    public Page<UserDto> findAll(Pageable pageable) {
        if (!SecurityUtil.isAdmin()) {
            throw new UnauthorizedException("Only admins can view all users");
        }
        
        return userRepository.findAll(pageable)
                .map(userMapper::toDto);
    }

    public UserDto findById(String id) {
        if (!SecurityUtil.isAdmin() && !id.equals(SecurityUtil.getCurrentUserId())) {
            throw new UnauthorizedException("Users can only view their own profile");
        }
        
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        
        return userMapper.toDto(user);
    }


    public UserDto update(String id, UserUpdateRequest request) {
        if (!SecurityUtil.isAdmin() && !id.equals(SecurityUtil.getCurrentUserId())) {
            throw new UnauthorizedException("Users can only update their own profile");
        }
        
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (request.email() != null && !request.email().equals(user.getEmail()) 
                && userRepository.existsByEmail(request.email())) {
            throw new BadRequestException("Email already exists");
        }

        userMapper.updateEntity(request, user);

        user = userRepository.save(user);
        return userMapper.toDto(user);
    }

    public void delete(String id) {
        if (!SecurityUtil.isAdmin() && !id.equals(SecurityUtil.getCurrentUserId())) {
            throw new UnauthorizedException("Users can only delete their own profile");
        }
        
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User not found with id: " + id);
        }
        
        userRepository.deleteById(id);
    }

    public UserDto findByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        
        return userMapper.toDto(user);
    }
    
}