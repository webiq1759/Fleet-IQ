-- Update get_asset_unavailable_dates to block 'New' bookings as well
CREATE OR REPLACE FUNCTION get_asset_unavailable_dates(p_asset_id UUID)
RETURNS TABLE (
  start_date DATE,
  end_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT b.start_date, b.end_date
  FROM bookings b
  WHERE b.asset_id = p_asset_id
    AND b.status NOT IN ('Cancelled', 'Rejected');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
