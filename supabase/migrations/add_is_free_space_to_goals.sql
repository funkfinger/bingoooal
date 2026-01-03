-- Add is_free_space column to goals table
ALTER TABLE goals
ADD COLUMN is_free_space BOOLEAN DEFAULT FALSE;

-- Update existing position 12 goals to be free spaces
UPDATE goals
SET is_free_space = TRUE
WHERE position = 12 AND text = 'FREE SPACE';

-- Add comment to document the column
COMMENT ON COLUMN goals.is_free_space IS 'Indicates if this goal is a free space (auto-completed, cannot be edited/deleted)';

