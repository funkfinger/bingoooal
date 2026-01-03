"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Board, Goal } from "@/lib/types";
import styles from "./board.module.css";

interface BoardClientProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  board: Board;
  initialGoals: Goal[];
}

export default function BoardClient({
  user,
  board,
  initialGoals,
}: BoardClientProps) {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>(initialGoals);

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
    const goal = goalMap.get(position);
    if (goal) {
      // TODO: Open edit/view modal
      console.log("Goal clicked:", goal);
    } else {
      // TODO: Open create goal modal
      console.log("Empty cell clicked:", position);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logo} onClick={() => router.push("/dashboard")}>
          <span>🎯</span>
          <span>Bingoooal</span>
        </div>
        <div className={styles.userInfo}>
          {user.image && (
            <img
              src={user.image}
              alt={user.name || ""}
              className={styles.userAvatar}
            />
          )}
          <span className={styles.userName}>{user.name || user.email}</span>
        </div>
      </header>

      <div className={styles.container}>
        <div className={styles.boardHeader}>
          <div>
            <h1>{board.title}</h1>
            <p className={styles.year}>{board.year}</p>
          </div>
          <div className={styles.headerActions}>
            {board.locked && <span className={styles.lockedBadge}>🔒 Locked</span>}
          </div>
        </div>

        <div className={styles.progressSection}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className={styles.progressText}>
            {completedCount} of {totalGoals} goals completed ({progress}%)
          </p>
        </div>

        <div className={styles.bingoGrid}>
          {Array.from({ length: 25 }, (_, i) => {
            const goal = goalMap.get(i);
            return (
              <div
                key={i}
                className={`${styles.cell} ${
                  goal ? styles.filled : styles.empty
                } ${goal?.completed ? styles.completed : ""} ${
                  goal?.is_free_space ? styles.freeSpace : ""
                }`}
                onClick={() => handleCellClick(i)}
              >
                {goal ? (
                  <div className={styles.goalContent}>
                    <span className={styles.goalText}>{goal.text}</span>
                    {goal.completed && (
                      <span className={styles.checkmark}>✓</span>
                    )}
                  </div>
                ) : (
                  <span className={styles.addIcon}>+</span>
                )}
              </div>
            );
          })}
        </div>

        <div className={styles.actions}>
          <button
            onClick={() => router.push("/dashboard")}
            className={styles.backBtn}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

