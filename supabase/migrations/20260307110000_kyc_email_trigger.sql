-- Migration: Trigger to send KYC status email on admin approval/rejection
-- Run this in Supabase SQL Editor after deploying the send-email edge function update

-- 1. The trigger function that fires the email via the send-email edge function
CREATE OR REPLACE FUNCTION notify_kyc_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_email TEXT;
  v_name  TEXT;
  v_template TEXT;
BEGIN
  -- Only fire when kyc_status actually changes to 'verified' or 'rejected'
  IF OLD.kyc_status = NEW.kyc_status THEN
    RETURN NEW;
  END IF;

  IF NEW.kyc_status NOT IN ('verified', 'rejected') THEN
    RETURN NEW;
  END IF;

  -- Get the user's email from auth.users
  SELECT email INTO v_email FROM auth.users WHERE id = NEW.id;
  v_name  := COALESCE(NEW.full_name, v_email);
  v_template := CASE NEW.kyc_status
    WHEN 'verified' THEN 'kyc_approved'
    WHEN 'rejected' THEN 'kyc_rejected'
  END;

  -- Call the send-email edge function asynchronously via pg_net
  PERFORM net.http_post(
    url    := current_setting('app.supabase_url') || '/functions/v1/send-email',
    body   := jsonb_build_object(
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
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
    )
  );

  RETURN NEW;
END;
$$;

-- 2. Drop old trigger if exists, then recreate
DROP TRIGGER IF EXISTS on_kyc_status_change ON public.profiles;

CREATE TRIGGER on_kyc_status_change
  AFTER UPDATE OF kyc_status ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_kyc_status_change();
