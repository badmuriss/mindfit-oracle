package com.mindfit.api.filter;

import com.mindfit.api.service.LogService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@RequiredArgsConstructor
public class RequestValidationFilter extends OncePerRequestFilter {

    private final LogService logService;
    
    private static final Set<String> ALLOWED_METHODS = Set.of(
            "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD", "TRACE"
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String method = request.getMethod();
        String uri = request.getRequestURI();
        
        if (!isValidHttpMethod(method)) {
            String clientIp = getClientIpAddress(request);
            String logDetails = String.format("Blocked invalid HTTP method: %s from IP: %s for URI: %s", 
                    method, clientIp, uri);
            
            log.warn(logDetails);
            logService.logWarning("SECURITY", "Invalid HTTP Method", logDetails);
            
            response.setStatus(HttpStatus.BAD_REQUEST.value());
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Invalid HTTP method\",\"status\":400}");
            return;
        }

        if (!isValidUri(uri)) {
            String clientIp = getClientIpAddress(request);
            String logDetails = String.format("Blocked invalid URI: %s from IP: %s", uri, clientIp);
            
            log.warn(logDetails);
            logService.logWarning("SECURITY", "Invalid URI Format", logDetails);
            
            response.setStatus(HttpStatus.BAD_REQUEST.value());
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Invalid URI format\",\"status\":400}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isValidHttpMethod(String method) {
        if (method == null || method.trim().isEmpty()) {
            return false;
        }
        
        return ALLOWED_METHODS.contains(method.toUpperCase()) && 
               method.matches("^[A-Z]+$") && 
               method.length() <= 10;
    }

    private boolean isValidUri(String uri) {
        if (uri == null) {
            return false;
        }
        
        return uri.length() <= 2048 && 
               !uri.contains("..") && 
               uri.matches("^[a-zA-Z0-9/_.-]*(?:\\?[a-zA-Z0-9&=_.-]*)?$");
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
}