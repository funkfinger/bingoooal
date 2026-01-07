"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
}

interface GroupMember {
  id: string;
  role: "owner" | "member";
  joined_at: string;
  user: User;
}

interface MyGroup {
  membership_id: string;
  group_id: string;
  joined_at: string;
  owner: User;
}

interface FriendsClientProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export default function FriendsClient({ user }: FriendsClientProps) {
  const router = useRouter();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [myGroups, setMyGroups] = useState<MyGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [leavingGroupId, setLeavingGroupId] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch group members
      const membersResponse = await fetch("/api/groups/members");
      const membersData = await membersResponse.json();

      if (membersData.success) {
        setMembers(membersData.members || []);
      }

      // Fetch groups user is a member of
      const groupsResponse = await fetch("/api/groups/my-groups");
      const groupsData = await groupsResponse.json();

      if (groupsData.success) {
        setMyGroups(groupsData.groups || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (
      !confirm(
        `Are you sure you want to remove ${memberName} from your friends?`
      )
    ) {
      return;
    }

    setRemovingMemberId(memberId);
    try {
      const response = await fetch("/api/groups/remove-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member_id: memberId }),
      });

      const data = await response.json();

      if (data.success) {
        // Remove from local state
        setMembers(members.filter((m) => m.id !== memberId));
      } else {
        alert(data.error || "Failed to remove member");
      }
    } catch (error) {
      console.error("Error removing member:", error);
      alert("An error occurred while removing the member");
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleLeaveGroup = async (membershipId: string, ownerName: string) => {
    if (
      !confirm(`Are you sure you want to leave ${ownerName}'s friends group?`)
    ) {
      return;
    }

    setLeavingGroupId(membershipId);
    try {
      const response = await fetch("/api/groups/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membership_id: membershipId }),
      });

      const data = await response.json();

      if (data.success) {
        // Remove from local state
        setMyGroups(myGroups.filter((g) => g.membership_id !== membershipId));
      } else {
        alert(data.error || "Failed to leave group");
      }
    } catch (error) {
      console.error("Error leaving group:", error);
      alert("An error occurred while leaving the group");
    } finally {
      setLeavingGroupId(null);
    }
  };

  const handleGenerateInvite = async () => {
    setIsGeneratingInvite(true);

    try {
      const response = await fetch("/api/invitations/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (data.success && data.invite_url) {
        setInviteUrl(data.invite_url);
      } else {
        alert(data.error || "Failed to generate invite link");
      }
    } catch (error) {
      console.error("Error generating invite:", error);
      alert("An error occurred while generating the invite link");
    } finally {
      setIsGeneratingInvite(false);
    }
  };

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    alert("Invite link copied to clipboard!");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-muted">
      <header className="bg-card border-b border-border px-6 py-4 flex justify-between items-center shadow-sm">
        <div
          className="flex items-center gap-3 text-2xl font-semibold text-foreground cursor-pointer transition-transform hover:-translate-y-0.5"
          onClick={() => router.push("/dashboard")}
        >
          <span>🎯</span>
          <span>Bingoooal</span>
        </div>
        <div className="flex items-center gap-4">
          {user.image && (
            <img
              src={user.image}
              alt={user.name || ""}
              className="w-10 h-10 rounded-full object-cover"
            />
          )}
          <span className="font-medium text-foreground hidden md:inline">
            {user.name || user.email}
          </span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-6">
          <Button onClick={() => router.push("/dashboard")} variant="outline">
            ← Back to Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Friends</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground text-lg">
                Loading...
              </div>
            ) : (
              <>
                {/* My Friends Group */}
                <section className="mb-10">
                  <div className="flex justify-between items-start mb-6 flex-col md:flex-row gap-4">
                    <div>
                      <h2 className="text-2xl font-semibold text-foreground mb-2">
                        <span>👥</span> My Friends (
                        {members.filter((m) => m.role !== "owner").length})
                      </h2>
                      <p className="text-muted-foreground">
                        People you've invited to join your friends group
                      </p>
                    </div>
                    <Button
                      onClick={() => setShowInviteModal(true)}
                      className="whitespace-nowrap w-full md:w-auto"
                    >
                      + Invite User
                    </Button>
                  </div>

                  {members.filter((m) => m.role !== "owner").length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <div className="text-6xl mb-4">👋</div>
                      <p className="mb-6">
                        No friends yet. Invite someone to get started!
                      </p>
                      <Button onClick={() => setShowInviteModal(true)}>
                        Invite User
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {members
                        .filter((member) => member.role !== "owner")
                        .map((member) => (
                          <div
                            key={member.id}
                            className="flex justify-between items-center p-4 bg-muted border border-border rounded-lg transition-all duration-200 hover:bg-accent hover:border-primary"
                          >
                            <div className="flex items-center gap-4 flex-1">
                              {member.user.avatar_url && (
                                <img
                                  src={member.user.avatar_url}
                                  alt={member.user.name || ""}
                                  className="w-12 h-12 rounded-full object-cover border-2 border-border"
                                />
                              )}
                              <div className="flex-1">
                                <div className="text-base font-semibold text-foreground mb-1">
                                  {member.user.name || member.user.email}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  <span>
                                    Joined {formatDate(member.joined_at)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Button
                              onClick={() =>
                                handleRemoveMember(
                                  member.id,
                                  member.user.name || member.user.email
                                )
                              }
                              disabled={removingMemberId === member.id}
                              variant="destructive"
                            >
                              {removingMemberId === member.id
                                ? "Removing..."
                                : "Remove"}
                            </Button>
                          </div>
                        ))}
                    </div>
                  )}
                </section>

                {/* Groups I'm In */}
                <section className="mb-10">
                  <h2 className="text-2xl font-semibold text-foreground mb-2">
                    <span>🤝</span> Groups I'm In ({myGroups.length})
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Friends groups you've joined
                  </p>

                  {myGroups.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <div className="text-6xl mb-4">🔗</div>
                      <p>You haven't joined any friends groups yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {myGroups.map((group) => (
                        <div
                          key={group.membership_id}
                          className="flex justify-between items-center p-4 bg-muted border border-border rounded-lg transition-all duration-200 hover:bg-accent hover:border-primary"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            {group.owner.avatar_url && (
                              <img
                                src={group.owner.avatar_url}
                                alt={group.owner.name || ""}
                                className="w-12 h-12 rounded-full object-cover border-2 border-border"
                              />
                            )}
                            <div className="flex-1">
                              <div className="text-base font-semibold text-foreground mb-1">
                                {group.owner.name || group.owner.email}'s
                                Friends
                              </div>
                              <div className="text-sm text-muted-foreground">
                                <span>
                                  Joined {formatDate(group.joined_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={() =>
                              handleLeaveGroup(
                                group.membership_id,
                                group.owner.name || group.owner.email
                              )
                            }
                            disabled={leavingGroupId === group.membership_id}
                            variant="secondary"
                          >
                            {leavingGroupId === group.membership_id
                              ? "Leaving..."
                              : "Leave"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invite User Modal */}
      <Dialog
        open={showInviteModal}
        onOpenChange={(open) => {
          setShowInviteModal(open);
          if (!open) setInviteUrl("");
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Invite User to Bingoooal</DialogTitle>
            <DialogDescription>
              Generate an invite link to share with someone you'd like to invite
              to the platform.
            </DialogDescription>
          </DialogHeader>

          {!inviteUrl ? (
            <div className="py-5">
              <p className="text-muted-foreground text-base leading-relaxed mb-6">
                They'll be able to sign up and start tracking their goals!
              </p>
              <Button
                onClick={handleGenerateInvite}
                className="w-full"
                disabled={isGeneratingInvite}
              >
                {isGeneratingInvite ? "Generating..." : "Generate Invite Link"}
              </Button>
            </div>
          ) : (
            <div className="py-5">
              <p className="text-muted-foreground text-base leading-relaxed mb-4">
                Share this link with the person you want to invite:
              </p>
              <div className="flex gap-3 mb-4">
                <Input
                  type="text"
                  value={inviteUrl}
                  readOnly
                  className="flex-1 font-mono"
                />
                <Button
                  onClick={handleCopyInviteLink}
                  className="whitespace-nowrap"
                >
                  📋 Copy
                </Button>
              </div>
              <p className="text-muted-foreground text-sm italic text-center">
                This link will expire in 30 days and can only be used once.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
