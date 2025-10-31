package com.mindfit.api.repository;

import com.mindfit.api.AbstractIntegrationTest;
import com.mindfit.api.model.ExerciseRegister;
import com.mindfit.api.model.User;
import com.mindfit.api.util.TestDataBuilder;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class ExerciseRegisterRepositoryTest extends AbstractIntegrationTest {

    @Autowired
    private ExerciseRegisterRepository exerciseRegisterRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EntityManager entityManager;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = TestDataBuilder.user()
                .email("exercisetest@test.com")
                .build();
        testUser = userRepository.save(testUser);
    }

    @Test
    void shouldSaveExerciseWithTimestamps() {
        // Given
        ExerciseRegister exercise = TestDataBuilder.exerciseRegister()
                .userId(testUser.getId())
                .name("Running")
                .build();

        // When
        ExerciseRegister saved = exerciseRegisterRepository.save(exercise);

        // Then
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getUpdatedAt()).isNotNull();
    }

    @Test
    void shouldUpdateUpdatedAtTimestamp() throws InterruptedException {
        // Given
        ExerciseRegister exercise = TestDataBuilder.exerciseRegister()
                .userId(testUser.getId())
                .build();
        ExerciseRegister saved = exerciseRegisterRepository.save(exercise);
        entityManager.flush();
        LocalDateTime original = saved.getUpdatedAt();

        Thread.sleep(100);

        // When
        saved.setDurationInMinutes(45);
        ExerciseRegister updated = exerciseRegisterRepository.save(saved);
        entityManager.flush();

        // Then
        assertThat(updated.getUpdatedAt()).isAfter(original);
    }
}
