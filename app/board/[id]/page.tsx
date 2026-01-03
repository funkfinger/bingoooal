import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Board, Goal } from "@/lib/types";
import BoardClient from "./BoardClient";

interface BoardPageProps {
  params: {
    id: string;
  };
}

export default async function BoardPage({ params }: BoardPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Fetch the board
  const { data: board, error: boardError } = await supabase
    .from("boards")
    .select("*")
    .eq("id", params.id)
    .single();

  if (boardError || !board) {
    redirect("/dashboard");
  }

  // Verify the board belongs to the user
  const boardData = board as Board;
  if (boardData.user_id !== session.user.id) {
    redirect("/dashboard");
  }

  // Fetch goals for this board
  const { data: goals, error: goalsError } = await supabase
    .from("goals")
    .select("*")
    .eq("board_id", params.id)
    .order("position", { ascending: true });

  if (goalsError) {
    console.error("Error fetching goals:", goalsError);
  }

  const boardGoals: Goal[] = goals || [];

  return (
    <BoardClient
      user={session.user}
      board={boardData}
      initialGoals={boardGoals}
    />
  );
}

