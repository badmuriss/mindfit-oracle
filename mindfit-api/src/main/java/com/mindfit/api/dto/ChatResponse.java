package com.mindfit.api.dto;

import java.util.List;

public record ChatResponse(
        String response,
        List<RecommendationAction> actions // Optional field for recommendations
) {}