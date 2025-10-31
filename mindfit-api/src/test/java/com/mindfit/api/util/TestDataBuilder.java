package com.mindfit.api.util;

import com.mindfit.api.enums.Role;
import com.mindfit.api.enums.Sex;
import com.mindfit.api.model.ExerciseRegister;
import com.mindfit.api.model.MealRegister;
import com.mindfit.api.model.MeasurementsRegister;
import com.mindfit.api.model.User;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

/**
 * Utility class for building test data.
 * Provides builder methods for creating test entities with sensible defaults.
 */
public class TestDataBuilder {

    public static class UserBuilder {
        private String id = null; // Don't set ID - let JPA generate it
        private String email = "test@example.com";
        private String password = "$2a$10$N9qo8uLOickgx2ZMRZoMye/IVI9cve2S.w"; // encoded "password"
        private String name = "Test User";
        private Set<Role> roles = new java.util.HashSet<>(Set.of(Role.USER));
        private String profile = null;
        private Sex sex = Sex.NOT_INFORMED;
        private LocalDate birthDate = LocalDate.of(1990, 1, 1);
        private boolean enabled = true;
        private boolean accountNonExpired = true;
        private boolean accountNonLocked = true;
        private boolean credentialsNonExpired = true;

        public UserBuilder id(String id) {
            this.id = id;
            return this;
        }

        public UserBuilder email(String email) {
            this.email = email;
            return this;
        }

        public UserBuilder password(String password) {
            this.password = password;
            return this;
        }

        public UserBuilder name(String name) {
            this.name = name;
            return this;
        }

        public UserBuilder roles(Set<Role> roles) {
            this.roles = roles;
            return this;
        }

        public UserBuilder profile(String profile) {
            this.profile = profile;
            return this;
        }

        public UserBuilder sex(Sex sex) {
            this.sex = sex;
            return this;
        }

        public UserBuilder birthDate(LocalDate birthDate) {
            this.birthDate = birthDate;
            return this;
        }

        public UserBuilder enabled(boolean enabled) {
            this.enabled = enabled;
            return this;
        }

        public User build() {
            User user = new User();
            // Only set ID if explicitly provided
            if (id != null) {
                user.setId(id);
            }
            user.setEmail(email);
            user.setPassword(password);
            user.setName(name);
            user.setRoles(roles);
            user.setProfile(profile);
            user.setSex(sex);
            user.setBirthDate(birthDate);
            user.setEnabled(enabled);
            user.setAccountNonExpired(accountNonExpired);
            user.setAccountNonLocked(accountNonLocked);
            user.setCredentialsNonExpired(credentialsNonExpired);
            return user;
        }
    }

    public static class MealRegisterBuilder {
        private String id = null; // Don't set ID - let JPA generate it
        private String userId;
        private String name = "Test Meal";
        private LocalDateTime timestamp = LocalDateTime.now();
        private Integer calories = 500;
        private Double carbo = 50.0;
        private Double protein = 20.0;
        private Double fat = 15.0;

        public MealRegisterBuilder id(String id) {
            this.id = id;
            return this;
        }

        public MealRegisterBuilder userId(String userId) {
            this.userId = userId;
            return this;
        }

        public MealRegisterBuilder name(String name) {
            this.name = name;
            return this;
        }

        public MealRegisterBuilder timestamp(LocalDateTime timestamp) {
            this.timestamp = timestamp;
            return this;
        }

        public MealRegisterBuilder calories(Integer calories) {
            this.calories = calories;
            return this;
        }

        public MealRegister build() {
            MealRegister meal = new MealRegister();
            // Only set ID if explicitly provided
            if (id != null) {
                meal.setId(id);
            }
            meal.setUserId(userId);
            meal.setName(name);
            meal.setTimestamp(timestamp);
            meal.setCalories(calories);
            meal.setCarbo(carbo);
            meal.setProtein(protein);
            meal.setFat(fat);
            return meal;
        }
    }

    public static class ExerciseRegisterBuilder {
        private String id = null; // Don't set ID - let JPA generate it
        private String userId;
        private String name = "Test Exercise";
        private String description = "Test Description";
        private LocalDateTime timestamp = LocalDateTime.now();
        private Integer durationInMinutes = 30;
        private Integer caloriesBurnt = 200;

        public ExerciseRegisterBuilder id(String id) {
            this.id = id;
            return this;
        }

        public ExerciseRegisterBuilder userId(String userId) {
            this.userId = userId;
            return this;
        }

        public ExerciseRegisterBuilder name(String name) {
            this.name = name;
            return this;
        }

        public ExerciseRegisterBuilder timestamp(LocalDateTime timestamp) {
            this.timestamp = timestamp;
            return this;
        }

        public ExerciseRegister build() {
            ExerciseRegister exercise = new ExerciseRegister();
            // Only set ID if explicitly provided
            if (id != null) {
                exercise.setId(id);
            }
            exercise.setUserId(userId);
            exercise.setName(name);
            exercise.setDescription(description);
            exercise.setTimestamp(timestamp);
            exercise.setDurationInMinutes(durationInMinutes);
            exercise.setCaloriesBurnt(caloriesBurnt);
            return exercise;
        }
    }

    public static class MeasurementsRegisterBuilder {
        private String id = null; // Don't set ID - let JPA generate it
        private String userId;
        private Double weightInKG = 70.0;
        private Integer heightInCM = 170;
        private LocalDateTime timestamp = LocalDateTime.now();

        public MeasurementsRegisterBuilder id(String id) {
            this.id = id;
            return this;
        }

        public MeasurementsRegisterBuilder userId(String userId) {
            this.userId = userId;
            return this;
        }

        public MeasurementsRegisterBuilder weightInKG(Double weightInKG) {
            this.weightInKG = weightInKG;
            return this;
        }

        public MeasurementsRegisterBuilder heightInCM(Integer heightInCM) {
            this.heightInCM = heightInCM;
            return this;
        }

        public MeasurementsRegister build() {
            MeasurementsRegister measurements = new MeasurementsRegister();
            // Only set ID if explicitly provided
            if (id != null) {
                measurements.setId(id);
            }
            measurements.setUserId(userId);
            measurements.setWeightInKG(weightInKG);
            measurements.setHeightInCM(heightInCM);
            measurements.setTimestamp(timestamp);
            return measurements;
        }
    }

    public static UserBuilder user() {
        return new UserBuilder();
    }

    public static MealRegisterBuilder mealRegister() {
        return new MealRegisterBuilder();
    }

    public static ExerciseRegisterBuilder exerciseRegister() {
        return new ExerciseRegisterBuilder();
    }

    public static MeasurementsRegisterBuilder measurementsRegister() {
        return new MeasurementsRegisterBuilder();
    }
}
