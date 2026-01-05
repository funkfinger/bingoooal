import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Board, Goal } from "@/lib/types";
import BoardClient from "./BoardClient";

interface BoardPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    share?: string;
  }>;
}

export default async function BoardPage({
  params,
  searchParams,
}: BoardPageProps) {
  // Await params for Next.js 16 compatibility
  const { id } = await params;
  const searchParamsResolved = await searchParams;
  const share = searchParamsResolved?.share;

  const session = await auth();

  // Fetch the board
  const { data: board, error: boardError } = await supabase
    .from("boards")
    .select("*")
    .eq("id", id)
    .single();

  if (boardError || !board) {
    redirect("/dashboard");
  }

  const boardData = board as Board;

  // Check if user is the board owner
  const isOwner = session?.user?.id === boardData.user_id;

  // Check if this is a valid shared board access (share token matches and board is public)
  const hasValidShareToken = Boolean(
    share && share === boardData.share_token && boardData.is_public
  );

  // Determine if this should be a read-only shared view
  // Only show as shared view if: has valid share token AND user is NOT the owner
  const isSharedView = hasValidShareToken && !isOwner;

  // If not a valid share access and not authenticated, redirect to login
  if (!hasValidShareToken && !session?.user) {
    redirect("/login");
  }

  // If authenticated but not owner and no valid share token, redirect to dashboard
  if (session?.user && !isOwner && !hasValidShareToken) {
    redirect("/dashboard");
  }

  // Fetch goals for this board
  const { data: goals, error: goalsError } = await supabase
    .from("goals")
    .select("*")
    .eq("board_id", id)
    .order("position", { ascending: true });

  if (goalsError) {
    console.error("Error fetching goals:", goalsError);
  }

  const boardGoals: Goal[] = goals || [];

  return (
    <BoardClient
      user={session?.user || null}
      board={boardData}
      initialGoals={boardGoals}
      isSharedView={isSharedView}
    />
  );
}
