-- Drop ALL variations of the function to fix the "ambiguous function" error
DROP FUNCTION IF EXISTS check_asset_availability(UUID, DATE, DATE);
DROP FUNCTION IF EXISTS check_asset_availability(UUID, TIMESTAMP, TIMESTAMP);
DROP FUNCTION IF EXISTS check_asset_availability(UUID, DATE, DATE, UUID); -- In case an old version with exclude_booking_id exists

-- Recreate the single authoritative function
CREATE OR REPLACE FUNCTION check_asset_availability(
  p_asset_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  conflict_count INTEGER;
BEGIN
  -- Check for any booking for this asset that overlaps with the requested dates
  SELECT COUNT(*)
  INTO conflict_count
  FROM bookings
  WHERE asset_id = p_asset_id
    AND status NOT IN ('Cancelled', 'Rejected')
    AND (start_date <= p_end_date AND end_date >= p_start_date);

  RETURN conflict_count = 0;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_asset_availability(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION check_asset_availability(UUID, DATE, DATE) TO anon;
GRANT EXECUTE ON FUNCTION check_asset_availability(UUID, DATE, DATE) TO service_role;
