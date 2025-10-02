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
    private final ConcurrentHashMap<String, Bucket> recommendationBuckets = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Bucket> mealRecommendationBuckets = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Bucket> workoutRecommendationBuckets = new ConcurrentHashMap<>();

    public Bucket createBucketForUser(String userId) {
        return buckets.computeIfAbsent(userId, this::newBucket);
    }
    
    public Bucket createBucketForProfileGeneration(String userId) {
        return profileGenerationBuckets.computeIfAbsent(userId + "_profile", this::newProfileGenerationBucket);
    }

    public Bucket createBucketForRecommendations(String userId) {
        return recommendationBuckets.computeIfAbsent(userId + "_recommendations", this::newRecommendationBucket);
    }

    public Bucket createBucketForMealRecommendations(String userId) {
        return mealRecommendationBuckets.computeIfAbsent(userId + "_meal_recommendations", this::newMealRecommendationBucket);
    }

    public Bucket createBucketForWorkoutRecommendations(String userId) {
        return workoutRecommendationBuckets.computeIfAbsent(userId + "_workout_recommendations", this::newWorkoutRecommendationBucket);
    }

    private Bucket newBucket(String userId) {
        Bandwidth limit = Bandwidth.classic(20, Refill.intervally(20, Duration.ofMinutes(1)));
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }
    
    private Bucket newProfileGenerationBucket(String key) {
        // Permite até 5 gerações de perfil por hora para cada usuário
        Bandwidth limit = Bandwidth.classic(5, Refill.intervally(5, Duration.ofHours(1)));
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }

    private Bucket newRecommendationBucket(String key) {
        // Permite até 20 recomendações por hora para cada usuário
        Bandwidth limit = Bandwidth.classic(20, Refill.intervally(20, Duration.ofHours(1)));
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }

    private Bucket newMealRecommendationBucket(String key) {
        // Permite até 20 gerações de recomendação de refeição por hora
        Bandwidth limit = Bandwidth.classic(20, Refill.intervally(15, Duration.ofHours(1)));
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }

    private Bucket newWorkoutRecommendationBucket(String key) {
        // Permite até 20 gerações de recomendação de treino por hora
        Bandwidth limit = Bandwidth.classic(20, Refill.intervally(15, Duration.ofHours(1)));
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }
}