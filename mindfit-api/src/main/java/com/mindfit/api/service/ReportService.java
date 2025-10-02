package com.mindfit.api.service;

import com.mindfit.api.dto.UserConsumptionReportResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.SqlOutParameter;
import org.springframework.jdbc.core.SqlParameter;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.simple.SimpleJdbcCall;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.sql.Types;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final JdbcTemplate jdbcTemplate;

    public UserConsumptionReportResponse generateConsumptionReport(String userId) {
        SimpleJdbcCall call = new SimpleJdbcCall(jdbcTemplate)
                .withProcedureName("sp_generate_user_consumption_report")
                .declareParameters(
                        new SqlParameter("p_user_id", Types.VARCHAR),
                        new SqlOutParameter("o_total_calories", Types.NUMERIC),
                        new SqlOutParameter("o_total_burned", Types.NUMERIC),
                        new SqlOutParameter("o_net_calories", Types.NUMERIC)
                )
                .withoutProcedureColumnMetaDataAccess();

        Map<String, Object> result = call.execute(
                new MapSqlParameterSource().addValue("p_user_id", userId)
        );

        BigDecimal totalCalories = toBigDecimal(result.get("o_total_calories"));
        BigDecimal totalBurned = toBigDecimal(result.get("o_total_burned"));
        BigDecimal netCalories = toBigDecimal(result.get("o_net_calories"));

        return new UserConsumptionReportResponse(
                userId,
                totalCalories,
                totalBurned,
                netCalories
        );
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value instanceof BigDecimal bigDecimal) {
            return bigDecimal;
        }
        if (value instanceof Number number) {
            return BigDecimal.valueOf(number.doubleValue());
        }
        return new BigDecimal(value.toString());
    }
}
