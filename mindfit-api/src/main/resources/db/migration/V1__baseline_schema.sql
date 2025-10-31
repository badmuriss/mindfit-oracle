-- Baseline schema for Mindfit Oracle database
-- Migration managed by Flyway

-- Users table
CREATE TABLE users (
    id VARCHAR2(36) PRIMARY KEY,
    email VARCHAR2(100) UNIQUE NOT NULL,
    password VARCHAR2(255) NOT NULL,
    name VARCHAR2(100),
    profile CLOB,
    sex VARCHAR2(10),
    birth_date DATE,
    last_logon_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    meal_recommendations_cache CLOB,
    meal_cache_expiry TIMESTAMP,
    workout_recommendations_cache CLOB,
    workout_cache_expiry TIMESTAMP,
    enabled NUMBER(1) DEFAULT 1,
    account_non_expired NUMBER(1) DEFAULT 1,
    account_non_locked NUMBER(1) DEFAULT 1,
    credentials_non_expired NUMBER(1) DEFAULT 1
);

-- User roles table (many-to-many)
CREATE TABLE user_roles (
    user_id VARCHAR2(36) NOT NULL,
    role VARCHAR2(30) NOT NULL,
    CONSTRAINT pk_user_roles PRIMARY KEY (user_id, role),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Meal registers table
CREATE TABLE meal_registers (
    id VARCHAR2(36) PRIMARY KEY,
    user_id VARCHAR2(36) NOT NULL,
    name VARCHAR2(100),
    timestamp TIMESTAMP,
    calories NUMBER,
    carbo NUMBER,
    protein NUMBER,
    fat NUMBER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_meal_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Measurements registers table
CREATE TABLE measurements_registers (
    id VARCHAR2(36) PRIMARY KEY,
    user_id VARCHAR2(36) NOT NULL,
    weight_in_kg NUMBER,
    height_in_cm NUMBER,
    timestamp TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_measurements_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Exercise registers table
CREATE TABLE exercise_registers (
    id VARCHAR2(36) PRIMARY KEY,
    user_id VARCHAR2(36) NOT NULL,
    name VARCHAR2(100),
    description CLOB,
    timestamp TIMESTAMP,
    duration_in_minutes NUMBER,
    calories_burnt NUMBER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_exercise_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Logs table
CREATE TABLE logs (
    id VARCHAR2(36) PRIMARY KEY,
    type VARCHAR2(20),
    category VARCHAR2(50),
    name VARCHAR2(100),
    stack_trace CLOB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sensors table
CREATE TABLE sensors (
    id VARCHAR2(36) PRIMARY KEY,
    user_id VARCHAR2(36),
    sensor_type VARCHAR2(50) NOT NULL,
    location VARCHAR2(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sensor_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Sensor readings table
CREATE TABLE sensor_readings (
    id VARCHAR2(36) PRIMARY KEY,
    sensor_id VARCHAR2(36) NOT NULL,
    reading_value NUMBER NOT NULL,
    reading_type VARCHAR2(50) NOT NULL,
    unit VARCHAR2(20),
    reading_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sensor_reading_sensor FOREIGN KEY (sensor_id) REFERENCES sensors(id)
);

-- Indexes for performance
-- Note: users(email) already has a UNIQUE constraint which creates an index automatically
CREATE INDEX idx_meal_user ON meal_registers(user_id);
CREATE INDEX idx_measurements_user ON measurements_registers(user_id);
CREATE INDEX idx_exercise_user ON exercise_registers(user_id);
CREATE INDEX idx_sensor_user ON sensors(user_id);
CREATE INDEX idx_sensor_reading_sensor ON sensor_readings(sensor_id);
