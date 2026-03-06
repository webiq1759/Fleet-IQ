CREATE OR REPLACE FUNCTION auto_complete_trips()
RETURNS void AS $$
BEGIN
  -- Mark trips as completed if they've been awaiting confirmation for 2+ hours
  UPDATE bookings
  SET status = 'Completed', updated_at = NOW()
  WHERE status = 'Awaiting Confirmation'
    AND updated_at < NOW() - INTERVAL '2 hours';
END;
$$ LANGUAGE plpgsql;

-- Schedule the job if pg_cron is enabled
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    -- Try to unschedule if it already exists to prevent duplicates
    PERFORM cron.unschedule('auto_complete_trips_job');
    -- Schedule to run every 15 minutes
    PERFORM cron.schedule('auto_complete_trips_job', '*/15 * * * *', 'SELECT auto_complete_trips();');
  END IF;
END $$;
