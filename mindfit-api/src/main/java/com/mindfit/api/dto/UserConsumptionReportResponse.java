package com.mindfit.api.dto;

import java.math.BigDecimal;

public record UserConsumptionReportResponse(
        String userId,
        BigDecimal totalCaloriesConsumed,
        BigDecimal totalCaloriesBurned,
        BigDecimal netCalories
) {
}
