package com.mindfit.api.repository;

import com.mindfit.api.AbstractIntegrationTest;
import com.mindfit.api.model.MealRegister;
import com.mindfit.api.model.User;
import com.mindfit.api.util.TestDataBuilder;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class MealRegisterRepositoryTest extends AbstractIntegrationTest {

    @Autowired
    private MealRegisterRepository mealRegisterRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EntityManager entityManager;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = TestDataBuilder.user()
                .email("mealtest@test.com")
                .build();
        testUser = userRepository.save(testUser);
    }

    @Test
    void shouldSaveMealRegisterWithTimestamps() {
        // Given
        MealRegister meal = TestDataBuilder.mealRegister()
                .userId(testUser.getId())
                .name("Breakfast")
                .calories(400)
                .build();

        // When
        MealRegister savedMeal = mealRegisterRepository.save(meal);

        // Then
        assertThat(savedMeal.getId()).isNotNull();
        assertThat(savedMeal.getCreatedAt()).isNotNull();
        assertThat(savedMeal.getUpdatedAt()).isNotNull();
        assertThat(savedMeal.getName()).isEqualTo("Breakfast");
    }

    @Test
    void shouldUpdateUpdatedAtOnModification() throws InterruptedException {
        // Given
        MealRegister meal = TestDataBuilder.mealRegister()
                .userId(testUser.getId())
                .name("Lunch")
                .build();
        MealRegister savedMeal = mealRegisterRepository.save(meal);
        entityManager.flush();
        LocalDateTime originalUpdatedAt = savedMeal.getUpdatedAt();

        Thread.sleep(100);

        // When
        savedMeal.setCalories(600);
        MealRegister updatedMeal = mealRegisterRepository.save(savedMeal);
        entityManager.flush();

        // Then
        assertThat(updatedMeal.getUpdatedAt()).isAfter(originalUpdatedAt);
        assertThat(updatedMeal.getCalories()).isEqualTo(600);
    }

    @Test
    void shouldFindMealsByUserId() {
        // Given
        MealRegister meal1 = TestDataBuilder.mealRegister()
                .userId(testUser.getId())
                .name("Meal 1")
                .build();
        MealRegister meal2 = TestDataBuilder.mealRegister()
                .userId(testUser.getId())
                .name("Meal 2")
                .build();
        mealRegisterRepository.save(meal1);
        mealRegisterRepository.save(meal2);

        // When
        Page<MealRegister> mealsPage = mealRegisterRepository.findByUserId(testUser.getId(), PageRequest.of(0, 10));

        // Then
        assertThat(mealsPage.getContent()).hasSize(2);
        assertThat(mealsPage.getContent()).extracting(MealRegister::getName)
                .containsExactlyInAnyOrder("Meal 1", "Meal 2");
    }

    @Test
    void shouldDeleteMealRegister() {
        // Given
        MealRegister meal = TestDataBuilder.mealRegister()
                .userId(testUser.getId())
                .build();
        MealRegister savedMeal = mealRegisterRepository.save(meal);

        // When
        mealRegisterRepository.deleteById(savedMeal.getId());

        // Then
        assertThat(mealRegisterRepository.findById(savedMeal.getId())).isEmpty();
    }
}
