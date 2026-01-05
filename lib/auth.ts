import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { supabase } from "./supabase";
import { cookies } from "next/headers";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false;

      try {
        // Check if user exists in Supabase
        const { data: existingUser, error: fetchError } = await supabase
          .from("users")
          .select("id, email")
          .eq("email", user.email)
          .single();

        if (fetchError && fetchError.code !== "PGRST116") {
          // PGRST116 is "not found" error, which is fine
          console.error("Error fetching user:", fetchError);
          return false;
        }

        if (!existingUser) {
          // Check for invite token in cookies
          const cookieStore = await cookies();
          const inviteToken = cookieStore.get("invite_token")?.value;
          let invitedBy: string | null = null;

          // If there's an invite token, validate it and get the inviter
          if (inviteToken) {
            const { data: invitation, error: inviteError } = await supabase
              .from("invitations")
              .select("inviter_id, used_by, expires_at")
              .eq("invite_token", inviteToken)
              .single();

            if (
              !inviteError &&
              invitation &&
              !invitation.used_by &&
              new Date(invitation.expires_at) > new Date()
            ) {
              invitedBy = invitation.inviter_id;
            }
          }

          // Create new user in Supabase - let Supabase generate the UUID
          const { data: newUser, error: insertError } = await supabase
            .from("users")
            .insert({
              email: user.email,
              name: user.name,
              avatar_url: user.image,
              provider: account?.provider || "google",
              provider_account_id: account?.providerAccountId || user.id,
              invited_by: invitedBy,
            })
            .select("id")
            .single();

          if (insertError) {
            console.error("Error creating user:", insertError);
            return false;
          }

          // Create a personal group for the new user
          const { data: newGroup, error: groupError } = await supabase
            .from("groups")
            .insert({
              owner_id: newUser.id,
            })
            .select("id")
            .single();

          if (groupError) {
            console.error("Error creating group:", groupError);
            // Don't fail the sign-in if group creation fails
          } else {
            // Add the user as the owner of their group
            await supabase.from("group_members").insert({
              group_id: newGroup.id,
              user_id: newUser.id,
              role: "owner",
            });
          }

          // If user was invited, mark the invitation as used and add them to inviter's group
          if (inviteToken && invitedBy) {
            await supabase
              .from("invitations")
              .update({
                used_by: newUser.id,
                used_at: new Date().toISOString(),
              })
              .eq("invite_token", inviteToken);

            // Add the new user to the inviter's group
            const { data: inviterGroup } = await supabase
              .from("groups")
              .select("id")
              .eq("owner_id", invitedBy)
              .single();

            if (inviterGroup) {
              await supabase.from("group_members").insert({
                group_id: inviterGroup.id,
                user_id: newUser.id,
                role: "member",
              });
            }

            // Clear the invite token cookie
            cookieStore.delete("invite_token");
          }

          // Store the generated UUID for the JWT callback
          user.id = newUser.id;
        } else {
          // Update existing user info and store their UUID
          await supabase
            .from("users")
            .update({
              name: user.name,
              avatar_url: user.image,
              updated_at: new Date().toISOString(),
            })
            .eq("email", user.email);

          user.id = existingUser.id;

          // Check for invite token - existing user clicking invite link
          const cookieStore = await cookies();
          const inviteToken = cookieStore.get("invite_token")?.value;

          if (inviteToken) {
            const { data: invitation, error: inviteError } = await supabase
              .from("invitations")
              .select("inviter_id, used_by, expires_at")
              .eq("invite_token", inviteToken)
              .single();

            // If valid invitation and not already used
            if (
              !inviteError &&
              invitation &&
              !invitation.used_by &&
              new Date(invitation.expires_at) > new Date()
            ) {
              // Get the inviter's group
              const { data: inviterGroup } = await supabase
                .from("groups")
                .select("id")
                .eq("owner_id", invitation.inviter_id)
                .single();

              if (inviterGroup) {
                // Check if user is already in the group
                const { data: existingMembership } = await supabase
                  .from("group_members")
                  .select("id")
                  .eq("group_id", inviterGroup.id)
                  .eq("user_id", existingUser.id)
                  .single();

                // Only add if not already a member
                if (!existingMembership) {
                  await supabase.from("group_members").insert({
                    group_id: inviterGroup.id,
                    user_id: existingUser.id,
                    role: "member",
                  });

                  // Mark invitation as used
                  await supabase
                    .from("invitations")
                    .update({
                      used_by: existingUser.id,
                      used_at: new Date().toISOString(),
                    })
                    .eq("invite_token", inviteToken);
                }
              }

              // Clear the invite token cookie
              cookieStore.delete("invite_token");
            }
          }
        }

        return true;
      } catch (error) {
        console.error("Sign in error:", error);
        return false;
      }
    },
    async session({ session, token }) {
      if (session.user && token.userId) {
        // Use the UUID stored in the token
        session.user.id = token.userId as string;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        // Store the Supabase UUID in the token
        token.userId = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
});
