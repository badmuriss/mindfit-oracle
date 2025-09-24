package com.mindfit.api.service;

import com.mindfit.api.dto.ChatRequest;
import com.mindfit.api.dto.ChatResponse;
import com.mindfit.api.model.User;
import com.mindfit.api.repository.UserRepository;
import com.mindfit.api.service.LogService;
import com.mindfit.api.service.MealRegisterService;
import com.mindfit.api.service.MeasurementsRegisterService;
import com.mindfit.api.service.ExerciseRegisterService;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.Period;
import java.time.format.DateTimeFormatter;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.data.domain.PageRequest;

@Service
@RequiredArgsConstructor
public class ChatbotService {

    private final OpenAiChatModel openAiChatModel;
    private final UserRepository userRepository;
    private final LogService logService;
    private final MealRegisterService mealRegisterService;
    private final MeasurementsRegisterService measurementsRegisterService;
    private final ExerciseRegisterService exerciseRegisterService;
    private final Map<String, Deque<String>> conversations = new ConcurrentHashMap<>();
    private static final int MAX_TURNS = 10; // keep last 10 user-assistant exchanges

    public ChatResponse chat(String userId, ChatRequest request) {
        Deque<String> history = conversations.computeIfAbsent(userId, k -> new ArrayDeque<>());
        
        // Get user profile for personalization, generate if empty and first message
        String userProfile = getUserProfile(userId);
        if ((userProfile == null || userProfile.trim().isEmpty()) && history.isEmpty()) {
            userProfile = generateUserProfile(userId);
        }
        
        String systemPreamble = "You are a certified nutrition specialist and dietitian. " +
                "Provide evidence-based, safe, and practical guidance on nutrition, meal planning, " +
                "sports nutrition, weight management, and dietary restrictions or allergies. " +
                "Give direct and personalized answers based on the user's profile when available. " +
                "If the topic requires medical diagnosis or treatment, recommend consulting a healthcare professional.\n" +
                "Style and length requirements (must follow):\n" +
                "- Be concise and actionable.\n" +
                "- Default to 3-5 short bullet points OR 2–4 short sentences.\n" +
                "- Keep responses under 120 words unless the user explicitly asks for more.\n" +
                "- Use the same language as the latest user message; if unclear, use English.\n" +
                "- Do not translate the user's text unless asked.\n" +
                "- Avoid preambles and pleasantries; get straight to the point.";

        // Build a rolling conversation transcript
        StringBuilder convo = new StringBuilder();
        convo.append(systemPreamble).append("\n\n");
        
        // Add user profile if available
        if (userProfile != null && !userProfile.trim().isEmpty()) {
            convo.append("USER PROFILE (use this information to personalize your responses):\n");
            convo.append(userProfile).append("\n\n");
        }
        if (!history.isEmpty()) {
            convo.append("Conversation so far:\n");
            for (String turn : history) {
                convo.append(turn).append("\n");
            }
            convo.append("\n");
        }
        // Build a Prompt with options to encourage brevity and stable language behavior
        OpenAiChatOptions options = OpenAiChatOptions.builder()
                .temperature(0.2)
                .maxTokens(250)
                .build();

        Prompt prompt = new Prompt(
                java.util.List.of(
                        new SystemMessage(convo.toString()),
                        new UserMessage(request.prompt())
                ),
                options
        );

        org.springframework.ai.chat.model.ChatResponse aiResponse = openAiChatModel.call(prompt);
        String response = aiResponse.getResult().getOutput().getText();

        // Enforce a concise response as a safety net
        String concise = trimResponse(response, 120);

        // Save the new turn; each turn is stored as two entries: User and Assistant
        history.addLast("User: " + request.prompt());
        history.addLast("Assistant: " + concise);

        // Trim history to last MAX_TURNS exchanges (2 entries per turn)
        while (history.size() > MAX_TURNS * 2) {
            history.pollFirst(); // remove oldest entry
        }

        return new ChatResponse(concise);
    }

    public void clearHistory(String userId) {
        conversations.remove(userId);
    }
    
