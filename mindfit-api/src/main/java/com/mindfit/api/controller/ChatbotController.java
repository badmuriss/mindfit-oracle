package com.mindfit.api.controller;

import com.mindfit.api.enums.Role;
import com.mindfit.api.dto.ChatRequest;
import com.mindfit.api.dto.ChatResponse;
import com.mindfit.api.service.ChatbotService;
import com.mindfit.api.util.SecurityUtil;
import com.mindfit.api.service.RateLimitService;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/chatbot")
@RequiredArgsConstructor
@Tag(name = "Chatbot", description = "Chatbot API")
@SecurityRequirement(name = "bearerAuth")
public class ChatbotController {

    private final ChatbotService chatbotService;
    private final RateLimitService rateLimitService;

    @PostMapping
    @Operation(summary = "Chat with AI assistant")
    public ChatResponse chat(
            @Valid @RequestBody ChatRequest request) {
        
        Bucket bucket = rateLimitService.createBucketForUser(SecurityUtil.getCurrentUserId());
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
        
        if (!probe.isConsumed()) {
            throw new ResponseStatusException(
                    HttpStatus.TOO_MANY_REQUESTS, 
                    "Rate limit exceeded. Try again in " + probe.getNanosToWaitForRefill() / 1_000_000_000 + " seconds"
            );
        }
        
        return chatbotService.chat(SecurityUtil.getCurrentUserId(), request);
    }

    @DeleteMapping("/history")
    @Operation(summary = "Clear current user's chatbot history")
    public void clearHistory() {
        chatbotService.clearHistory(SecurityUtil.getCurrentUserId());
    }
}
