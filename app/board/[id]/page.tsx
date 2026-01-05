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

  // Check if this is a shared board access
  const isSharedAccess = Boolean(
    share && share === boardData.share_token && boardData.is_public
  );

  // If not shared access, require authentication and ownership
  if (!isSharedAccess) {
    if (!session?.user) {
      redirect("/login");
    }

    // Verify the board belongs to the user
    if (boardData.user_id !== session.user.id) {
      redirect("/dashboard");
    }
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
      isSharedView={isSharedAccess}
    />
  );
}