    private String getUserProfile(String userId) {
        try {
            return userRepository.findById(userId)
                    .map(User::getProfile)
                    .orElse(null);
        } catch (Exception e) {
            logService.logError("CHATBOT_SERVICE", "Failed to retrieve user profile", e.getMessage());
            return null;
        }
    }

    public String generateUserProfile(String userId) {
        return generateUserProfile(userId, "Generate initial profile based on user registration data.");
    }
    
    public String generateUserProfile(String userId, String observations) {
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                return null;
            }
            
            // Only generate profile if user has meaningful registration data
            if (user.getName() == null || user.getName().trim().isEmpty()) {
                return null;
            }
            
            // Build comprehensive profile generation prompt
            StringBuilder profileBuilder = new StringBuilder();
            
            // Start with existing profile context if available
            String existingProfile = user.getProfile();
            if (existingProfile != null && !existingProfile.trim().isEmpty()) {
                profileBuilder.append("CURRENT USER PROFILE:\n");
                profileBuilder.append(existingProfile);
                profileBuilder.append("\n\nUpdate this profile based on the new information below:\n\n");
            } else {
                profileBuilder.append("Generate a comprehensive nutrition and fitness profile based on the following user data:\n\n");
            }
            
            // Add user basic information
            profileBuilder.append("USER INFORMATION:\n");
            profileBuilder.append("Name: ").append(user.getName());
            profileBuilder.append(", Email: ").append(user.getEmail());
            
            // Include sex for better nutrition guidance
            if (user.getSex() != null) {
                String sexDisplay = switch (user.getSex()) {
                    case MALE -> "Male";
                    case FEMALE -> "Female";
                    case NOT_INFORMED -> "Gender not specified";
                };
                profileBuilder.append(", Gender: ").append(sexDisplay);
            }
            
            // Include age calculation from birth date
            if (user.getBirthDate() != null) {
                int age = Period.between(user.getBirthDate(), LocalDate.now()).getYears();
                profileBuilder.append(", Age: ").append(age).append(" years");
            }
            
            profileBuilder.append("\n\n");
            
            // Add recent measurements data
            try {
                var measurements = measurementsRegisterService.findByUserId(userId, PageRequest.of(0, 10));
                if (measurements.hasContent()) {
                    profileBuilder.append("RECENT MEASUREMENTS:\n");
                    measurements.getContent().forEach(measurement -> {
                        profileBuilder.append("- Weight: ").append(measurement.weightInKG()).append(" kg (ITS KILOS NOT POUNDS)");
                        if (measurement.heightInCM() != null) {
                            profileBuilder.append(", Height: ").append(measurement.heightInCM()).append(" cm");
                        }
                        profileBuilder.append(" (").append(measurement.timestamp()).append(")\n");
                    });
                    profileBuilder.append("\n");
                }
            } catch (Exception e) {
                // Continue without measurements data
            }
            
            // Add recent meals data with time analysis
            try {
                var meals = mealRegisterService.findByUserId(userId, PageRequest.of(0, 20));
                if (meals.hasContent()) {
                    profileBuilder.append("RECENT MEALS:\n");
                    meals.getContent().forEach(meal -> {
                        profileBuilder.append("- ").append(meal.name())
                                .append(" (").append(meal.calories()).append(" kcal");
                        if (meal.carbo() != null) profileBuilder.append(", ").append(meal.carbo()).append("g carbs");
                        if (meal.protein() != null) profileBuilder.append(", ").append(meal.protein()).append("g protein");
                        if (meal.fat() != null) profileBuilder.append(", ").append(meal.fat()).append("g fat");
                        profileBuilder.append(", at ").append(meal.timestamp().format(DateTimeFormatter.ofPattern("HH:mm")));
                        profileBuilder.append(")\n");
                    });
                    profileBuilder.append("\n");

                    // Analyze meal timing patterns
                    profileBuilder.append("MEAL TIMING ANALYSIS:\n");
                    profileBuilder.append("Analyze the times above to identify patterns: ");
                    profileBuilder.append("What are the user's typical breakfast, lunch, dinner, and snack times? ");
                    profileBuilder.append("Are they an early morning eater or prefer later meals? ");
                    profileBuilder.append("Do they have consistent meal schedules?\n\n");
                }
            } catch (Exception e) {
                // Continue without meals data
            }

