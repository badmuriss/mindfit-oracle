package com.mindfit.api.config;

import com.mindfit.api.enums.Role;
import com.mindfit.api.model.User;
import com.mindfit.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Set;

@Component
@Profile("!test")
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        createSuperAdminIfNotExists();
    }

    private void createSuperAdminIfNotExists() {
        String superAdminEmail = "admin@example.com";
        
        if (!userRepository.existsByEmail(superAdminEmail)) {
            log.info("Creating default super admin user...");
            
            User superAdmin = new User();
            superAdmin.setName("SUPER ADMIN");
            superAdmin.setEmail(superAdminEmail);
            superAdmin.setPassword(passwordEncoder.encode("password"));
            superAdmin.setRoles(Set.of(Role.SUPER_ADMIN));
            superAdmin.setCreatedAt(LocalDateTime.now());
            superAdmin.setEnabled(true);
            superAdmin.setAccountNonExpired(true);
            superAdmin.setAccountNonLocked(true);
            superAdmin.setCredentialsNonExpired(true);
            
            userRepository.save(superAdmin);
            
            log.info("Super admin user created successfully with email: {}", superAdminEmail);
            log.info("Default password: password (please change after first login)");
        } else {
            log.info("Super admin user already exists, skipping creation");
        }
    }
}