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
import org.springframework.stereotype.Service;



@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

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
        User targetUser = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        
    // Verifica permissões de acordo com os perfis
        if (!canUpdateUser(targetUser)) {
            throw new UnauthorizedException("Insufficient permissions to update this user");
        }

        if (request.email() != null && !request.email().equals(targetUser.getEmail()) 
                && userRepository.existsByEmail(request.email())) {
            throw new BadRequestException("Email already exists");
        }

        userMapper.updateEntity(request, targetUser);

        targetUser = userRepository.save(targetUser);
        return userMapper.toDto(targetUser);
    }
    
    
    private boolean canUpdateUser(User targetUser) {
        String currentUserId = SecurityUtil.getCurrentUserId();
        
    // Usuários podem atualizar o próprio cadastro
        if (targetUser.getId().equals(currentUserId)) {
            return true;
        }
        
    // Contas SUPER_ADMIN só podem ser alteradas pelos próprios donos
        boolean targetIsSuperAdmin = targetUser.getRoles().stream()
                .anyMatch(role -> role.name().equals("SUPER_ADMIN"));
        if (targetIsSuperAdmin) {
            return false;
        }
        
    // SUPER_ADMIN pode alterar qualquer conta que não seja outro SUPER_ADMIN
        if (SecurityUtil.isSuperAdmin()) {
            return true;
        }
        
    // ADMIN comum só pode alterar usuários com perfil USER
        if (SecurityUtil.isRegularAdmin()) {
            return targetUser.getRoles().stream()
                    .allMatch(role -> role.name().equals("USER"));
        }
        
    // Usuários sem privilégio não podem alterar terceiros
        return false;
    }

    public void delete(String id) {
        User targetUser = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        
        if (!canUpdateUser(targetUser)) {
            throw new UnauthorizedException("Insufficient permissions to delete this user");
        }
        
        userRepository.deleteById(id);
    }

    public UserDto findByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        
        return userMapper.toDto(user);
    }
    
}