            // Add recent exercises data with time analysis
            try {
                var exercises = exerciseRegisterService.findByUserId(userId, PageRequest.of(0, 15));
                if (exercises.hasContent()) {
                    profileBuilder.append("RECENT EXERCISES:\n");
                    exercises.getContent().forEach(exercise -> {
                        profileBuilder.append("- ").append(exercise.name());
                        if (exercise.durationInMinutes() != null) {
                            profileBuilder.append(" (").append(exercise.durationInMinutes()).append(" min");
                        }
                        if (exercise.caloriesBurnt() != null) {
                            profileBuilder.append(", ").append(exercise.caloriesBurnt()).append(" kcal burned");
                        }
                        profileBuilder.append(", at ").append(exercise.timestamp().format(DateTimeFormatter.ofPattern("HH:mm")));
                        profileBuilder.append(")\n");
                    });
                    profileBuilder.append("\n");

                    // Analyze exercise timing patterns
                    profileBuilder.append("EXERCISE TIMING ANALYSIS:\n");
                    profileBuilder.append("Analyze the workout times above to identify patterns: ");
                    profileBuilder.append("Is this user a morning, afternoon, or evening exerciser? ");
                    profileBuilder.append("What intensity levels work best at different times? ");
                    profileBuilder.append("Do they prefer consistent workout schedules or vary their timing?\n\n");
                }
            } catch (Exception e) {
                // Continue without exercise data
            }
            
            // Add the new observations
            profileBuilder.append("NEW OBSERVATIONS:\n");
            profileBuilder.append(observations);
            profileBuilder.append("\n\n");
            
            // Instructions for profile generation
            profileBuilder.append("INSTRUCTIONS:\n");
            profileBuilder.append("Generate a personalized nutrition and fitness profile (max 250 words) that includes:\n");
            profileBuilder.append("- Dietary recommendations based on user's preferences and restrictions\n");
            profileBuilder.append("- Fitness goals and exercise suggestions with optimal timing\n");
            profileBuilder.append("- TIME-BASED PATTERNS: Include specific times for meals and workouts based on the analysis above\n");
            profileBuilder.append("- MEAL TIMING: Recommend optimal meal times (e.g., 'typically eats lunch at 12:30pm, prefers protein-rich meals')\n");
            profileBuilder.append("- WORKOUT TIMING: Suggest best workout times and intensities (e.g., 'morning cardio at 7am, evening strength training')\n");
            profileBuilder.append("- Any health considerations mentioned\n");
            profileBuilder.append("- Personalized tips based on measurements and behavioral patterns\n");
            profileBuilder.append("Format: Include a 'OPTIMAL SCHEDULE' section with specific time recommendations.\n");
            profileBuilder.append("Keep it professional, actionable, and time-specific.");
            
            String profilePrompt = profileBuilder.toString();
            
            OpenAiChatOptions options = OpenAiChatOptions.builder()
                    .temperature(0.2)
                    .maxTokens(400)
                    .build();
            
            Prompt prompt = new Prompt(
                    java.util.List.of(new UserMessage(profilePrompt)),
                    options
            );
            
            org.springframework.ai.chat.model.ChatResponse aiResponse = openAiChatModel.call(prompt);
            String generatedProfile = aiResponse.getResult().getOutput().getText();
            
            // Save the generated profile to the user
            user.setProfile(generatedProfile);
            userRepository.save(user);
            
            return generatedProfile;
        } catch (Exception e) {
            logService.logError("CHATBOT_SERVICE", "Failed to generate user profile with observations", e.getMessage());
            return null;
        }
    }

    private String trimResponse(String text, int maxWords) {
        if (text == null) return null;
        String[] words = text.trim().split("\\s+");
        if (words.length <= maxWords) {
            return text.trim();
        }
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < maxWords; i++) {
            if (i > 0) sb.append(' ');
            sb.append(words[i]);
        }
        sb.append(" …");
        return sb.toString();
    }
}

