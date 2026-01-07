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
    <div className="page-container">
      <header className="bg-white border-b-2 border-gray-200 px-6 py-4 flex justify-between items-center shadow-hand-sm">
        <div
          className="flex items-center gap-3 text-2xl font-semibold text-gray-800 cursor-pointer transition-transform hover:-translate-y-0.5"
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
          <span className="font-medium text-gray-800 hidden md:inline">
            {user.name || user.email}
          </span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-3 bg-white text-accent-purple border-2 border-accent-purple rounded-lg text-base font-medium cursor-pointer transition-all duration-200 shadow-md hover:bg-accent-purple hover:text-white hover:-translate-y-0.5 hover:shadow-lg"
          >
            ← Back to Dashboard
          </button>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-md">
          <h1 className="text-gray-800 mb-8 text-3xl font-bold">Friends</h1>

          {isLoading ? (
            <div className="text-center py-12 text-gray-600 text-lg">
              Loading...
            </div>
          ) : (
            <>
              {/* My Friends Group */}
              <section className="mb-10">
                <div className="flex justify-between items-start mb-6 flex-col md:flex-row gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                      <span>👥</span> My Friends (
                      {members.filter((m) => m.role !== "owner").length})
                    </h2>
                    <p className="text-gray-600">
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
                  <div className="text-center py-12 text-gray-600">
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
                          className="flex justify-between items-center p-4 bg-gray-50 border-2 border-gray-200 rounded-lg transition-all duration-200 hover:bg-gray-100 hover:border-gray-300 hover:translate-x-1"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            {member.user.avatar_url && (
                              <img
                                src={member.user.avatar_url}
                                alt={member.user.name || ""}
                                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                              />
                            )}
                            <div className="flex-1">
                              <div className="text-base font-semibold text-gray-800 mb-1">
                                {member.user.name || member.user.email}
                              </div>
                              <div className="text-sm text-gray-600">
                                <span>
                                  Joined {formatDate(member.joined_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              handleRemoveMember(
                                member.id,
                                member.user.name || member.user.email
                              )
                            }
                            disabled={removingMemberId === member.id}
                            className="px-4 py-2 bg-danger text-white font-medium rounded-lg shadow-soft cursor-pointer transition-all duration-200 hover:bg-danger-dark hover:-translate-y-0.5 hover:shadow-medium disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {removingMemberId === member.id
                              ? "Removing..."
                              : "Remove"}
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </section>

              {/* Groups I'm In */}
              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                  <span>🤝</span> Groups I'm In ({myGroups.length})
                </h2>
                <p className="text-gray-600 mb-6">
                  Friends groups you've joined
                </p>

                {myGroups.length === 0 ? (
                  <div className="text-center py-12 text-gray-600">
                    <div className="text-6xl mb-4">🔗</div>
                    <p>You haven't joined any friends groups yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myGroups.map((group) => (
                      <div
                        key={group.membership_id}
                        className="flex justify-between items-center p-4 bg-gray-50 border-2 border-gray-200 rounded-lg transition-all duration-200 hover:bg-gray-100 hover:border-gray-300 hover:translate-x-1"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          {group.owner.avatar_url && (
                            <img
                              src={group.owner.avatar_url}
                              alt={group.owner.name || ""}
                              className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                            />
                          )}
                          <div className="flex-1">
                            <div className="text-base font-semibold text-gray-800 mb-1">
                              {group.owner.name || group.owner.email}'s Friends
                            </div>
                            <div className="text-sm text-gray-600">
                              <span>Joined {formatDate(group.joined_at)}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            handleLeaveGroup(
                              group.membership_id,
                              group.owner.name || group.owner.email
                            )
                          }
                          disabled={leavingGroupId === group.membership_id}
                          className="px-4 py-2 bg-warning text-white font-medium rounded-lg shadow-soft cursor-pointer transition-all duration-200 hover:bg-warning-dark hover:-translate-y-0.5 hover:shadow-medium disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {leavingGroupId === group.membership_id
                            ? "Leaving..."
                            : "Leave"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>

      {/* Invite User Modal */}
      {showInviteModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowInviteModal(false);
            setInviteUrl("");
          }}
        >
          <div
            className="modal-base shadow-lg max-w-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl text-gray-800 font-semibold">
                Invite User to Bingoooal
              </h2>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteUrl("");
                }}
                className="bg-transparent border-none text-2xl text-gray-400 cursor-pointer p-0 w-8 h-8 flex items-center justify-center rounded transition-colors hover:bg-gray-100"
              >
                ×
              </button>
            </div>

            {!inviteUrl ? (
              <div className="py-5">
                <p className="text-gray-600 text-base leading-relaxed mb-6">
                  Generate an invite link to share with someone you'd like to
                  invite to the platform. They'll be able to sign up and start
                  tracking their goals!
                </p>
                <Button
                  onClick={handleGenerateInvite}
                  className="w-full"
                  disabled={isGeneratingInvite}
                >
                  {isGeneratingInvite
                    ? "Generating..."
                    : "Generate Invite Link"}
                </Button>
              </div>
            ) : (
              <div className="py-5">
                <p className="text-gray-600 text-base leading-relaxed mb-4">
                  Share this link with the person you want to invite:
                </p>
                <div className="flex gap-3 mb-4">
                  <input
                    type="text"
                    value={inviteUrl}
                    readOnly
                    className="flex-1 p-3 border-2 border-gray-200 rounded-lg text-sm font-mono bg-gray-50 text-gray-800"
                  />
                  <button
                    onClick={handleCopyInviteLink}
                    className="px-5 py-3 bg-accent-purple text-white font-medium rounded-lg shadow-soft cursor-pointer transition-all duration-200 hover:bg-primary-600 hover:-translate-y-0.5 hover:shadow-medium whitespace-nowrap"
                  >
                    📋 Copy
                  </button>
                </div>
                <p className="text-gray-500 text-sm italic text-center">
                  This link will expire in 30 days and can only be used once.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
