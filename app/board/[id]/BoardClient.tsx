"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Board, Goal } from "@/lib/types";
import gridStyles from "./board-grid.module.css";
import {
  celebrateGoalCompletion,
  celebrateBingo,
  celebrateBoardCompletion,
} from "@/lib/confetti";
import exampleGoals from "@/data/example-goals.json";

interface BoardClientProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  board: Board;
  initialGoals: Goal[];
  isSharedView?: boolean;
}

export default function BoardClient({
  user,
  board,
  initialGoals,
  isSharedView = false,
}: BoardClientProps) {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [currentBoard, setCurrentBoard] = useState<Board>(board);

  // Board edit/delete modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: board.title,
    year: board.year,
  });

  // Goal management modals
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showGoalDeleteConfirm, setShowGoalDeleteConfirm] = useState(false);
  const [showLockConfirm, setShowLockConfirm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isGoalSaving, setIsGoalSaving] = useState(false);
  const [isGoalDeleting, setIsGoalDeleting] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [goalFormData, setGoalFormData] = useState({
    text: "",
    is_free_space: false,
  });

  // Share modal
  const [showShareModal, setShowShareModal] = useState(false);
  const [isTogglingShare, setIsTogglingShare] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>("");

  // Create a map of position to goal for easy lookup
  const goalMap = new Map<number, Goal>();
  goals.forEach((goal) => {
    goalMap.set(goal.position, goal);
  });

  // Calculate progress
  const completedCount = goals.filter((g) => g.completed).length;
  const totalGoals = 25;
  const progress = Math.round((completedCount / totalGoals) * 100);

  const handleCellClick = (position: number) => {
    // In shared view, only show details modal
    if (isSharedView) {
      const goal = goalMap.get(position);
      if (goal && !goal.is_free_space) {
        openGoalDetailsModal(goal);
      }
      return;
    }

    const goal = goalMap.get(position);
    if (goal) {
      // If board is locked, show details modal (unless it's a free space - do nothing)
      if (currentBoard.locked) {
        if (goal.is_free_space) {
          // Do nothing for free space goals
          return;
        } else {
          // Show details modal for regular goals
          openGoalDetailsModal(goal);
        }
      } else {
        // If board is unlocked, open edit modal
        openGoalEditModal(goal);
      }
    } else {
      // Open create goal modal for empty cell (only if unlocked)
      if (!currentBoard.locked) {
        openGoalCreateModal(position);
      }
    }
  };

  const openGoalDetailsModal = (goal: Goal) => {
    setSelectedGoal(goal);
    setShowDetailsModal(true);
  };

  const openGoalCreateModal = (position: number) => {
    setSelectedPosition(position);
    setSelectedGoal(null);
    // Get a random example goal as placeholder
    const randomGoal =
      exampleGoals[Math.floor(Math.random() * exampleGoals.length)];
    setGoalFormData({
      text: randomGoal,
      is_free_space: false,
    });
    setShowGoalModal(true);
  };

  const openGoalEditModal = (goal: Goal) => {
    setSelectedGoal(goal);
    setSelectedPosition(goal.position);
    setGoalFormData({
      text: goal.text,
      is_free_space: goal.is_free_space,
    });
    setShowGoalModal(true);
  };

  const getRandomGoal = () => {
    const randomGoal =
      exampleGoals[Math.floor(Math.random() * exampleGoals.length)];
    setGoalFormData({ ...goalFormData, text: randomGoal });
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPosition === null) return;

    setIsGoalSaving(true);

    try {
      if (selectedGoal) {
        // Update existing goal
        const response = await fetch("/api/goals/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            goal_id: selectedGoal.id,
            text: goalFormData.text,
            is_free_space: goalFormData.is_free_space,
          }),
        });

        const data = await response.json();

        if (data.success && data.goal) {
          setGoals((prev) =>
            prev.map((g) => (g.id === data.goal.id ? data.goal : g))
          );
          setShowGoalModal(false);
        } else {
          alert(data.error || "Failed to update goal");
        }
      } else {
        // Create new goal
        const response = await fetch("/api/goals/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            board_id: currentBoard.id,
            position: selectedPosition,
            text: goalFormData.text,
            is_free_space: goalFormData.is_free_space,
          }),
        });

        const data = await response.json();

        if (data.success && data.goal) {
          setGoals((prev) => [...prev, data.goal]);
          setShowGoalModal(false);
        } else {
          alert(data.error || "Failed to create goal");
        }
      }
    } catch (error) {
      console.error("Error saving goal:", error);
      alert("An error occurred while saving the goal");
    } finally {
      setIsGoalSaving(false);
    }
  };

  const handleDeleteGoal = async () => {
    if (!selectedGoal) return;

    setIsGoalDeleting(true);

    try {
      const response = await fetch("/api/goals/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal_id: selectedGoal.id }),
      });

      const data = await response.json();

      if (data.success) {
        setGoals((prev) => prev.filter((g) => g.id !== selectedGoal.id));
        setShowGoalDeleteConfirm(false);
        setShowGoalModal(false);
      } else {
        alert(data.error || "Failed to delete goal");
      }
    } catch (error) {
      console.error("Error deleting goal:", error);
      alert("An error occurred while deleting the goal");
    } finally {
      setIsGoalDeleting(false);
    }
  };

  const handleToggleCompletion = async (goal: Goal) => {
    // Prevent toggling completion of free space goals
    if (goal.is_free_space) {
      return;
    }

    const newCompletedStatus = !goal.completed;

    try {
      const response = await fetch("/api/goals/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal_id: goal.id,
          completed: newCompletedStatus,
        }),
      });

      const data = await response.json();

      if (data.success && data.goal) {
        setGoals((prev) =>
          prev.map((g) => (g.id === data.goal.id ? data.goal : g))
        );

        // Trigger confetti animations
        if (newCompletedStatus) {
          celebrateGoalCompletion();

          if (data.bingoType) {
            setTimeout(() => celebrateBingo(), 500);
          }

          if (data.boardComplete) {
            setTimeout(() => celebrateBoardCompletion(), 1000);
          }
        }
      } else {
        alert(data.error || "Failed to update goal");
      }
    } catch (error) {
      console.error("Error toggling goal completion:", error);
      alert("An error occurred while updating the goal");
    }
  };

  const handleLockBoard = async () => {
    setIsLocking(true);

    try {
      const response = await fetch("/api/boards/toggle-lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          board_id: currentBoard.id,
          locked: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCurrentBoard({ ...currentBoard, locked: true });
        setShowLockConfirm(false);
        router.refresh();
      } else {
        alert(data.error || "Failed to lock board");
      }
    } catch (error) {
      console.error("Error locking board:", error);
      alert("An error occurred while locking the board");
    } finally {
      setIsLocking(false);
    }
  };

  const handleEditBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(true);

    try {
      const response = await fetch("/api/boards/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          board_id: currentBoard.id,
          title: editFormData.title,
          year: editFormData.year,
        }),
      });

      const data = await response.json();

      if (data.success && data.board) {
        setCurrentBoard(data.board);
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
    setIsDeleting(true);

    try {
      const response = await fetch("/api/boards/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ board_id: currentBoard.id }),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/dashboard");
        router.refresh();
      } else {
        alert(data.error || "Failed to delete board");
        setIsDeleting(false);
      }
    } catch (error) {
      console.error("Error deleting board:", error);
      alert("An error occurred while deleting the board");
      setIsDeleting(false);
    }
  };

  const openEditModal = () => {
    setEditFormData({
      title: currentBoard.title,
      year: currentBoard.year,
    });
    setShowEditModal(true);
  };

  const handleToggleShare = async () => {
    setIsTogglingShare(true);

    try {
      const response = await fetch("/api/boards/toggle-share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          board_id: currentBoard.id,
          is_public: !currentBoard.is_public,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCurrentBoard({ ...currentBoard, is_public: data.is_public });
        if (data.share_url) {
          setShareUrl(data.share_url);
        }
        router.refresh();
      } else {
        alert(data.error || "Failed to toggle share status");
      }
    } catch (error) {
      console.error("Error toggling share:", error);
      alert("An error occurred while toggling share status");
    } finally {
      setIsTogglingShare(false);
    }
  };

  const openShareModal = () => {
    // Generate share URL if board is already public
    if (currentBoard.is_public && currentBoard.share_token) {
      const baseUrl = window.location.origin;
      setShareUrl(
        `${baseUrl}/board/${currentBoard.id}?share=${currentBoard.share_token}`
      );
    }
    setShowShareModal(true);
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    alert("Share link copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-purple to-accent-indigo">
      <header className="bg-white bg-opacity-95 px-6 py-4 flex justify-between items-center shadow-soft">
        <div
          className="flex items-center gap-3 text-2xl font-bold text-accent-purple cursor-pointer transition-opacity hover:opacity-80"
          onClick={() => router.push("/dashboard")}
        >
          <span>🎯</span>
          <span>Bingoooal</span>
        </div>
        <div className="flex items-center gap-3">
          {user?.image && (
            <img
              src={user.image}
              alt={user.name || ""}
              className="w-9 h-9 rounded-full"
            />
          )}
          <span className="text-sm text-gray-800 hidden md:inline">
            {isSharedView
              ? "Viewing Shared Board"
              : user?.name || user?.email || "User"}
          </span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {!isSharedView && (
          <div className="mb-5">
            <button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-3 bg-white text-accent-purple border-2 border-accent-purple rounded-lg text-base font-medium cursor-pointer transition-all duration-200 organic-shape-1 shadow-hand-md rotate-slight-1 hover:bg-accent-purple hover:text-white hover:rotate-0 hover:-translate-y-0.5 hover:shadow-hand-lg"
            >
              ← Back to Dashboard
            </button>
          </div>
        )}

        {isSharedView && (
          <div className="bg-secondary-100 border-2 border-secondary-300 text-secondary-800 px-6 py-4 rounded-lg mb-6 text-center font-medium organic-shape-2">
            👁️ You are viewing a shared board in read-only mode
          </div>
        )}

        <div className="bg-white rounded-xl p-6 mb-6 shadow-hand-md flex justify-between items-center organic-shape-1 rotate-slight-2">
          <div>
            <h1 className="text-gray-800 m-0 mb-2 text-3xl font-bold">
              {currentBoard.title}
            </h1>
            <p className="text-gray-600 m-0 text-base">{currentBoard.year}</p>
          </div>
          <div className="flex gap-3 items-center flex-wrap">
            {isSharedView ? (
              <span className="px-4 py-2 bg-secondary-100 text-secondary-700 rounded-lg font-medium border-2 border-secondary-300">
                👁️ Read-Only
              </span>
            ) : (
              <>
                {currentBoard.locked ? (
                  <span className="px-4 py-2 bg-success-light bg-opacity-10 text-success-dark rounded-lg font-medium border-2 border-success-light">
                    🔒 Locked
                  </span>
                ) : (
                  <button
                    onClick={() => setShowLockConfirm(true)}
                    className="px-4 py-2 bg-success-light text-white font-medium rounded-lg shadow-soft cursor-pointer transition-all duration-200 hover:bg-success hover:-translate-y-0.5 hover:shadow-medium disabled:opacity-50 disabled:cursor-not-allowed organic-shape-3"
                    disabled={goals.length < 25}
                    title={
                      goals.length < 25
                        ? `Add ${25 - goals.length} more goal(s) to lock`
                        : "Lock board to start tracking progress"
                    }
                  >
                    🔒 Lock Board
                  </button>
                )}
                <button
                  onClick={openShareModal}
                  className="px-4 py-2 bg-secondary-500 text-white font-medium rounded-lg shadow-soft cursor-pointer transition-all duration-200 hover:bg-secondary-600 hover:-translate-y-0.5 hover:shadow-medium organic-shape-4"
                >
                  🔗 Share
                </button>
                <button
                  onClick={openEditModal}
                  className="px-4 py-2 bg-accent-purple text-white font-medium rounded-lg shadow-soft cursor-pointer transition-all duration-200 hover:bg-primary-600 hover:-translate-y-0.5 hover:shadow-medium organic-shape-1"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-danger text-white font-medium rounded-lg shadow-soft cursor-pointer transition-all duration-200 hover:bg-danger-dark hover:-translate-y-0.5 hover:shadow-medium organic-shape-2"
                >
                  🗑️ Delete
                </button>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 mb-6 shadow-hand-md organic-shape-2">
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-success-light to-success transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-gray-700 text-center font-medium">
            {completedCount} of {totalGoals} goals completed ({progress}%)
          </p>
        </div>

        <div className={gridStyles.bingoGrid}>
          {Array.from({ length: 25 }, (_, i) => {
            const goal = goalMap.get(i);
            return (
              <div
                key={i}
                className={`${gridStyles.cell} ${
                  goal ? gridStyles.filled : gridStyles.empty
                } ${goal?.completed ? gridStyles.completed : ""} ${
                  goal?.is_free_space ? gridStyles.freeSpace : ""
                }`}
                onClick={() => handleCellClick(i)}
              >
                {goal ? (
                  <div className={gridStyles.goalContent}>
                    <span className={gridStyles.goalText}>
                      {goal.is_free_space ? "Free Space" : goal.text}
                    </span>
                  </div>
                ) : (
                  <span className={gridStyles.addIcon}>+</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-center gap-3 mb-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-3 bg-white text-accent-purple border-2 border-accent-purple rounded-lg text-base font-medium cursor-pointer transition-all duration-200 organic-shape-1 shadow-hand-md rotate-slight-1 hover:bg-accent-purple hover:text-white hover:rotate-0 hover:-translate-y-0.5 hover:shadow-hand-lg"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {/* Goal Create/Edit Modal */}
      {showGoalModal && (
        <div className="modal-overlay" onClick={() => setShowGoalModal(false)}>
          <div
            className="modal-base organic-shape-3 shadow-hand-lg max-w-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl text-gray-800 font-semibold m-0">
                {selectedGoal ? "Edit Goal" : "Add Goal"}
              </h2>
              <button
                onClick={() => setShowGoalModal(false)}
                className="bg-transparent border-none text-2xl text-gray-400 cursor-pointer p-0 w-8 h-8 flex items-center justify-center rounded transition-colors hover:bg-gray-100"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSaveGoal}>
              <div className="mb-5">
                <label
                  htmlFor="goal-text"
                  className="block mb-2 text-gray-800 font-medium"
                >
                  Goal Description
                </label>
                <textarea
                  id="goal-text"
                  value={goalFormData.text}
                  onChange={(e) =>
                    setGoalFormData({ ...goalFormData, text: e.target.value })
                  }
                  placeholder="Enter your goal..."
                  maxLength={200}
                  rows={4}
                  required
                  className="w-full p-3 border-2 border-gray-300 rounded-lg text-base transition-all organic-shape-4 shadow-hand-sm focus:outline-none focus:border-accent-purple focus:shadow-hand-md focus:-translate-y-0.5 resize-none"
                />
                <div className="text-sm text-gray-500 mt-1 text-right">
                  {goalFormData.text.length}/200 characters
                </div>
              </div>
              {!selectedGoal && goalFormData.text.length === 0 && (
                <button
                  type="button"
                  onClick={getRandomGoal}
                  className="w-full mb-4 px-4 py-2 bg-warning text-white font-medium rounded-lg shadow-soft cursor-pointer transition-all duration-200 hover:bg-warning-dark hover:-translate-y-0.5 hover:shadow-medium organic-shape-2"
                >
                  ✨ Inspire Me
                </button>
              )}
              <div className="mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={goalFormData.is_free_space}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      setGoalFormData({
                        ...goalFormData,
                        is_free_space: isChecked,
                        // Automatically set text to "Free Space" when checking the box
                        text: isChecked ? "Free Space" : goalFormData.text,
                      });
                    }}
                    className="w-auto cursor-pointer"
                  />
                  <span className="text-gray-700">
                    Mark as free space (auto-completed)
                  </span>
                </label>
              </div>
              <div className="flex gap-3 justify-end">
                {selectedGoal && !selectedGoal.is_free_space && (
                  <button
                    type="button"
                    onClick={() => setShowGoalDeleteConfirm(true)}
                    className="btn-danger organic-shape-1"
                  >
                    Delete Goal
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isGoalSaving}
                  className="btn-primary organic-shape-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isGoalSaving
                    ? "Saving..."
                    : selectedGoal
                    ? "Save Changes"
                    : "Add Goal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Goal Delete Confirmation */}
      {showGoalDeleteConfirm && selectedGoal && (
        <div
          className="modal-overlay"
          onClick={() => setShowGoalDeleteConfirm(false)}
        >
          <div
            className="modal-base organic-shape-2 shadow-hand-lg max-w-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl text-gray-800 font-semibold">
                Delete Goal?
              </h2>
              <button
                onClick={() => setShowGoalDeleteConfirm(false)}
                className="bg-transparent border-none text-2xl text-gray-400 cursor-pointer p-0 w-8 h-8 flex items-center justify-center rounded transition-colors hover:bg-gray-100"
              >
                ×
              </button>
            </div>
            <p className="text-gray-600 leading-relaxed mb-6">
              Are you sure you want to delete this goal? This action cannot be
              undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowGoalDeleteConfirm(false)}
                className="btn-outline organic-shape-4 disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={isGoalDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteGoal}
                className="btn-danger organic-shape-1 disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={isGoalDeleting}
              >
                {isGoalDeleting ? "Deleting..." : "Delete Goal"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lock Board Confirmation */}
      {showLockConfirm && (
        <div
          className="modal-overlay"
          onClick={() => setShowLockConfirm(false)}
        >
          <div
            className="modal-base organic-shape-3 shadow-hand-lg max-w-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl text-gray-800 font-semibold">
                Lock Board?
              </h2>
              <button
                onClick={() => setShowLockConfirm(false)}
                className="bg-transparent border-none text-2xl text-gray-400 cursor-pointer p-0 w-8 h-8 flex items-center justify-center rounded transition-colors hover:bg-gray-100"
              >
                ×
              </button>
            </div>
            <p className="text-gray-600 leading-relaxed mb-6">
              Once locked, you can only mark goals as complete. You won't be
              able to add, edit, or delete goals. This action cannot be undone.
              Are you ready to start tracking your progress?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowLockConfirm(false)}
                className="btn-outline organic-shape-4 disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={isLocking}
              >
                Cancel
              </button>
              <button
                onClick={handleLockBoard}
                className="btn-primary organic-shape-1 disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={isLocking}
              >
                {isLocking ? "Locking..." : "Lock Board"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Board Modal */}
      {showEditModal && (
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

      {/* Share Modal */}
      {showShareModal && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          <div
            className="modal-base organic-shape-3 shadow-hand-lg max-w-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl text-gray-800 font-semibold">
                Share Board
              </h2>
              <button
                onClick={() => setShowShareModal(false)}
                className="bg-transparent border-none text-2xl text-gray-400 cursor-pointer p-0 w-8 h-8 flex items-center justify-center rounded transition-colors hover:bg-gray-100"
              >
                ×
              </button>
            </div>
            <div className="py-5">
              <p className="text-gray-600 text-base leading-relaxed mb-6">
                {currentBoard.is_public
                  ? "Your board is currently public. Anyone with the link can view it."
                  : "Enable sharing to generate a link that others can use to view your board."}
              </p>
              <div className="mb-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentBoard.is_public}
                    onChange={handleToggleShare}
                    disabled={isTogglingShare}
                    className="w-5 h-5 cursor-pointer"
                  />
                  <span className="text-base text-gray-800">
                    Enable public sharing
                  </span>
                </label>
              </div>
              {currentBoard.is_public && shareUrl && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Share Link:
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={shareUrl}
                      readOnly
                      className="flex-1 p-3 border-2 border-gray-200 rounded-lg text-sm font-mono bg-gray-50 text-gray-800 organic-shape-4"
                    />
                    <button
                      onClick={copyShareLink}
                      className="px-5 py-3 bg-accent-purple text-white font-medium rounded-lg shadow-soft cursor-pointer transition-all duration-200 hover:bg-primary-600 hover:-translate-y-0.5 hover:shadow-medium whitespace-nowrap organic-shape-2"
                    >
                      📋 Copy
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="modal-overlay"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="modal-base organic-shape-3 shadow-hand-lg max-w-md"
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
            <p className="text-gray-700 text-base leading-relaxed mb-6">
              Are you sure you want to delete "{currentBoard.title}"? This
              action cannot be undone and will permanently delete all goals on
              this board.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-6 py-3 bg-gray-200 text-gray-800 font-medium rounded-lg shadow-soft cursor-pointer transition-all duration-200 hover:bg-gray-300 hover:-translate-y-0.5 hover:shadow-medium disabled:opacity-60 disabled:cursor-not-allowed organic-shape-1"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteBoard}
                className="px-6 py-3 bg-danger text-white font-medium rounded-lg shadow-soft cursor-pointer transition-all duration-200 hover:bg-danger-dark hover:-translate-y-0.5 hover:shadow-medium disabled:opacity-60 disabled:cursor-not-allowed organic-shape-2"
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Board"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Goal Details Modal */}
      {showDetailsModal && selectedGoal && (
        <div
          className="modal-overlay"
          onClick={() => setShowDetailsModal(false)}
        >
          <div
            className="modal-base organic-shape-3 shadow-hand-lg max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl text-gray-800 font-semibold">
                Goal Details
              </h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="bg-transparent border-none text-2xl text-gray-400 cursor-pointer p-0 w-8 h-8 flex items-center justify-center rounded transition-colors hover:bg-gray-100"
              >
                ×
              </button>
            </div>
            <div className="py-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Goal:
                </label>
                <div className="text-base text-gray-800">
                  {selectedGoal.is_free_space
                    ? "Free Space"
                    : selectedGoal.text}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Status:
                </label>
                <div className="text-base text-gray-800">
                  {selectedGoal.completed ? (
                    <span className="inline-block px-3 py-1 bg-success text-white rounded-full text-sm font-medium">
                      ✓ Completed
                    </span>
                  ) : (
                    <span className="inline-block px-3 py-1 bg-gray-300 text-gray-700 rounded-full text-sm font-medium">
                      Not Completed
                    </span>
                  )}
                </div>
              </div>
              {selectedGoal.is_free_space && (
                <div>
                  <p className="text-sm text-gray-600 italic bg-gray-50 p-3 rounded-lg">
                    🎁 This is a free space - it's automatically completed and
                    cannot be changed.
                  </p>
                </div>
              )}
              {selectedGoal.completed_at && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Completed on:
                  </label>
                  <p className="text-base text-gray-800">
                    {new Date(selectedGoal.completed_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-end pt-4 border-t-2 border-gray-100">
              {!selectedGoal.is_free_space && !isSharedView && (
                <button
                  onClick={async () => {
                    await handleToggleCompletion(selectedGoal);
                    setShowDetailsModal(false);
                  }}
                  className={
                    selectedGoal.completed
                      ? "px-6 py-3 bg-warning text-white font-medium rounded-lg shadow-soft cursor-pointer transition-all duration-200 hover:bg-warning-dark hover:-translate-y-0.5 hover:shadow-medium organic-shape-1"
                      : "px-6 py-3 bg-success text-white font-medium rounded-lg shadow-soft cursor-pointer transition-all duration-200 hover:bg-success-dark hover:-translate-y-0.5 hover:shadow-medium organic-shape-1"
                  }
                >
                  {selectedGoal.completed
                    ? "Mark as Incomplete"
                    : "Mark as Complete"}
                </button>
              )}
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-6 py-3 bg-gray-200 text-gray-800 font-medium rounded-lg shadow-soft cursor-pointer transition-all duration-200 hover:bg-gray-300 hover:-translate-y-0.5 hover:shadow-medium organic-shape-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
