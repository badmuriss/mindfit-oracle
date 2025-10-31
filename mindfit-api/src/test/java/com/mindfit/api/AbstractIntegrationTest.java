package com.mindfit.api;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.transaction.annotation.Transactional;

/**
 * Abstract base class for integration tests.
 * Provides common configuration for Spring Boot tests with H2 database.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
@Sql(scripts = "/clean-database.sql", executionPhase = Sql.ExecutionPhase.AFTER_TEST_METHOD)
public abstract class AbstractIntegrationTest {
    // Common test configuration and utilities can be added here
}
