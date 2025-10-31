package com.mindfit.api.repository;

import com.mindfit.api.AbstractIntegrationTest;
import com.mindfit.api.model.User;
import com.mindfit.api.util.TestDataBuilder;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class UserRepositoryTest extends AbstractIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    void shouldSaveUserWithCreatedAtAndUpdatedAt() {
        // Given
        User user = TestDataBuilder.user()
                .email("newuser@test.com")
                .name("New User")
                .build();

        // When
        User savedUser = userRepository.save(user);

        // Then
        assertThat(savedUser.getId()).isNotNull();
        assertThat(savedUser.getCreatedAt()).isNotNull();
        assertThat(savedUser.getUpdatedAt()).isNotNull();
        assertThat(savedUser.getEmail()).isEqualTo("newuser@test.com");
    }

    @Test
    void shouldUpdateUpdatedAtOnUserModification() throws InterruptedException {
        // Given
        User user = TestDataBuilder.user()
                .email("update@test.com")
                .name("Original Name")
                .build();
        User savedUser = userRepository.save(user);
        entityManager.flush();
        LocalDateTime originalUpdatedAt = savedUser.getUpdatedAt();

        // Wait a bit to ensure timestamp difference
        Thread.sleep(100);

        // When
        savedUser.setName("Updated Name");
        User updatedUser = userRepository.save(savedUser);
        entityManager.flush();

        // Then
        assertThat(updatedUser.getUpdatedAt()).isNotNull();
        assertThat(updatedUser.getUpdatedAt()).isAfter(originalUpdatedAt);
        assertThat(updatedUser.getName()).isEqualTo("Updated Name");
        assertThat(updatedUser.getCreatedAt()).isEqualTo(savedUser.getCreatedAt()); // createdAt should not change
    }

    @Test
    void shouldFindUserByEmail() {
        // Given
        User user = TestDataBuilder.user()
                .email("find@test.com")
                .build();
        userRepository.save(user);

        // When
        var foundUser = userRepository.findByEmail("find@test.com");

        // Then
        assertThat(foundUser).isPresent();
        assertThat(foundUser.get().getEmail()).isEqualTo("find@test.com");
    }

    @Test
    void shouldReturnEmptyWhenUserNotFound() {
        // When
        var foundUser = userRepository.findByEmail("nonexistent@test.com");

        // Then
        assertThat(foundUser).isEmpty();
    }

    @Test
    void shouldCheckIfUserExistsByEmail() {
        // Given
        User user = TestDataBuilder.user()
                .email("exists@test.com")
                .build();
        userRepository.save(user);

        // When/Then
        assertThat(userRepository.existsByEmail("exists@test.com")).isTrue();
        assertThat(userRepository.existsByEmail("notexists@test.com")).isFalse();
    }
}
