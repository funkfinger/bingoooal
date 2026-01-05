import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import type { CreateInvitationRequest, CreateInvitationResponse } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        } as CreateInvitationResponse,
        { status: 401 }
      );
    }

    // Parse request body
    const body: CreateInvitationRequest = await request.json();
    const { email } = body;

    // Validate email if provided
    if (email && !isValidEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email address",
        } as CreateInvitationResponse,
        { status: 400 }
      );
    }

    // Check if email is already registered (if email is provided)
    if (email) {
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single();

      if (existingUser) {
        return NextResponse.json(
          {
            success: false,
            error: "This email is already registered",
          } as CreateInvitationResponse,
          { status: 400 }
        );
      }
    }

    // Create the invitation
    const { data: invitation, error: insertError } = await supabase
      .from("invitations")
      .insert({
        inviter_id: session.user.id,
        email: email || null,
      })
      .select("*")
      .single();

    if (insertError || !invitation) {
      console.error("Error creating invitation:", insertError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create invitation",
        } as CreateInvitationResponse,
        { status: 500 }
      );
    }

    // Generate the invite URL
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const invite_url = `${baseUrl}/login?invite=${invitation.invite_token}`;

    return NextResponse.json(
      {
        success: true,
        invitation,
        invite_url,
      } as CreateInvitationResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in create invitation API:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      } as CreateInvitationResponse,
      { status: 500 }
    );
  }
}

// Helper function to validate email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

