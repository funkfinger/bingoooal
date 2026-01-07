"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { Board } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface DashboardClientProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  boards: Board[];
}

export default function DashboardClient({
  user,
  boards,
}: DashboardClientProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    year: new Date().getFullYear(),
    include_free_space: true,
  });
  const [editFormData, setEditFormData] = useState({
    title: "",
    year: new Date().getFullYear(),
  });

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const response = await fetch("/api/boards/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success && data.board) {
        router.push(`/board/${data.board.id}`);
        router.refresh();
      } else {
        alert(data.error || "Failed to create board");
      }
    } catch (error) {
      console.error("Error creating board:", error);
      alert("An error occurred while creating the board");
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBoard) return;

    setIsEditing(true);

    try {
      const response = await fetch("/api/boards/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          board_id: selectedBoard.id,
          title: editFormData.title,
          year: editFormData.year,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowEditModal(false);
        router.refresh();
      } else {
        alert(data.error || "Failed to update board");
      }
    } catch (error) {
      console.error("Error updating board:", error);
      alert("An error occurred while updating the board");
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteBoard = async () => {
    if (!selectedBoard) return;

    setIsDeleting(true);

    try {
      const response = await fetch("/api/boards/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ board_id: selectedBoard.id }),
      });

      const data = await response.json();

      if (data.success) {
        setShowDeleteConfirm(false);
        router.refresh();
      } else {
        alert(data.error || "Failed to delete board");
      }
    } catch (error) {
      console.error("Error deleting board:", error);
      alert("An error occurred while deleting the board");
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditModal = (board: Board, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedBoard(board);
    setEditFormData({
      title: board.title,
      year: board.year,
    });
    setShowEditModal(true);
  };

  const openDeleteConfirm = (board: Board, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedBoard(board);
    setShowDeleteConfirm(true);
  };

  return (
    <div className="min-h-screen bg-muted">
      <header className="bg-card border-b border-border px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3 text-2xl font-semibold text-foreground">
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
          <span className="font-medium hidden md:inline">
            {user.name || user.email}
          </span>
          <Button onClick={() => router.push("/friends")} variant="default">
            👥 Friends
          </Button>
          <Button
            onClick={() => signOut({ callbackUrl: "/" })}
            variant="secondary"
          >
            Logout
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-3xl">
              Welcome back, {user.name?.split(" ")[0] || "there"}!
            </CardTitle>
            <CardDescription>
              Track your yearly goals with bingo boards
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center flex-col md:flex-row gap-3 md:gap-0">
              <CardTitle className="text-2xl">Your Boards</CardTitle>
              <Button
                onClick={() => setShowModal(true)}
                className="w-full md:w-auto"
              >
                + Create New Board
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {boards.length === 0 ? (
              <div className="text-center py-16 px-5 text-muted-foreground">
                <div className="text-6xl mb-4">📋</div>
                <p className="mb-6">
                  No boards yet. Create your first bingo board to get started!
                </p>
                <Button onClick={() => setShowModal(true)}>
                  Create Your First Board
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {boards.map((board) => (
                  <Card
                    key={board.id}
                    className="border-border overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => router.push(`/board/${board.id}`)}
                  >
                    <CardHeader>
                      <CardTitle>{board.title}</CardTitle>
                      <CardDescription>{board.year}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Badge variant="secondary">
                        {board.locked ? "🔒 Locked" : "✏️ Editable"}
                      </Badge>
                    </CardContent>
                    <CardFooter className="flex gap-2 bg-muted border-t border-border">
                      <Button
                        onClick={(e) => openEditModal(board, e)}
                        variant="ghost"
                        size="sm"
                        title="Edit board"
                      >
                        ✏️
                      </Button>
                      <Button
                        onClick={(e) => openDeleteConfirm(board, e)}
                        variant="ghost"
                        size="sm"
                        className="hover:bg-destructive hover:text-destructive-foreground"
                        title="Delete board"
                      >
                        🗑️
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Board</DialogTitle>
            <DialogDescription>
              Create a new bingo board to track your goals for the year.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateBoard}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Board Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g., 2025 Goals"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) =>
                    setFormData({ ...formData, year: parseInt(e.target.value) })
                  }
                  min="2020"
                  max="2100"
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="free-space"
                  checked={formData.include_free_space}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      include_free_space: e.target.checked,
                    })
                  }
                  className="cursor-pointer"
                />
                <Label htmlFor="free-space" className="cursor-pointer">
                  Include free space in center
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isCreating} className="w-full">
                {isCreating ? "Creating..." : "Create Board"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Board Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Board</DialogTitle>
            <DialogDescription>
              Update the title and year for your board.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditBoard}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Board Title</Label>
                <Input
                  id="edit-title"
                  value={editFormData.title}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, title: e.target.value })
                  }
                  placeholder="e.g., 2025 Goals"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-year">Year</Label>
                <Input
                  id="edit-year"
                  type="number"
                  value={editFormData.year}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      year: parseInt(e.target.value),
                    })
                  }
                  min="1900"
                  max="2100"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isEditing} className="w-full">
                {isEditing ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Board?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedBoard?.title}"? This
              action cannot be undone and will permanently delete all goals on
              this board.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3">
            <Button
              onClick={() => setShowDeleteConfirm(false)}
              variant="outline"
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteBoard}
              variant="destructive"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Board"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
