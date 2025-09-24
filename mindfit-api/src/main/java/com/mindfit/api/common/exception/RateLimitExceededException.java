package com.mindfit.api.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.TOO_MANY_REQUESTS)
public class RateLimitExceededException extends RuntimeException {

    private final String userFriendlyMessage;
    private final long retryAfterSeconds;

    public RateLimitExceededException(String message, String userFriendlyMessage) {
        super(message);
        this.userFriendlyMessage = userFriendlyMessage;
        this.retryAfterSeconds = 3600; // Default to 1 hour
    }

    public RateLimitExceededException(String message, String userFriendlyMessage, long retryAfterSeconds) {
        super(message);
        this.userFriendlyMessage = userFriendlyMessage;
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public String getUserFriendlyMessage() {
        return userFriendlyMessage;
    }

    public long getRetryAfterSeconds() {
        return retryAfterSeconds;
    }
}