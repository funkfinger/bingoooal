-- Add RLS policy to allow public read access to shared boards
-- This allows unauthenticated users to view boards when is_public=true

-- Add policy for public read access to shared boards
CREATE POLICY "Public can view shared boards"
  ON boards FOR SELECT
  USING (is_public = true);

-- Add policy for public read access to goals on shared boards
CREATE POLICY "Public can view goals on shared boards"
  ON goals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = goals.board_id
      AND boards.is_public = true
    )
  );

-- Add comments
COMMENT ON POLICY "Public can view shared boards" ON boards IS 'Allows anyone to view boards that have is_public set to true';
COMMENT ON POLICY "Public can view goals on shared boards" ON goals IS 'Allows anyone to view goals on boards that have is_public set to true';

