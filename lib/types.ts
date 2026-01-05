// Database types for Bingoooal

export interface Board {
  id: string;
  user_id: string;
  title: string;
  year: number;
  locked: boolean;
  share_token: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  board_id: string;
  position: number; // 0-24 for 5x5 grid
  text: string;
  completed: boolean;
  completed_at: string | null;
  is_free_space: boolean; // Free space goals are auto-completed and cannot be edited/deleted
  created_at: string;
  updated_at: string;
}

// API request/response types
export interface CreateBoardRequest {
  title: string;
  year: number;
  include_free_space?: boolean;
}

export interface CreateBoardResponse {
  success: boolean;
  board?: Board;
  error?: string;
}

export interface CreateGoalRequest {
  board_id: string;
  position: number;
  text: string;
  is_free_space?: boolean;
}

export interface CreateGoalResponse {
  success: boolean;
  goal?: Goal;
  error?: string;
}

export interface UpdateGoalRequest {
  text?: string;
  completed?: boolean;
  is_free_space?: boolean;
}

export interface UpdateGoalResponse {
  success: boolean;
  goal?: Goal;
  error?: string;
}

export interface DeleteGoalResponse {
  success: boolean;
  error?: string;
}

export interface ToggleLockResponse {
  success: boolean;
  locked?: boolean;
  error?: string;
}
export interface ToggleShareRequest {
  board_id: string;
  is_public: boolean;
}

export interface ToggleShareResponse {
  success: boolean;
  is_public?: boolean;
  share_token?: string;
  share_url?: string;
  error?: string;
}

// Invitation types
export interface Invitation {
  id: string;
  inviter_id: string;
  invite_token: string;
  email: string | null;
  used_by: string | null;
  used_at: string | null;
  expires_at: string;
  created_at: string;
}

export interface CreateInvitationRequest {
  email?: string; // Optional: pre-specify who the invite is for
}

export interface CreateInvitationResponse {
  success: boolean;
  invitation?: Invitation;
  invite_url?: string;
  error?: string;
}

// Group types
export interface Group {
  id: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: "owner" | "member";
  joined_at: string;
}

export interface BoardShare {
  id: string;
  board_id: string;
  group_id: string;
  permission: "view" | "edit";
  shared_at: string;
  shared_by: string;
}
