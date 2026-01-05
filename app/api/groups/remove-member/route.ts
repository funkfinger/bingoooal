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
    const { member_id } = body;

    if (!member_id) {
      return NextResponse.json(
        { success: false, error: "Member ID is required" },
        { status: 400 }
      );
    }

    // Get the user's group (they must be the owner)
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id")
      .eq("owner_id", session.user.id)
      .single();

    if (groupError || !group) {
      return NextResponse.json(
        { success: false, error: "You do not own a group" },
        { status: 403 }
      );
    }

    // Verify the member belongs to this group and is not the owner
    const { data: member, error: memberError } = await supabase
      .from("group_members")
      .select("id, role, user_id")
      .eq("id", member_id)
      .eq("group_id", group.id)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { success: false, error: "Member not found in your group" },
        { status: 404 }
      );
    }

    // Prevent removing the owner
    if (member.role === "owner") {
      return NextResponse.json(
        { success: false, error: "Cannot remove the group owner" },
        { status: 400 }
      );
    }

    // Remove the member
    const { error: deleteError } = await supabase
      .from("group_members")
      .delete()
      .eq("id", member_id)
      .eq("group_id", group.id);

    if (deleteError) {
      console.error("Error removing group member:", deleteError);
      return NextResponse.json(
        { success: false, error: "Failed to remove member" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Member removed successfully",
    });
  } catch (error) {
    console.error("Error in POST /api/groups/remove-member:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

