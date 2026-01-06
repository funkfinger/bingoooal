"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { Board } from "@/lib/types";

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
    <div className="page-container">
      <header className="bg-white border-b-2 border-gray-200 px-6 py-4 flex justify-between items-center shadow-hand-sm">
        <div className="flex items-center gap-3 text-2xl font-semibold text-gray-800">
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
          <button
            onClick={() => router.push("/friends")}
            className="px-4 py-2 bg-primary-500 text-white font-medium rounded-lg shadow-hand-sm cursor-pointer transition-all duration-200 hover:bg-primary-600 hover:-translate-y-0.5 hover:shadow-hand-md organic-shape-1"
          >
            👥 Friends
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="px-4 py-2 bg-accent-purple text-white font-medium rounded-lg shadow-hand-sm cursor-pointer transition-all duration-200 hover:bg-primary-600 hover:-translate-y-0.5 hover:shadow-hand-md organic-shape-2"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="content-container max-w-7xl">
        <div className="bg-white rounded-xl p-8 mb-8 shadow-hand-md organic-shape-1 rotate-slight-1 transition-all duration-300 hover:rotate-0 hover:-translate-y-0.5 hover:shadow-hand-lg">
          <h1 className="text-gray-800 mb-2 text-3xl font-bold">
            Welcome back, {user.name?.split(" ")[0] || "there"}!
          </h1>
          <p className="text-gray-600 text-base">
            Track your yearly goals with bingo boards
          </p>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-hand-md organic-shape-2">
          <div className="flex justify-between items-center mb-6 flex-col md:flex-row gap-3 md:gap-0">
            <h2 className="text-gray-800 text-2xl font-semibold">
              Your Boards
            </h2>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary organic-shape-3 w-full md:w-auto"
            >
              + Create New Board
            </button>
          </div>

          {boards.length === 0 ? (
            <div className="text-center py-16 px-5 text-gray-600">
              <div className="text-6xl mb-4">📋</div>
              <p className="mb-6">
                No boards yet. Create your first bingo board to get started!
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary organic-shape-4"
              >
                Create Your First Board
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {boards.map((board) => (
                <div
                  key={board.id}
                  className="gradient-card organic-shape-1 shadow-hand-md transition-all duration-200 hover:-translate-y-1 hover:shadow-hand-lg overflow-hidden"
                >
                  <div
                    className="p-6 cursor-pointer"
                    onClick={() => router.push(`/board/${board.id}`)}
                  >
                    <h3 className="text-xl mb-2 font-semibold">
                      {board.title}
                    </h3>
                    <div className="text-sm opacity-90 mb-4">{board.year}</div>
                    <div className="text-sm opacity-90">
                      {board.locked ? "🔒 Locked" : "✏️ Editable"}
                    </div>
                  </div>
                  <div className="flex gap-2 px-6 py-3 bg-black bg-opacity-10 border-t border-white border-opacity-10">
                    <button
                      onClick={(e) => openEditModal(board, e)}
                      className="px-3 py-1.5 border-none rounded-md text-sm cursor-pointer transition-all duration-200 bg-white bg-opacity-20 text-white hover:bg-opacity-30"
                      title="Edit board"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={(e) => openDeleteConfirm(board, e)}
                      className="px-3 py-1.5 border-none rounded-md text-sm cursor-pointer transition-all duration-200 bg-white bg-opacity-20 text-white hover:bg-danger hover:bg-opacity-80"
                      title="Delete board"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal-base organic-shape-3 shadow-hand-lg max-w-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl text-gray-800 font-semibold">
                Create New Board
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="bg-transparent border-none text-2xl text-gray-400 cursor-pointer p-0 w-8 h-8 flex items-center justify-center rounded transition-colors hover:bg-gray-100"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateBoard}>
              <div className="mb-5">
                <label
                  htmlFor="title"
                  className="block mb-2 text-gray-800 font-medium"
                >
                  Board Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g., 2025 Goals"
                  required
                  className="w-full p-3 border-2 border-gray-300 rounded-lg text-base transition-all organic-shape-4 shadow-hand-sm focus:outline-none focus:border-accent-purple focus:shadow-hand-md focus:-translate-y-0.5"
                />
              </div>
              <div className="mb-5">
                <label
                  htmlFor="year"
                  className="block mb-2 text-gray-800 font-medium"
                >
                  Year
                </label>
                <input
                  type="number"
                  id="year"
                  value={formData.year}
                  onChange={(e) =>
                    setFormData({ ...formData, year: parseInt(e.target.value) })
                  }
                  min="2020"
                  max="2100"
                  required
                  className="w-full p-3 border-2 border-gray-300 rounded-lg text-base transition-all organic-shape-4 shadow-hand-sm focus:outline-none focus:border-accent-purple focus:shadow-hand-md focus:-translate-y-0.5"
                />
              </div>
              <div className="mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.include_free_space}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        include_free_space: e.target.checked,
                      })
                    }
                    className="w-auto cursor-pointer"
                  />
                  <span className="text-gray-700">
                    Include free space in center
                  </span>
                </label>
              </div>
              <button
                type="submit"
                disabled={isCreating}
                className="btn-primary w-full organic-shape-1 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isCreating ? "Creating..." : "Create Board"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Board Modal */}
      {showEditModal && selectedBoard && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div
            className="modal-base organic-shape-2 shadow-hand-lg max-w-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl text-gray-800 font-semibold">
                Edit Board
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="bg-transparent border-none text-2xl text-gray-400 cursor-pointer p-0 w-8 h-8 flex items-center justify-center rounded transition-colors hover:bg-gray-100"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleEditBoard}>
              <div className="mb-5">
                <label
                  htmlFor="edit-title"
                  className="block mb-2 text-gray-800 font-medium"
                >
                  Board Title
                </label>
                <input
                  type="text"
                  id="edit-title"
                  value={editFormData.title}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, title: e.target.value })
                  }
                  placeholder="e.g., 2025 Goals"
                  required
                  className="w-full p-3 border-2 border-gray-300 rounded-lg text-base transition-all organic-shape-4 shadow-hand-sm focus:outline-none focus:border-accent-purple focus:shadow-hand-md focus:-translate-y-0.5"
                />
              </div>
              <div className="mb-5">
                <label
                  htmlFor="edit-year"
                  className="block mb-2 text-gray-800 font-medium"
                >
                  Year
                </label>
                <input
                  type="number"
                  id="edit-year"
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
                  className="w-full p-3 border-2 border-gray-300 rounded-lg text-base transition-all organic-shape-4 shadow-hand-sm focus:outline-none focus:border-accent-purple focus:shadow-hand-md focus:-translate-y-0.5"
                />
              </div>
              <button
                type="submit"
                disabled={isEditing}
                className="btn-primary w-full organic-shape-1 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isEditing ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedBoard && (
        <div
          className="modal-overlay"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="modal-base organic-shape-3 shadow-hand-lg max-w-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl text-gray-800 font-semibold">
                Delete Board?
              </h2>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="bg-transparent border-none text-2xl text-gray-400 cursor-pointer p-0 w-8 h-8 flex items-center justify-center rounded transition-colors hover:bg-gray-100"
              >
                ×
              </button>
            </div>
            <p className="text-gray-600 leading-relaxed mb-6">
              Are you sure you want to delete "{selectedBoard.title}"? This
              action cannot be undone and will permanently delete all goals on
              this board.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-outline organic-shape-4 disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteBoard}
                className="btn-danger organic-shape-1 disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Board"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
