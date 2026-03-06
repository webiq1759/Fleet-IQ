-- Migration for Withdrawal PIN

-- Enable pgcrypto if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add the generic pin column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS withdrawal_pin_hash TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pin_failed_attempts INTEGER DEFAULT 0;

-- RPC to setup the withdrawal pin (can only be done once unless reset by admin)
CREATE OR REPLACE FUNCTION setup_withdrawal_pin(p_pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_uid UUID;
    v_existing_hash TEXT;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Check if pin is already set
    SELECT withdrawal_pin_hash INTO v_existing_hash FROM public.profiles WHERE id = v_uid;
    IF v_existing_hash IS NOT NULL THEN
        RAISE EXCEPTION 'PIN is already set up.';
    END IF;

    -- Make sure it's 4 digits
    IF p_pin !~ '^[0-9]{4}$' THEN
        RAISE EXCEPTION 'PIN must be exactly 4 digits.';
    END IF;

    UPDATE public.profiles
    SET withdrawal_pin_hash = crypt(p_pin, gen_salt('bf'))
    WHERE id = v_uid;

    RETURN TRUE;
END;
$$;

-- RPC to check security status
CREATE OR REPLACE FUNCTION get_withdrawal_security_status()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_uid UUID;
    v_hash TEXT;
    v_attempts INTEGER;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN
        RETURN '{"isSetup": false, "isLocked": false, "attemptsLeft": 3}'::JSONB;
    END IF;
    
    SELECT withdrawal_pin_hash, COALESCE(pin_failed_attempts, 0)
    INTO v_hash, v_attempts 
    FROM public.profiles 
    WHERE id = v_uid;

    RETURN jsonb_build_object(
        'isSetup', (v_hash IS NOT NULL),
        'isLocked', (v_attempts >= 3),
        'attemptsLeft', GREATEST(0, 3 - v_attempts)
    );
END;
$$;

-- Wrapper RPC that enforces PIN validation before calling the original request_payout
DROP FUNCTION IF EXISTS request_payout_secured(UUID, NUMERIC, JSONB, TEXT);
CREATE OR REPLACE FUNCTION request_payout_secured(
    p_wallet_id UUID,
    p_amount NUMERIC(10,2),
    p_bank_details JSONB,
    p_pin TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_uid UUID;
    v_hash TEXT;
    v_attempts INTEGER;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    -- Retrieve the hash
    SELECT withdrawal_pin_hash, COALESCE(pin_failed_attempts, 0)
    INTO v_hash, v_attempts
    FROM public.profiles 
    WHERE id = v_uid;

    IF v_hash IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Withdrawal PIN is not set up.');
    END IF;

    IF v_attempts >= 3 THEN 
        RETURN jsonb_build_object('success', false, 'error', 'Withdrawals locked. Too many failed PIN attempts. Please contact support.');
    END IF;

    -- Verify the PIN
    IF v_hash != crypt(p_pin, v_hash) THEN
        UPDATE public.profiles SET pin_failed_attempts = pin_failed_attempts + 1 WHERE id = v_uid;
        RETURN jsonb_build_object('success', false, 'error', 'Invalid withdrawal PIN.');
    END IF;

    -- Reset on success
    UPDATE public.profiles SET pin_failed_attempts = 0 WHERE id = v_uid;

    -- Call the original, unaltered payout request logic
    PERFORM public.request_payout(p_wallet_id, p_amount, p_bank_details);
    
    RETURN jsonb_build_object('success', true);
END;
$$;
