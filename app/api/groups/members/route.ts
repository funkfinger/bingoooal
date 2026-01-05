import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the user's group (they are the owner)
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id")
      .eq("owner_id", session.user.id)
      .single();

    if (groupError || !group) {
      return NextResponse.json(
        { success: false, error: "Group not found" },
        { status: 404 }
      );
    }

    // Get all members of the group with user details
    const { data: members, error: membersError } = await supabase
      .from("group_members")
      .select(`
        id,
        role,
        joined_at,
        users!inner (
          id,
          email,
          name,
          avatar_url
        )
      `)
      .eq("group_id", group.id)
      .order("joined_at", { ascending: true });

    if (membersError) {
      console.error("Error fetching group members:", membersError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch group members" },
        { status: 500 }
      );
    }

    // Transform the data to a cleaner format
    const formattedMembers = members.map((member: any) => ({
      id: member.id,
      role: member.role,
      joined_at: member.joined_at,
      user: {
        id: member.users.id,
        email: member.users.email,
        name: member.users.name,
        avatar_url: member.users.avatar_url,
      },
    }));

    return NextResponse.json({
      success: true,
      members: formattedMembers,
      group_id: group.id,
    });
  } catch (error) {
    console.error("Error in GET /api/groups/members:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

