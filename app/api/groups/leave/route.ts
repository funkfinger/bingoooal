import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

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

    // Parse request body
    const body = await request.json();
    const { membership_id } = body;

    if (!membership_id) {
      return NextResponse.json(
        { success: false, error: "Membership ID is required" },
        { status: 400 }
      );
    }

    // Verify the membership belongs to the user and they are not the owner
    const { data: membership, error: membershipError } = await supabase
      .from("group_members")
      .select("id, role, user_id")
      .eq("id", membership_id)
      .eq("user_id", session.user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { success: false, error: "Membership not found" },
        { status: 404 }
      );
    }

    // Prevent leaving your own group
    if (membership.role === "owner") {
      return NextResponse.json(
        { success: false, error: "Cannot leave your own group" },
        { status: 400 }
      );
    }

    // Remove the membership
    const { error: deleteError } = await supabase
      .from("group_members")
      .delete()
      .eq("id", membership_id)
      .eq("user_id", session.user.id);

    if (deleteError) {
      console.error("Error leaving group:", deleteError);
      return NextResponse.json(
        { success: false, error: "Failed to leave group" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Left group successfully",
    });
  } catch (error) {
    console.error("Error in POST /api/groups/leave:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

