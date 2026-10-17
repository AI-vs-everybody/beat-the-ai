// src/data/progress.ts
// Fictional-coin pot, streak, stats, and missions — all local-only.
// Coins are FICTIONAL: no cash value, no purchases, no cash-out, no
// real-money mechanics of any kind. Everything lives in AsyncStorage.
import AsyncStorage from '@react-native-async-storage/async-storage';

export const PROGRESS_KEY = 'progress_v1';
export const DAILY_POT_BASE = 1000;
export const BONUS_PER_WIN = 20; // 2% of base per win today
export const DAILY_POT_CAP = 2000;

export type Progress = {
  version: 1;
  potDate: string; // local YYYY-MM-DD the pot/wins belong to
  winsToday: number;
  streak: number; // consecutive days with a recorded Daily completion
  bestStreak: number;
  totalCorrect: number;
  completedDates: string[]; // local YYYY-MM-DD, one entry per recorded day
};

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function yesterdayKey(d = new Date()): string {
  // Calendar arithmetic, NOT 24h of milliseconds: on the day after a
  // spring-forward (23h day), now - 86400000 lands on the day BEFORE
  // yesterday for times in the first hour after midnight. setDate
  // normalizes across month/year boundaries and DST transitions.
  return todayKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1));
}

export function defaultProgress(): Progress {
  return {
    version: 1,
    potDate: todayKey(),
    winsToday: 0,
    streak: 0,
    bestStreak: 0,
    totalCorrect: 0,
    completedDates: [],
  };
}

export async function loadProgress(): Promise<Progress> {
  try {
    const raw = await AsyncStorage.getItem(PROGRESS_KEY);
    if (!raw) return defaultProgress();
    const p = JSON.parse(raw) as Progress;
    if (p.version !== 1) return defaultProgress();
    // Roll the pot to today if the stored pot belongs to an older day.
    if (p.potDate !== todayKey()) {
      p.potDate = todayKey();
      p.winsToday = 0;
    }
    // A streak is broken once neither today nor yesterday was completed.
    if (!p.completedDates.includes(todayKey()) && !p.completedDates.includes(yesterdayKey())) {
      p.streak = 0;
    }
    return p;
  } catch {
    return defaultProgress();
  }
}

export async function saveProgress(p: Progress): Promise<void> {
  try {
    await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  } catch {
    // Local-only storage; a failed write must never crash gameplay.
  }
}

// Record one Daily completion. Idempotent per local day: replaying the
// Daily records nothing. A completion counts as a "win" for the pot.
//
// Writes are serialized through a promise queue: two concurrent calls
// (e.g. a double-fired effect) must not both read "not completed today"
// and both count the win. The second call re-loads AFTER the first saved,
// so it sees today as completed and records nothing.
let completionQueue: Promise<unknown> = Promise.resolve();

export function recordDailyCompletion(correct: number): Promise<Progress> {
  const run = completionQueue.then(() => recordDailyCompletionInner(correct));
  completionQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function recordDailyCompletionInner(correct: number): Promise<Progress> {
  const p = await loadProgress();
  const today = todayKey();
  if (p.completedDates.includes(today)) return p;
  if (p.potDate !== today) {
    p.potDate = today;
    p.winsToday = 0;
  }
  p.winsToday += 1;
  p.totalCorrect += correct;
  p.completedDates.push(today);
  p.streak = p.completedDates.includes(yesterdayKey()) ? p.streak + 1 : 1;
  p.bestStreak = Math.max(p.bestStreak, p.streak);
  await saveProgress(p);
  return p;
}

export function dailyPot(p: Progress): number {
  const wins = p.potDate === todayKey() ? p.winsToday : 0;
  return DAILY_POT_BASE + wins * BONUS_PER_WIN;
}

export type Mission = {
  id: string;
  title: string;
  desc: string;
  progress: number;
  target: number;
  done: boolean;
};

export function getMissions(p: Progress): Mission[] {
  const today = todayKey();
  const doneToday = p.completedDates.includes(today);
  return [
    {
      id: 'daily-today',
      title: "Complete today's Daily Challenge",
      desc: 'Finish the Daily set.',
      progress: doneToday ? 1 : 0,
      target: 1,
      done: doneToday,
    },
    {
      id: 'streak-2',
      title: 'Win 2 days in a row',
      desc: 'Complete the Daily two days running.',
      progress: Math.min(p.streak, 2),
      target: 2,
      done: p.streak >= 2,
    },
    {
      id: 'correct-10',
      title: 'Answer 10 questions correctly',
      desc: 'All-time correct answers in the Daily.',
      progress: Math.min(p.totalCorrect, 10),
      target: 10,
      done: p.totalCorrect >= 10,
    },
  ];
}

// Milliseconds until local midnight — drives the "Resets in" countdown.
export function msUntilMidnight(now = new Date()): number {
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return Math.max(0, end.getTime() - now.getTime());
}

export function formatCountdown(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = String(Math.floor(total / 3600)).padStart(2, '0');
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}
