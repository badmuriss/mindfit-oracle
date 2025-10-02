-- Seed data for Mindfit Oracle database
-- Adjust timestamps as needed

INSERT INTO users (
    id, email, password, name, sex, birth_date, created_at,
    enabled, account_non_expired, account_non_locked, credentials_non_expired
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'alice@mindfit.dev',
    '$2a$10$Dow1Kqyi9SEzGyF/F7AiwuYVxZxEY0XaFzpTUN.Zj6MqFmoVoeAQ6', -- password: Password123
    'Alice Mindfit',
    'FEMALE',
    TO_DATE('1992-05-18', 'YYYY-MM-DD'),
    SYSTIMESTAMP,
    1, 1, 1, 1
);

INSERT INTO user_roles (user_id, role) VALUES ('11111111-1111-1111-1111-111111111111', 'USER');

INSERT INTO meal_registers (
    id, user_id, name, timestamp, calories, carbo, protein, fat, created_at
) VALUES (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'Café da Manhã Energético',
    TO_TIMESTAMP('2025-09-28 08:30:00', 'YYYY-MM-DD HH24:MI:SS'),
    420,
    55,
    20,
    10,
    SYSTIMESTAMP
);

INSERT INTO exercise_registers (
    id, user_id, name, description, timestamp, duration_in_minutes, calories_burnt, created_at
) VALUES (
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'Treino Funcional',
    'Circuito de alta intensidade com foco em condicionamento físico geral.',
    TO_TIMESTAMP('2025-09-28 18:15:00', 'YYYY-MM-DD HH24:MI:SS'),
    45,
    380,
    SYSTIMESTAMP
);

INSERT INTO measurements_registers (
    id, user_id, weight_in_kg, height_in_cm, timestamp, created_at
) VALUES (
    '44444444-4444-4444-4444-444444444444',
    '11111111-1111-1111-1111-111111111111',
    68.5,
    168,
    TO_TIMESTAMP('2025-09-27 09:00:00', 'YYYY-MM-DD HH24:MI:SS'),
    SYSTIMESTAMP
);

INSERT INTO logs (
    id, type, category, name, stack_trace, timestamp
) VALUES (
    '55555555-5555-5555-5555-555555555555',
    'INFO',
    'SYSTEM',
    'Initial seed event',
    'Seed data inserted for demo purposes',
    SYSTIMESTAMP
);

INSERT INTO sensors (
    id, user_id, sensor_type, location, created_at
) VALUES (
    '66666666-6666-6666-6666-666666666666',
    '11111111-1111-1111-1111-111111111111',
    'HEART_RATE',
    'Wristband',
    SYSTIMESTAMP
);

INSERT INTO sensor_readings (
    id, sensor_id, reading_value, reading_type, unit, reading_timestamp
) VALUES (
    '77777777-7777-7777-7777-777777777777',
    '66666666-6666-6666-6666-666666666666',
    128,
    'HEART_RATE',
    'BPM',
    TO_TIMESTAMP('2025-09-28 18:20:00', 'YYYY-MM-DD HH24:MI:SS')
);
