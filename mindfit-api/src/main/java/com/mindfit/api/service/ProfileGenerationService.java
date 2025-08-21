package com.mindfit.api.service;

import com.mindfit.api.model.User;
import com.mindfit.api.model.MealRegister;
import com.mindfit.api.model.ExerciseRegister;
import com.mindfit.api.model.MeasurementsRegister;
import com.mindfit.api.repository.UserRepository;
import com.mindfit.api.repository.MealRegisterRepository;
import com.mindfit.api.repository.ExerciseRegisterRepository;
import com.mindfit.api.repository.MeasurementsRegisterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProfileGenerationService {

    private final OpenAiChatModel openAiChatModel;
    private final UserRepository userRepository;
    private final MealRegisterRepository mealRegisterRepository;
    private final ExerciseRegisterRepository exerciseRegisterRepository;
    private final MeasurementsRegisterRepository measurementsRegisterRepository;

    public String generateUserProfile(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        
        List<MealRegister> recentMeals = mealRegisterRepository
                .findByUserIdAndTimestampBetween(userId, thirtyDaysAgo, LocalDateTime.now(), PageRequest.of(0, 50))
                .getContent();
        
        List<ExerciseRegister> recentExercises = exerciseRegisterRepository
                .findByUserIdAndTimestampBetween(userId, thirtyDaysAgo, LocalDateTime.now(), PageRequest.of(0, 50))
                .getContent();
        
        List<MeasurementsRegister> recentMeasurements = measurementsRegisterRepository
                .findByUserIdAndTimestampBetween(userId, thirtyDaysAgo, LocalDateTime.now(), PageRequest.of(0, 10))
                .getContent();

        StringBuilder prompt = new StringBuilder();
        prompt.append("Based on the following user data from the last 30 days, generate a comprehensive user profile that includes food preferences, exercise preferences, fitness goals, and dietary patterns. Be concise but detailed:\n\n");
        
        prompt.append("MEALS CONSUMED:\n");
        for (MealRegister meal : recentMeals) {
            prompt.append(String.format("- %s (Calories: %d", meal.getName(), meal.getCalories()));
            if (meal.getCarbo() != null) prompt.append(String.format(", Carbs: %.1fg", meal.getCarbo()));
            if (meal.getProtein() != null) prompt.append(String.format(", Protein: %.1fg", meal.getProtein()));
            if (meal.getFat() != null) prompt.append(String.format(", Fat: %.1fg", meal.getFat()));
            prompt.append(")\n");
        }
        
        prompt.append("\nEXERCISE ACTIVITIES:\n");
        for (ExerciseRegister exercise : recentExercises) {
            prompt.append(String.format("- %s: %s (Duration: %d minutes, Calories: %d)\n", 
                exercise.getName(), exercise.getDescription(), exercise.getDurationInMinutes(), exercise.getCaloriesBurnt()));
        }
        
        prompt.append("\nBODY MEASUREMENTS:\n");
        for (MeasurementsRegister measurement : recentMeasurements) {
            prompt.append(String.format("- Weight: %.1fkg, Height: %dcm (%s)\n", 
                measurement.getWeightInKG(), measurement.getHeightInCM(), measurement.getTimestamp().toLocalDate()));
        }
        
        prompt.append("\nGenerate a profile that includes:\n");
        prompt.append("1. Food preferences and dietary patterns\n");
        prompt.append("2. Exercise preferences and fitness level\n");
        prompt.append("3. Health goals and objectives\n");
        prompt.append("4. Nutritional needs and recommendations\n");
        prompt.append("5. Fitness recommendations\n");
        prompt.append("Keep it under 300 words.");

        return openAiChatModel.call(prompt.toString());
    }
    
    public void updateUserProfile(String userId, String profile) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setProfile(profile);
        userRepository.save(user);
    }
}