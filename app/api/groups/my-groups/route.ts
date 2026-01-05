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

    // Get all groups the user is a member of (excluding their own group)
    const { data: memberships, error: membershipsError } = await supabase
      .from("group_members")
      .select(`
        id,
        role,
        joined_at,
        group_id,
        groups!inner (
          id,
          owner_id,
          created_at,
          users!inner (
            id,
            email,
            name,
            avatar_url
          )
        )
      `)
      .eq("user_id", session.user.id)
      .neq("role", "owner") // Exclude their own group where they are owner
      .order("joined_at", { ascending: false });

    if (membershipsError) {
      console.error("Error fetching group memberships:", membershipsError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch group memberships" },
        { status: 500 }
      );
    }

    // Transform the data to a cleaner format
    const formattedGroups = memberships.map((membership: any) => ({
      membership_id: membership.id,
      group_id: membership.groups.id,
      joined_at: membership.joined_at,
      owner: {
        id: membership.groups.users.id,
        email: membership.groups.users.email,
        name: membership.groups.users.name,
        avatar_url: membership.groups.users.avatar_url,
      },
    }));

    return NextResponse.json({
      success: true,
      groups: formattedGroups,
    });
  } catch (error) {
    console.error("Error in GET /api/groups/my-groups:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

