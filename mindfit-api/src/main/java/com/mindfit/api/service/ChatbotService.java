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
        String response = openAiChatModel.call(request.prompt());
        return new ChatResponse(response);
    }
}