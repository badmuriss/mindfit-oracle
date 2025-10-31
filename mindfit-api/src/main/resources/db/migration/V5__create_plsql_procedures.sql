-- PL/SQL stored procedures for business operations

-- Procedure to generate user calorie consumption report
CREATE OR REPLACE PROCEDURE sp_generate_user_consumption_report(
    p_user_id        IN  VARCHAR2,
    o_total_calories OUT NUMBER,
    o_total_burned   OUT NUMBER,
    o_net_calories   OUT NUMBER
)
IS
BEGIN
    SELECT NVL(SUM(calories), 0)
      INTO o_total_calories
      FROM meal_registers
     WHERE user_id = p_user_id;

    SELECT NVL(SUM(calories_burnt), 0)
      INTO o_total_burned
      FROM exercise_registers
     WHERE user_id = p_user_id;

    o_net_calories := o_total_calories - o_total_burned;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        o_total_calories := 0;
        o_total_burned := 0;
        o_net_calories := 0;
    WHEN OTHERS THEN
        RAISE_APPLICATION_ERROR(-20010, 'Erro ao gerar relatório: ' || SQLERRM);
END sp_generate_user_consumption_report;
/

-- Procedure to register sensor reading and create alert log if threshold exceeded
CREATE OR REPLACE PROCEDURE sp_register_sensor_alert(
    p_sensor_id      IN VARCHAR2,
    p_reading_value  IN NUMBER,
    p_unit           IN VARCHAR2,
    p_reading_type   IN VARCHAR2,
    p_threshold      IN NUMBER,
    p_description    IN VARCHAR2 DEFAULT NULL
)
IS
    v_sensor_type sensors.sensor_type%TYPE;
    v_user_id     sensors.user_id%TYPE;
    v_reading_id  VARCHAR2(36);
    v_log_id      VARCHAR2(36);
BEGIN
    SELECT sensor_type, user_id
      INTO v_sensor_type, v_user_id
      FROM sensors
     WHERE id = p_sensor_id;

    v_reading_id := LOWER(REGEXP_REPLACE(RAWTOHEX(SYS_GUID()), '(.{8})(.{4})(.{4})(.{4})(.{12})', '\1-\2-\3-\4-\5'));

    INSERT INTO sensor_readings (
        id, sensor_id, reading_value, reading_type, unit, reading_timestamp
    ) VALUES (
        v_reading_id,
        p_sensor_id,
        p_reading_value,
        p_reading_type,
        p_unit,
        SYSTIMESTAMP
    );

    IF p_threshold IS NOT NULL AND p_reading_value >= p_threshold THEN
        v_log_id := LOWER(REGEXP_REPLACE(RAWTOHEX(SYS_GUID()), '(.{8})(.{4})(.{4})(.{4})(.{12})', '\1-\2-\3-\4-\5'));

        INSERT INTO logs (
            id, type, category, name, stack_trace, timestamp
        ) VALUES (
            v_log_id,
            'WARNING',
            'SENSOR_ALERT',
            'Alerta ' || v_sensor_type,
            'Sensor ' || p_sensor_id || ' registrou ' || p_reading_value || ' ' || NVL(p_unit, '') ||
            ' (limite: ' || p_threshold || '). ' || NVL(p_description, 'Sem descrição adicional.'),
            SYSTIMESTAMP
        );
    END IF;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20020, 'Sensor não encontrado: ' || p_sensor_id);
    WHEN OTHERS THEN
        RAISE_APPLICATION_ERROR(-20021, 'Falha ao registrar leitura/alerta: ' || SQLERRM);
END sp_register_sensor_alert;
/
