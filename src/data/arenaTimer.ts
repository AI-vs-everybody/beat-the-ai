// src/data/arenaTimer.ts
// Deadline-based timer helpers for Puzzle Arena (Stage 2 corrections).
// The old interval-decrement countdown drifted and effectively paused
// while the app was backgrounded (granting free time). A deadline is a
// wall-clock timestamp: remaining time is always deadline - now, so
// background time counts against the player and tick timing only
// affects display smoothness, never accuracy.
// Pure functions — no React, no storage — so they are unit-testable.
export function deadlineFor(durationSeconds: number, nowMs = Date.now()): number {
  return nowMs + durationSeconds * 1000;
}

// Whole seconds remaining, rounded UP so the player sees the full
// allotted seconds at question start (20 -> 20, not 19). Clamped >= 0.
export function remainingSeconds(deadlineMs: number, nowMs = Date.now()): number {
  return Math.max(0, Math.ceil((deadlineMs - nowMs) / 1000));
}

export function isExpired(deadlineMs: number, nowMs = Date.now()): boolean {
  return nowMs >= deadlineMs;
}

// Generation gate: a timer tick captured an older question's
// generation is stale and must be ignored, even if it fires late.
export function isStaleTick(capturedGeneration: number, currentGeneration: number): boolean {
  return capturedGeneration !== currentGeneration;
}
