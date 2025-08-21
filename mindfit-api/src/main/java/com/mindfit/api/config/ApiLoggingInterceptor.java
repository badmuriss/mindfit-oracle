package com.mindfit.api.config;

import com.mindfit.api.service.LogService;
import com.mindfit.api.util.SecurityUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.nio.charset.StandardCharsets;

@Component
@RequiredArgsConstructor
public class ApiLoggingInterceptor implements HandlerInterceptor {

    private final LogService logService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        long startTime = System.currentTimeMillis();
        request.setAttribute("startTime", startTime);
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        Long startTime = (Long) request.getAttribute("startTime");
        long duration = startTime != null ? System.currentTimeMillis() - startTime : 0;

        try {
            String userId;
            try {
                userId = SecurityUtil.getCurrentUserId();
            } catch (Exception e) {
                // Handle unauthenticated requests (like auth endpoints)
                userId = "anonymous";
            }
            
            String endpoint = request.getRequestURI();
            String method = request.getMethod();
            String ipAddress = getClientIpAddress(request);
            String userAgent = request.getHeader("User-Agent");

            String requestBody = "";
            String responseBody = "";

            if (request instanceof ContentCachingRequestWrapper cachingRequest) {
                byte[] content = cachingRequest.getContentAsByteArray();
                if (content.length > 0) {
                    requestBody = new String(content, StandardCharsets.UTF_8);
                }
            }

            if (response instanceof ContentCachingResponseWrapper cachingResponse) {
                byte[] content = cachingResponse.getContentAsByteArray();
                if (content.length > 0) {
                    responseBody = new String(content, StandardCharsets.UTF_8);
                }
            }

            String details = String.format("User: %s, Status: %d, Duration: %dms, IP: %s", 
                userId, response.getStatus(), duration, ipAddress);
            
            logService.logApiCall(endpoint, method, details);
        } catch (Exception e) {
            logService.logError("API_LOGGING", "Failed to log API call", e.getMessage());
        }
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0];
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }
}