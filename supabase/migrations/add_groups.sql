-- Add group management functionality
-- Each user gets one personal group for managing friends and sharing boards

-- Create groups table
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(owner_id) -- Each user can only have one group
);

-- Create index on owner_id for faster lookups
CREATE INDEX idx_groups_owner_id ON groups(owner_id);

-- Create group_members table to track who belongs to which groups
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- 'owner' or 'member'
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id) -- A user can only be in a group once
);

-- Create indexes for faster lookups
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);

-- Create board_shares table to track which boards are shared with which groups
CREATE TABLE board_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  permission TEXT NOT NULL DEFAULT 'view', -- 'view' or 'edit'
  shared_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  shared_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(board_id, group_id) -- A board can only be shared once per group
);

-- Create indexes for faster lookups
CREATE INDEX idx_board_shares_board_id ON board_shares(board_id);
CREATE INDEX idx_board_shares_group_id ON board_shares(group_id);

-- Enable Row Level Security
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Service role can manage all tables
CREATE POLICY "Service role can manage groups"
  ON groups FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage group_members"
  ON group_members FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage board_shares"
  ON board_shares FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add comments to document the tables
COMMENT ON TABLE groups IS 'Personal groups for each user to manage friends and share boards';
COMMENT ON COLUMN groups.owner_id IS 'The user who owns this group (one group per user)';

COMMENT ON TABLE group_members IS 'Tracks which users belong to which groups';
COMMENT ON COLUMN group_members.role IS 'Role in the group: owner or member';

COMMENT ON TABLE board_shares IS 'Tracks which boards are shared with which groups and permission level';
COMMENT ON COLUMN board_shares.permission IS 'Permission level: view (read-only) or edit (collaborative)';

-- Create groups for all existing users
-- This ensures existing users get their personal group
INSERT INTO groups (owner_id)
SELECT id FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM groups WHERE groups.owner_id = users.id
);

-- Add each user as the owner of their own group
INSERT INTO group_members (group_id, user_id, role)
SELECT g.id, g.owner_id, 'owner'
FROM groups g
WHERE NOT EXISTS (
  SELECT 1 FROM group_members gm 
  WHERE gm.group_id = g.id AND gm.user_id = g.owner_id
);

