-- Create triggers to automatically update updated_at timestamp on record modification
-- These triggers ensure data integrity at the database level

-- Trigger for users table
CREATE OR REPLACE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
    :NEW.updated_at := CURRENT_TIMESTAMP;
END;
/

-- Trigger for meal_registers table
CREATE OR REPLACE TRIGGER trg_meal_registers_updated_at
BEFORE UPDATE ON meal_registers
FOR EACH ROW
BEGIN
    :NEW.updated_at := CURRENT_TIMESTAMP;
END;
/

-- Trigger for measurements_registers table
CREATE OR REPLACE TRIGGER trg_measurements_registers_updated_at
BEFORE UPDATE ON measurements_registers
FOR EACH ROW
BEGIN
    :NEW.updated_at := CURRENT_TIMESTAMP;
END;
/

-- Trigger for exercise_registers table
CREATE OR REPLACE TRIGGER trg_exercise_registers_updated_at
BEFORE UPDATE ON exercise_registers
FOR EACH ROW
BEGIN
    :NEW.updated_at := CURRENT_TIMESTAMP;
END;
/

-- Trigger for sensors table
CREATE OR REPLACE TRIGGER trg_sensors_updated_at
BEFORE UPDATE ON sensors
FOR EACH ROW
BEGIN
    :NEW.updated_at := CURRENT_TIMESTAMP;
END;
/
