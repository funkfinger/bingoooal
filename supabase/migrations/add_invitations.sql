-- Add invitation functionality to the platform
-- This allows existing users to invite new users and track referrals

-- Add invited_by column to users table to track who invited them
ALTER TABLE users
ADD COLUMN invited_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Create index on invited_by for faster lookups
CREATE INDEX idx_users_invited_by ON users(invited_by);

-- Create invitations table to track invite tokens
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invite_token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  email TEXT, -- Optional: can pre-specify who the invite is for
  used_by UUID REFERENCES users(id) ON DELETE SET NULL, -- Track who used the invite
  used_at TIMESTAMPTZ, -- When the invite was used
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'), -- Invites expire after 30 days
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for faster lookups
CREATE INDEX idx_invitations_inviter_id ON invitations(inviter_id);
CREATE INDEX idx_invitations_invite_token ON invitations(invite_token);
CREATE INDEX idx_invitations_used_by ON invitations(used_by);

-- Enable Row Level Security
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Service role can manage invitations
CREATE POLICY "Service role can manage invitations"
  ON invitations FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add comments to document the tables
COMMENT ON COLUMN users.invited_by IS 'References the user who invited this user to the platform';
COMMENT ON TABLE invitations IS 'Tracks invitation tokens and their usage';
COMMENT ON COLUMN invitations.invite_token IS 'Unique token used in the invite URL';
COMMENT ON COLUMN invitations.email IS 'Optional: pre-specify the email address this invite is for';
COMMENT ON COLUMN invitations.used_by IS 'The user who used this invitation token';
COMMENT ON COLUMN invitations.used_at IS 'Timestamp when the invitation was used';
COMMENT ON COLUMN invitations.expires_at IS 'Invitation expiration timestamp (default 30 days from creation)';

