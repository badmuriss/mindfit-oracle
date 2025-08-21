package com.mindfit.api.service;

import com.mindfit.api.dto.ChatRequest;
import com.mindfit.api.dto.ChatResponse;
import com.mindfit.api.model.User;
import com.mindfit.api.repository.UserRepository;
import com.mindfit.api.service.LogService;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.stereotype.Service;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class ChatbotService {

    private final OpenAiChatModel openAiChatModel;
    private final UserRepository userRepository;
    private final LogService logService;
    private final Map<String, Deque<String>> conversations = new ConcurrentHashMap<>();
    private static final int MAX_TURNS = 10; // keep last 10 user-assistant exchanges

    public ChatResponse chat(String userId, ChatRequest request) {
        // Get user profile for personalization
        String userProfile = getUserProfile(userId);
        
        String systemPreamble = "You are a certified nutrition specialist and dietitian. " +
                "Provide evidence-based, safe, and practical guidance on nutrition, meal planning, " +
                "sports nutrition, weight management, and dietary restrictions or allergies. " +
                "Give direct and personalized answers based on the user's profile when available. " +
                "If the topic requires medical diagnosis or treatment, " +
                "recommend consulting a healthcare professional. Important: Always respond in the same language as " +
                "the user's message.";

        Deque<String> history = conversations.computeIfAbsent(userId, k -> new ArrayDeque<>());

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
        convo.append("User:").append(" ").append(request.prompt()).append("\n");
        convo.append("Assistant:");

        String response = openAiChatModel.call(convo.toString());

        // Save the new turn; each turn is stored as two entries: User and Assistant
        history.addLast("User: " + request.prompt());
        history.addLast("Assistant: " + response);

        // Trim history to last MAX_TURNS exchanges (2 entries per turn)
        while (history.size() > MAX_TURNS * 2) {
            history.pollFirst(); // remove oldest entry
        }

        return new ChatResponse(response);
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
}
