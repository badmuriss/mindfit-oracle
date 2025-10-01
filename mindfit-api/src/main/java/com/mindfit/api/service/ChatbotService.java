package com.mindfit.api.service;

import com.mindfit.api.dto.ChatRequest;
import com.mindfit.api.dto.ChatResponse;
import com.mindfit.api.dto.RecommendationAction;
import com.mindfit.api.dto.WorkoutRecommendationData;
import com.mindfit.api.dto.MealRecommendationData;
import com.mindfit.api.dto.ExerciseRegisterCreateRequest;
import com.mindfit.api.dto.MealRegisterCreateRequest;
import com.mindfit.api.model.User;
import com.mindfit.api.repository.UserRepository;
import com.mindfit.api.service.LogService;
import com.mindfit.api.service.MealRegisterService;
import com.mindfit.api.service.MeasurementsRegisterService;
import com.mindfit.api.service.ExerciseRegisterService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.Period;
import java.time.format.DateTimeFormatter;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.List;
import java.util.ArrayList;
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
    private final ObjectMapper objectMapper;
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

        // Detect if the user is asking for recommendations and generate actions
        List<RecommendationAction> actions = detectAndGenerateRecommendations(userId, request.prompt(), concise);

        return new ChatResponse(concise, actions);
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

    private List<RecommendationAction> detectAndGenerateRecommendations(String userId, String userPrompt, String aiResponse) {
        try {
            // Use AI to detect intent and generate recommendations
            String intentResponse = detectIntentWithAI(userPrompt);

            // Check if response contains JSON (indicates recommendation intent)
            if (intentResponse != null && intentResponse.trim().startsWith("{")) {
                // Parse the intent response to determine type
                IntentDetectionResult intent = parseIntentDetection(intentResponse);

                if (intent != null) {
                    if ("workout".equalsIgnoreCase(intent.intentType())) {
                        return generateWorkoutRecommendations(userId, userPrompt);
                    } else if ("meal".equalsIgnoreCase(intent.intentType())) {
                        return generateMealRecommendations(userId, userPrompt);
                    }
                }
            }

            return null; // No recommendations detected
        } catch (Exception e) {
            logService.logError("CHATBOT_SERVICE", "Failed to generate recommendations", e.getMessage());
            return null;
        }
    }

    private String detectIntentWithAI(String userPrompt) {
        try {
            StringBuilder intentPrompt = new StringBuilder();
            intentPrompt.append("Analyze the following user message and determine if they are requesting:\n");
            intentPrompt.append("1. Workout/exercise recommendations\n");
            intentPrompt.append("2. Meal/food recommendations\n");
            intentPrompt.append("3. Neither (just general nutrition/fitness conversation)\n\n");
            intentPrompt.append("User message: \"").append(userPrompt).append("\"\n\n");
            intentPrompt.append("If the user IS requesting workout or meal recommendations, respond with JSON:\n");
            intentPrompt.append("{\"intentType\": \"workout\"} or {\"intentType\": \"meal\"}\n\n");
            intentPrompt.append("If the user is NOT requesting recommendations, respond with:\n");
            intentPrompt.append("none\n\n");
            intentPrompt.append("Respond ONLY with the JSON or \"none\". No additional text.");

            OpenAiChatOptions options = OpenAiChatOptions.builder()
                    .temperature(0.1)
                    .maxTokens(50)
                    .build();

            Prompt prompt = new Prompt(
                    java.util.List.of(new UserMessage(intentPrompt.toString())),
                    options
            );

            org.springframework.ai.chat.model.ChatResponse aiResponse = openAiChatModel.call(prompt);
            return aiResponse.getResult().getOutput().getText().trim();
        } catch (Exception e) {
            logService.logError("CHATBOT_SERVICE", "Failed to detect intent with AI", e.getMessage());
            return null;
        }
    }

    private IntentDetectionResult parseIntentDetection(String jsonResponse) {
        try {
            String cleanJson = jsonResponse.trim();
            if (cleanJson.startsWith("```json")) {
                cleanJson = cleanJson.substring(7);
            } else if (cleanJson.startsWith("```")) {
                cleanJson = cleanJson.substring(3);
            }
            if (cleanJson.endsWith("```")) {
                cleanJson = cleanJson.substring(0, cleanJson.length() - 3);
            }
            cleanJson = cleanJson.trim();

            return objectMapper.readValue(cleanJson, IntentDetectionResult.class);
        } catch (Exception e) {
            logService.logError("CHATBOT_SERVICE", "Failed to parse intent detection", e.getMessage());
            return null;
        }
    }

    // Helper record for intent detection
    private record IntentDetectionResult(String intentType) {}

    private List<RecommendationAction> generateWorkoutRecommendations(String userId, String userPrompt) {
        try {
            String recommendationPrompt = buildWorkoutRecommendationPrompt(userId, userPrompt);

            OpenAiChatOptions options = OpenAiChatOptions.builder()
                    .temperature(0.3)
                    .maxTokens(400)
                    .build();

            Prompt prompt = new Prompt(
                    java.util.List.of(new UserMessage(recommendationPrompt)),
                    options
            );

            org.springframework.ai.chat.model.ChatResponse aiResponse = openAiChatModel.call(prompt);
            String response = aiResponse.getResult().getOutput().getText();

            return parseWorkoutRecommendations(response);
        } catch (Exception e) {
            logService.logError("CHATBOT_SERVICE", "Failed to generate workout recommendations", e.getMessage());
            return null;
        }
    }

    private List<RecommendationAction> generateMealRecommendations(String userId, String userPrompt) {
        try {
            String recommendationPrompt = buildMealRecommendationPrompt(userId, userPrompt);

            OpenAiChatOptions options = OpenAiChatOptions.builder()
                    .temperature(0.3)
                    .maxTokens(400)
                    .build();

            Prompt prompt = new Prompt(
                    java.util.List.of(new UserMessage(recommendationPrompt)),
                    options
            );

            org.springframework.ai.chat.model.ChatResponse aiResponse = openAiChatModel.call(prompt);
            String response = aiResponse.getResult().getOutput().getText();

            return parseMealRecommendations(response);
        } catch (Exception e) {
            logService.logError("CHATBOT_SERVICE", "Failed to generate meal recommendations", e.getMessage());
            return null;
        }
    }

    private String buildWorkoutRecommendationPrompt(String userId, String userPrompt) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Gere 1-2 recomendações específicas de treino com base nesta solicitação do usuário: \"")
              .append(userPrompt).append("\"\n\n");

        // Add user profile context if available
        String userProfile = getUserProfile(userId);
        if (userProfile != null && !userProfile.trim().isEmpty()) {
            prompt.append("Perfil do Usuário: ").append(userProfile).append("\n\n");
        }

        prompt.append("Retorne APENAS um array JSON com este formato exato:\n")
              .append("[\n")
              .append("  {\n")
              .append("    \"name\": \"Nome do Treino\",\n")
              .append("    \"description\": \"Breve descrição\",\n")
              .append("    \"durationInMinutes\": 30,\n")
              .append("    \"caloriesBurnt\": 250\n")
              .append("  }\n")
              .append("]\n\n")
              .append("Requisitos:\n")
              .append("- Máximo 2 treinos\n")
              .append("- Estimativas de calorias realistas\n")
              .append("- Duração entre 15-90 minutos\n")
              .append("- Exercícios seguros e apropriados\n")
              .append("- RESPONDA EM PORTUGUÊS BRASILEIRO\n")
              .append("- Sem texto explicativo fora do JSON");

        return prompt.toString();
    }

    private String buildMealRecommendationPrompt(String userId, String userPrompt) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Gere 1-2 recomendações específicas de refeição com base nesta solicitação do usuário: \"")
              .append(userPrompt).append("\"\n\n");

        // Add user profile context if available
        String userProfile = getUserProfile(userId);
        if (userProfile != null && !userProfile.trim().isEmpty()) {
            prompt.append("Perfil do Usuário: ").append(userProfile).append("\n\n");
        }

        prompt.append("Retorne APENAS um array JSON com este formato exato:\n")
              .append("[\n")
              .append("  {\n")
              .append("    \"name\": \"Nome ESPECÍFICO da Refeição com Ingredientes\",\n")
              .append("    \"calories\": 400,\n")
              .append("    \"carbo\": 45.0,\n")
              .append("    \"protein\": 25.0,\n")
              .append("    \"fat\": 12.0\n")
              .append("  }\n")
              .append("]\n\n")
              .append("Requisitos:\n")
              .append("- Máximo 2 refeições\n")
              .append("- IMPORTANTE: O 'name' DEVE ser específico com ingredientes principais\n")
              .append("- EXEMPLOS DE NOMES CORRETOS: 'Arroz com Frango Grelhado e Brócolis', 'Pão Integral com Frango Desfiado e Alface', 'Salada Caesar com Frango', 'Omelete de 3 Ovos com Queijo e Tomate'\n")
              .append("- NUNCA use nomes genéricos como 'Jantar Rápido', 'Refeição Pós-Treino', 'Café da Manhã Saudável'\n")
              .append("- Valores nutricionais realistas baseados nos ingredientes\n")
              .append("- Macronutrientes balanceados\n")
              .append("- Calorias entre 150-800 por refeição\n")
              .append("- Ingredientes comuns e acessíveis brasileiros\n")
              .append("- RESPONDA EM PORTUGUÊS BRASILEIRO\n")
              .append("- Sem texto explicativo fora do JSON");

        return prompt.toString();
    }

    private List<RecommendationAction> parseWorkoutRecommendations(String jsonResponse) {
        try {
            // Extract JSON from response (in case there's extra text)
            String json = extractJson(jsonResponse);
            if (json == null) return null;

            // Parse JSON array into list of WorkoutRecommendationData
            TypeReference<List<WorkoutRecommendationData>> typeRef = new TypeReference<List<WorkoutRecommendationData>>() {};
            List<WorkoutRecommendationData> workouts = objectMapper.readValue(json, typeRef);

            if (workouts == null || workouts.isEmpty()) {
                return null;
            }

            // Convert each workout into a RecommendationAction
            List<RecommendationAction> actions = new ArrayList<>();
            for (WorkoutRecommendationData workout : workouts) {
                RecommendationAction action = new RecommendationAction(
                    "ADD_WORKOUT",
                    "Adicionar Treino Recomendado",
                    "Toque para adicionar este treino à sua coleção",
                    workout,
                    null
                );
                actions.add(action);
            }

            return actions.isEmpty() ? null : actions;
        } catch (Exception e) {
            logService.logError("CHATBOT_SERVICE", "Failed to parse workout recommendations", e.getMessage());
            return null;
        }
    }

    private List<RecommendationAction> parseMealRecommendations(String jsonResponse) {
        try {
            // Extract JSON from response (in case there's extra text)
            String json = extractJson(jsonResponse);
            if (json == null) return null;

            // Parse JSON array into list of MealRecommendationData
            TypeReference<List<MealRecommendationData>> typeRef = new TypeReference<List<MealRecommendationData>>() {};
            List<MealRecommendationData> meals = objectMapper.readValue(json, typeRef);

            if (meals == null || meals.isEmpty()) {
                return null;
            }

            // Convert each meal into a RecommendationAction
            List<RecommendationAction> actions = new ArrayList<>();
            for (MealRecommendationData meal : meals) {
                RecommendationAction action = new RecommendationAction(
                    "ADD_MEAL",
                    "Adicionar Refeição Recomendada",
                    "Toque para adicionar esta refeição à sua coleção",
                    null,
                    meal
                );
                actions.add(action);
            }

            return actions.isEmpty() ? null : actions;
        } catch (Exception e) {
            logService.logError("CHATBOT_SERVICE", "Failed to parse meal recommendations", e.getMessage());
            return null;
        }
    }

    private String extractJson(String response) {
        // Find JSON array in the response
        int start = response.indexOf('[');
        int end = response.lastIndexOf(']');

        if (start >= 0 && end > start) {
            return response.substring(start, end + 1);
        }

        return null;
    }

    public void executeRecommendationAction(String userId, RecommendationAction action) {
        try {
            if ("ADD_WORKOUT".equals(action.type()) && action.workoutData() != null) {
                executeWorkoutAction(userId, action.workoutData());
            } else if ("ADD_MEAL".equals(action.type()) && action.mealData() != null) {
                executeMealAction(userId, action.mealData());
            } else {
                throw new IllegalArgumentException("Invalid action type or missing data");
            }
        } catch (Exception e) {
            logService.logError("CHATBOT_SERVICE", "Failed to execute recommendation action", e.getMessage());
            throw new RuntimeException("Failed to execute action: " + e.getMessage());
        }
    }

    private void executeWorkoutAction(String userId, WorkoutRecommendationData workoutData) {
        try {
            // Create exercise record using existing service
            var exerciseRequest = new ExerciseRegisterCreateRequest(
                workoutData.name(),
                workoutData.description(),
                java.time.LocalDateTime.now(), // current timestamp
                workoutData.durationInMinutes(),
                workoutData.caloriesBurnt()
            );

            exerciseRegisterService.create(userId, exerciseRequest);
        } catch (Exception e) {
            logService.logError("CHATBOT_SERVICE", "Failed to save workout recommendation", e.getMessage());
            throw e;
        }
    }

    private void executeMealAction(String userId, MealRecommendationData mealData) {
        try {
            // Create meal record using existing service
            var mealRequest = new MealRegisterCreateRequest(
                mealData.name(),
                java.time.LocalDateTime.now(), // current timestamp
                mealData.calories(),
                mealData.carbo(),
                mealData.protein(),
                mealData.fat()
            );

            mealRegisterService.create(userId, mealRequest);
        } catch (Exception e) {
            logService.logError("CHATBOT_SERVICE", "Failed to save meal recommendation", e.getMessage());
            throw e;
        }
    }
}

