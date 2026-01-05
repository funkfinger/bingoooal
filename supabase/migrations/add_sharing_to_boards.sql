-- Add sharing functionality to boards table
-- share_token: A unique UUID that makes the board accessible via a hard-to-guess URL
-- is_public: A boolean toggle to enable/disable sharing without losing the share_token

-- Add share_token column (UUID for security)
ALTER TABLE boards
ADD COLUMN share_token UUID UNIQUE DEFAULT gen_random_uuid();

-- Add is_public column (boolean to toggle sharing on/off)
ALTER TABLE boards
ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT false;

-- Add index on share_token for faster lookups when accessing shared boards
CREATE INDEX idx_boards_share_token ON boards(share_token) WHERE is_public = true;

-- Add comments to explain the columns
COMMENT ON COLUMN boards.share_token IS 'Unique token for sharing the board publicly. Generated automatically and remains constant even when sharing is toggled off.';
COMMENT ON COLUMN boards.is_public IS 'When true, the board can be viewed by anyone with the share_token. When false, only the owner can view the board.';

