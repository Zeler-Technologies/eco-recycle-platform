-- Drop existing function and create new Swedish PNR validation function
DROP FUNCTION IF EXISTS public.validate_swedish_pnr(text);

CREATE OR REPLACE FUNCTION public.validate_swedish_pnr(pnr text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    digits text;
    year_part integer;
    month_part integer;
    day_part integer;
    control_digits text;
    actual_day integer;
    test_date date;
    check_digits text;
    checksum_digit integer;
    sum_val integer;
    digit_val integer;
    calculated_checksum integer;
    i integer;
BEGIN
    -- Remove all non-digits
    digits := regexp_replace(pnr, '\D', '', 'g');
    
    -- Check length (10 or 12 digits)
    IF length(digits) NOT IN (10, 12) THEN
        RETURN false;
    END IF;
    
    -- Extract parts based on format
    IF length(digits) = 10 THEN
        -- YYMMDDXXXX format
        year_part := substring(digits, 1, 2)::integer;
        month_part := substring(digits, 3, 2)::integer;
        day_part := substring(digits, 5, 2)::integer;
        control_digits := substring(digits, 7, 4);
        
        -- Determine century
        IF year_part > EXTRACT(year FROM CURRENT_DATE)::integer % 100 THEN
            year_part := year_part + (EXTRACT(year FROM CURRENT_DATE)::integer / 100 - 1) * 100;
        ELSE
            year_part := year_part + (EXTRACT(year FROM CURRENT_DATE)::integer / 100) * 100;
        END IF;
    ELSE
        -- YYYYMMDDXXXX format
        year_part := substring(digits, 1, 4)::integer;
        month_part := substring(digits, 5, 2)::integer;
        day_part := substring(digits, 7, 2)::integer;
        control_digits := substring(digits, 9, 4);
    END IF;
    
    -- Validate month
    IF month_part < 1 OR month_part > 12 THEN
        RETURN false;
    END IF;
    
    -- Validate day (handle coordination numbers)
    IF day_part > 60 THEN
        actual_day := day_part - 60;
    ELSE
        actual_day := day_part;
    END IF;
    
    IF actual_day < 1 OR actual_day > 31 THEN
        RETURN false;
    END IF;
    
    -- Validate actual date
    BEGIN
        test_date := make_date(year_part, month_part, actual_day);
    EXCEPTION WHEN OTHERS THEN
        RETURN false;
    END;
    
    -- Luhn algorithm check
    check_digits := substring(digits, 1, length(digits) - 1);
    checksum_digit := substring(digits, length(digits), 1)::integer;
    
    sum_val := 0;
    FOR i IN 1..length(check_digits) LOOP
        digit_val := substring(check_digits, i, 1)::integer;
        IF i % 2 = 0 THEN
            digit_val := digit_val * 2;
            IF digit_val > 9 THEN
                digit_val := digit_val / 10 + digit_val % 10;
            END IF;
        END IF;
        sum_val := sum_val + digit_val;
    END LOOP;
    
    calculated_checksum := (10 - (sum_val % 10)) % 10;
    
    RETURN calculated_checksum = checksum_digit;
END;
$function$;