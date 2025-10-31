-- Clean database script for tests
-- Executed after each test method to ensure test isolation

DELETE FROM sensor_readings;
DELETE FROM sensors;
DELETE FROM user_roles;
DELETE FROM meal_registers;
DELETE FROM exercise_registers;
DELETE FROM measurements_registers;
DELETE FROM logs;
DELETE FROM users;
