package com.mindfit.api.service;

import com.mindfit.api.dto.ChatRequest;
import com.mindfit.api.dto.ChatResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ChatbotService {

    private final OpenAiChatModel openAiChatModel;

    public ChatResponse chat(ChatRequest request) {
        String systemPreamble = "You are a certified nutrition specialist and dietitian. " +
                "Provide evidence-based, safe, and practical guidance on nutrition, meal planning, " +
                "sports nutrition, weight management, and dietary restrictions or allergies. " +
                "Ask brief clarifying questions if necessary. If the topic requires medical diagnosis or treatment, " +
                "recommend consulting a healthcare professional. Important: Always respond in the same language as " +
                "the user's message.";

        String augmentedPrompt = systemPreamble + "\n\nUser message:\n" + request.prompt();

        String response = openAiChatModel.call(augmentedPrompt);
        return new ChatResponse(response);
    }
}
