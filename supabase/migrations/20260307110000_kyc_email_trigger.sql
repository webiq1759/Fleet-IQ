-- Migration: Trigger to send KYC status email on admin approval/rejection
-- =======================================================================
-- BEFORE RUNNING: Replace YOUR_SERVICE_ROLE_KEY below with your actual
-- Supabase service role key from: Settings → API → service_role (secret)
-- =======================================================================

-- 1. Enable pg_net extension (needed for HTTP calls from triggers)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. The trigger function
CREATE OR REPLACE FUNCTION notify_kyc_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_email    TEXT;
  v_name     TEXT;
  v_template TEXT;
  v_key      TEXT := 'YOUR_SERVICE_ROLE_KEY'; -- ← paste your service role key here
BEGIN
  -- Only fire when kyc_status actually changes to 'verified' or 'rejected'
  IF OLD.kyc_status IS NOT DISTINCT FROM NEW.kyc_status THEN
    RETURN NEW;
  END IF;

  IF NEW.kyc_status NOT IN ('verified', 'rejected') THEN
    RETURN NEW;
  END IF;

  -- Get the user's email from auth.users
  SELECT email INTO v_email FROM auth.users WHERE id = NEW.id;
  v_name     := COALESCE(NEW.full_name, v_email);
  v_template := CASE NEW.kyc_status
    WHEN 'verified' THEN 'kyc_approved'
    WHEN 'rejected' THEN 'kyc_rejected'
  END;

  -- Call the send-email edge function
  PERFORM net.http_post(
    url     := 'https://sabewasybcopihdjcnmb.supabase.co/functions/v1/send-email',
    body    := jsonb_build_object(
      'to',       v_email,
      'template', v_template,
      'data',     jsonb_build_object(
        'ownerName',     v_name,
        'email',         v_email,
        'rejectionNote', NEW.kyc_rejection_note
      )
    )::text,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || v_key
    )
  );

  -- Insert in-app notification
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    is_read
  ) VALUES (
    NEW.id,
    CASE NEW.kyc_status
      WHEN 'verified' THEN 'Account Verified'
      WHEN 'rejected' THEN 'Verification Rejected'
    END,
    CASE NEW.kyc_status
      WHEN 'verified' THEN 'Your identity has been successfully verified. You now have full access to Fleet IQ features.'
      WHEN 'rejected' THEN 'Your identity verification was rejected. Reason: ' || COALESCE(NEW.kyc_rejection_note, 'Please contact support')
    END,
    'system',
    false
  );

  RETURN NEW;
END;
$$;

-- 3. Create the trigger
DROP TRIGGER IF EXISTS on_kyc_status_change ON public.profiles;

CREATE TRIGGER on_kyc_status_change
  AFTER UPDATE OF kyc_status ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_kyc_status_change();
