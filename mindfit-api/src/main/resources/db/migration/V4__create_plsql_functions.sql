-- PL/SQL functions for business logic

-- Function to calculate BMI from latest measurements
CREATE OR REPLACE FUNCTION fn_calculate_bmi(p_user_id IN VARCHAR2)
RETURN NUMBER
IS
    v_weight NUMBER;
    v_height NUMBER;
    v_bmi    NUMBER;
BEGIN
    SELECT weight_in_kg, height_in_cm
      INTO v_weight, v_height
      FROM (
            SELECT weight_in_kg, height_in_cm
              FROM measurements_registers
             WHERE user_id = p_user_id
             ORDER BY NVL(timestamp, created_at) DESC
          )
     WHERE ROWNUM = 1;

    IF v_weight IS NULL OR v_height IS NULL OR v_height = 0 THEN
        RETURN NULL;
    END IF;

    v_bmi := v_weight / POWER(v_height / 100, 2);
    RETURN ROUND(v_bmi, 2);
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RETURN NULL;
    WHEN ZERO_DIVIDE THEN
        RETURN NULL;
    WHEN OTHERS THEN
        RAISE;
END fn_calculate_bmi;
/

-- Function to format user profile information
CREATE OR REPLACE FUNCTION fn_format_user_profile(p_user_id IN VARCHAR2)
RETURN VARCHAR2
IS
    v_name        users.name%TYPE;
    v_last_login  users.last_logon_date%TYPE;
    v_weight      measurements_registers.weight_in_kg%TYPE;
    v_height      measurements_registers.height_in_cm%TYPE;
    v_bmi         NUMBER;
    v_result      VARCHAR2(4000);
BEGIN
    SELECT name, last_logon_date
      INTO v_name, v_last_login
      FROM users
     WHERE id = p_user_id;

    BEGIN
        SELECT weight_in_kg, height_in_cm
          INTO v_weight, v_height
          FROM (
                SELECT weight_in_kg, height_in_cm
                  FROM measurements_registers
                 WHERE user_id = p_user_id
                 ORDER BY NVL(timestamp, created_at) DESC
              )
         WHERE ROWNUM = 1;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            v_weight := NULL;
            v_height := NULL;
    END;

    v_bmi := fn_calculate_bmi(p_user_id);

    v_result := 'Usuário: ' || NVL(v_name, 'N/D') ||
                CHR(10) || 'Último login: ' || COALESCE(TO_CHAR(v_last_login, 'YYYY-MM-DD HH24:MI'), 'N/D') ||
                CHR(10) || 'Peso atual: ' || COALESCE(TO_CHAR(v_weight), 'N/D') || ' kg' ||
                CHR(10) || 'Altura: ' || COALESCE(TO_CHAR(v_height), 'N/D') || ' cm';

    IF v_bmi IS NOT NULL THEN
        v_result := v_result || CHR(10) || 'IMC estimado: ' || TO_CHAR(v_bmi);
    END IF;

    RETURN v_result;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RETURN 'Usuário não encontrado.';
    WHEN OTHERS THEN
        RETURN 'Erro ao formatar perfil: ' || SQLERRM;
END fn_format_user_profile;
/
