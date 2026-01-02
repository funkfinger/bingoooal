-- Add locked column to boards table
ALTER TABLE boards
ADD COLUMN locked BOOLEAN NOT NULL DEFAULT false;

-- Add comment to explain the column
COMMENT ON COLUMN boards.locked IS 'When true, goals cannot be added/edited/deleted, only marked as complete';

