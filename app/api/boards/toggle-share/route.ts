import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { ToggleShareResponse } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { board_id, is_public } = await request.json();

    if (!board_id || typeof is_public !== "boolean") {
      return NextResponse.json(
        {
          success: false,
          error: "Board ID and is_public status are required",
        },
        { status: 400 }
      );
    }

    // Verify the board belongs to the user
    const { data: board, error: boardError } = await supabase
      .from("boards")
      .select("user_id, share_token")
      .eq("id", board_id)
      .single();

    if (boardError || !board) {
      return NextResponse.json(
        { success: false, error: "Board not found" },
        { status: 404 }
      );
    }

    if (board.user_id !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized to modify this board",
        },
        { status: 403 }
      );
    }

    // Update the is_public status
    const { data: updatedBoard, error: updateError } = await supabase
      .from("boards")
      .update({ is_public })
      .eq("id", board_id)
      .eq("user_id", session.user.id) // Extra safety check
      .select("share_token, is_public")
      .single();

    if (updateError || !updatedBoard) {
      console.error("Error updating board share status:", updateError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update board share status",
        },
        { status: 500 }
      );
    }

    // Generate the share URL if sharing is enabled
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const share_url = is_public
      ? `${baseUrl}/board/${board_id}?share=${updatedBoard.share_token}`
      : undefined;

    return NextResponse.json(
      {
        success: true,
        is_public: updatedBoard.is_public,
        share_token: updatedBoard.share_token,
        share_url,
      } as ToggleShareResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in toggle share API:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

