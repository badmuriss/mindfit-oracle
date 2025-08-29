package com.mindfit.api.service;

import io.github.bucket4j.Bucket;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Refill;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimitService {

    private final ConcurrentHashMap<String, Bucket> buckets = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Bucket> profileGenerationBuckets = new ConcurrentHashMap<>();

    public Bucket createBucketForUser(String userId) {
        return buckets.computeIfAbsent(userId, this::newBucket);
    }
    
    public Bucket createBucketForProfileGeneration(String userId) {
        return profileGenerationBuckets.computeIfAbsent(userId + "_profile", this::newProfileGenerationBucket);
    }

    private Bucket newBucket(String userId) {
        Bandwidth limit = Bandwidth.classic(20, Refill.intervally(20, Duration.ofMinutes(1)));
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }
    
    private Bucket newProfileGenerationBucket(String key) {
        // Allow 5 profile generations per hour per user
        Bandwidth limit = Bandwidth.classic(5, Refill.intervally(5, Duration.ofHours(1)));
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }
}