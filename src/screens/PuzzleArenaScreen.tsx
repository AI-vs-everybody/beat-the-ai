// src/screens/PuzzleArenaScreen.tsx
// PUZZLE ARENA — Stage 2: First Playable Puzzle Arena.
// Flow: select difficulty -> 5 puzzles, one at a time, per-difficulty
// timer -> results (victory at 4+ correct) -> Replay / Home.
// Stage 2 scope ONLY: no taunts, no ego meter, no coin rewards, no
// shields/skips, no IAP, no ads, no multiplayer. No persistence: the
// round lives in local state. All timers are cleaned up on unmount
// and on every phase/index change.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { buildRound, RoundPuzzle, ROUND_SIZE, TIMER_SECONDS, VICTORY_THRESHOLD } from '../data/puzzles';
import { deadlineFor, remainingSeconds, isStaleTick } from '../data/arenaTimer';

type Difficulty = 'easy' | 'medium' | 'hard';
type Phase = 'select' | 'playing' | 'results';
type Answered = { picked: number; timedOut: boolean } | null;

const DIFFICULTIES: { key: Difficulty; label: string; desc: string; color: string }[] = [
  { key: 'easy', label: 'Easy', desc: 'Relaxed pace, generous time.', color: '#4ADE80' },
  { key: 'medium', label: 'Medium', desc: 'Balanced pace and challenge.', color: '#FACC15' },
  { key: 'hard', label: 'Hard', desc: 'Fast pace, tight margins.', color: '#F87171' },
];

const ADVANCE_DELAY_MS = 800;

export default function PuzzleArenaScreen() {
  const nav = useNavigation();
  const [phase, setPhase] = useState<Phase>('select');
  const [selected, setSelected] = useState<Difficulty>('medium');
  const [round, setRound] = useState<RoundPuzzle[]>([]);
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS.medium);
  const [answered, setAnswered] = useState<Answered>(null);

  // Guards the answer/timeout path against double-firing (e.g. a timer
  // tick landing in the same frame as a tap, or a StrictMode re-run).
  const answeredRef = useRef(false);
  const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Deadline-based timing (Stage 2 corrections): the current question's
  // expiry is a wall-clock timestamp. Remaining time is always
  // deadline - now, so background time counts against the player and
  // tick timing only affects display smoothness, never accuracy.
  const deadlineRef = useRef(0);
  // Generation token: incremented on every question start. A timer tick
  // that captured an older generation is stale and must be ignored, so
  // a previous question's timer can never affect the next question.
  const questionGenRef = useRef(0);
  // The round's difficulty, fixed at round start (the selection UI is
  // only shown between rounds, so this never changes mid-round).
  const roundDifficultyRef = useRef<Difficulty>('medium');

  const clearAdvanceTimeout = () => {
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
  };

  // Unmount cleanup: never leave a pending advance running after the
  // player leaves the screen.
  useEffect(() => () => clearAdvanceTimeout(), []);

  // Start (or re-start) a question's clock: full allotted time from a
  // fresh wall-clock deadline, and a new generation that invalidates
  // any timer event from the previous question.
  const startQuestion = useCallback(() => {
    const total = TIMER_SECONDS[roundDifficultyRef.current];
    deadlineRef.current = deadlineFor(total);
    questionGenRef.current += 1;
    setTimeLeft(total);
  }, []);

  const startRound = useCallback(() => {
    clearAdvanceTimeout();
    answeredRef.current = false;
    roundDifficultyRef.current = selected;
    setRound(buildRound());
    setIndex(0);
    setCorrect(0);
    setResults([]);
    setAnswered(null);
    startQuestion();
    setPhase('playing');
  }, [selected, startQuestion]);

  const advance = useCallback(
    (isLast: boolean) => {
      if (isLast) {
        setPhase('results');
      } else {
        setIndex((i) => i + 1);
        setAnswered(null);
        answeredRef.current = false;
        // Fresh deadline + generation for the next question, so it
        // starts with its full allotted time and no stale timer event
        // from the previous question can touch it.
        startQuestion();
      }
    },
    [startQuestion],
  );

  const scheduleAdvance = useCallback(
    (isLast: boolean) => {
      clearAdvanceTimeout();
      advanceTimeoutRef.current = setTimeout(() => advance(isLast), ADVANCE_DELAY_MS);
    },
    [advance],
  );

  const handleAnswer = useCallback(
    (picked: number) => {
      if (answeredRef.current || phase !== 'playing') return;
      answeredRef.current = true;
      const puzzle = round[index];
      if (!puzzle) return;
      const wasCorrect = picked === puzzle.answerIndex;
      if (wasCorrect) setCorrect((c) => c + 1);
      setResults((r) => [...r, wasCorrect]);
      setAnswered({ picked, timedOut: false });
      scheduleAdvance(index >= round.length - 1);
    },
    [answeredRef, phase, round, index, scheduleAdvance],
  );

  const handleTimeout = useCallback(() => {
    if (answeredRef.current || phase !== 'playing') return;
    answeredRef.current = true;
    setResults((r) => [...r, false]);
    setAnswered({ picked: -1, timedOut: true });
    scheduleAdvance(index >= round.length - 1);
  }, [phase, index, round.length, scheduleAdvance]);

  // Timer tick: recompute remaining time from the wall-clock deadline
  // (never decrement a counter). Ticks only refresh the display; the
  // deadline is the source of truth, so a late/throttled tick — e.g.
  // after the app was backgrounded — can never grant extra time.
  // The tick captures the current generation and ignores itself if the
  // generation moved on (stale tick from a previous question).
  // The interval is recreated on every index/phase/answered change and
  // cleared on cleanup — no timer survives leaving the screen.
  useEffect(() => {
    if (phase !== 'playing' || answered) return;
    const gen = questionGenRef.current;
    const id = setInterval(() => {
      if (isStaleTick(gen, questionGenRef.current)) return;
      setTimeLeft(remainingSeconds(deadlineRef.current));
    }, 250);
    return () => clearInterval(id);
  }, [phase, index, answered]);

  // Timeout reaction: when the clock hits zero, the puzzle counts as
  // wrong and the round advances after the feedback delay.
  useEffect(() => {
    if (phase === 'playing' && !answered && timeLeft <= 0 && round.length > 0) {
      handleTimeout();
    }
  }, [timeLeft, phase, answered, round.length, handleTimeout]);

  const selectedLabel = DIFFICULTIES.find((d) => d.key === selected)?.label ?? 'Medium';
  const puzzle = round[index];
  const totalTime = TIMER_SECONDS[selected];
  const victory = correct >= VICTORY_THRESHOLD;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Puzzle Arena</Text>

        {phase === 'select' && (
          <>
            <Text style={styles.sub}>Pick a difficulty. Five puzzles per round. 4 correct to win.</Text>
            {DIFFICULTIES.map((d) => {
              const isSelected = d.key === selected;
              return (
                <Pressable
                  key={d.key}
                  onPress={() => setSelected(d.key)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  style={[styles.card, { borderColor: isSelected ? d.color : '#2A2E55' }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{d.label}</Text>
                    <Text style={styles.cardDesc}>{d.desc}</Text>
                  </View>
                  <View
                    style={[
                      styles.radio,
                      { borderColor: d.color, backgroundColor: isSelected ? d.color : 'transparent' },
                    ]}
                  >
                    {isSelected && <Text style={styles.check}>✓</Text>}
                  </View>
                </Pressable>
              );
            })}
            <Text style={styles.readout}>Selected: {selectedLabel}</Text>
            <Pressable onPress={startRound} style={styles.startBtn}>
              <Text style={styles.startText}>Enter the Arena</Text>
            </Pressable>
          </>
        )}

        {phase === 'playing' && puzzle && (
          <>
            <Text style={styles.sub}>
              Puzzle {index + 1} of {ROUND_SIZE} · {selectedLabel} · {correct} correct
            </Text>
            <Text style={[styles.timer, { color: timeLeft <= 5 ? '#F87171' : '#22D3EE' }]}>
              {timeLeft}s
            </Text>
            <View style={styles.timerBar}>
              <View
                style={[
                  styles.timerFill,
                  {
                    width: `${Math.max(0, (timeLeft / totalTime) * 100)}%`,
                    backgroundColor: timeLeft <= 5 ? '#F87171' : '#22D3EE',
                  },
                ]}
              />
            </View>
            <Text style={styles.kindLabel}>{puzzle.kind === 'pattern' ? 'Pattern' : 'Logic'}</Text>
            <Text style={styles.question}>{puzzle.question}</Text>
            {puzzle.options.map((opt, i) => {
              let borderColor = '#2A2E55';
              let bg = 'rgba(16,18,42,0.92)';
              if (answered) {
                if (i === puzzle.answerIndex) {
                  borderColor = '#4ADE80';
                  bg = 'rgba(74,222,128,0.15)';
                } else if (i === answered.picked) {
                  borderColor = '#F87171';
                  bg = 'rgba(248,113,113,0.15)';
                }
              }
              return (
                <Pressable
                  key={`${puzzle.id}-opt-${i}`}
                  disabled={answered !== null}
                  onPress={() => handleAnswer(i)}
                  style={[styles.card, { borderColor, backgroundColor: bg }]}
                >
                  <Text style={styles.optionText}>{opt}</Text>
                </Pressable>
              );
            })}
            {answered?.timedOut && <Text style={styles.timeoutText}>Time's up!</Text>}
          </>
        )}

        {phase === 'results' && (
          <>
            <Text style={styles.sub}>Round complete · {selectedLabel}</Text>
            <Text style={styles.score}>
              {correct} / {ROUND_SIZE}
            </Text>
            <Text style={[styles.verdict, { color: victory ? '#4ADE80' : '#FACC15' }]}>
              {victory ? 'Victory!' : 'So close — run it back.'}
            </Text>
            <View style={styles.resultRow}>
              {results.map((ok, i) => (
                <Text key={i} style={[styles.resultMark, { color: ok ? '#4ADE80' : '#F87171' }]}>
                  {ok ? '✓' : '✗'}
                </Text>
              ))}
            </View>
            <Pressable onPress={startRound} style={styles.startBtn}>
              <Text style={styles.startText}>Replay</Text>
            </Pressable>
            <Pressable onPress={() => setPhase('select')} style={styles.secondaryBtn}>
              <Text style={styles.secondaryText}>Change Difficulty</Text>
            </Pressable>
          </>
        )}

        <View style={styles.bottomRow}>
          <Pressable onPress={() => nav.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>‹ Back</Text>
          </Pressable>
          <Pressable onPress={() => nav.navigate('Home' as never)} style={styles.homeBtn}>
            <Text style={styles.homeText}>⌂ Home</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#05060F' },
  scroll: { padding: 20, paddingTop: 56, paddingBottom: 32 },
  title: { color: '#fff', fontSize: 40, fontWeight: '900', letterSpacing: 0.5 },
  sub: { color: '#9AA0B5', fontSize: 15, fontWeight: '600', marginTop: 4, marginBottom: 20 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 20,
    backgroundColor: 'rgba(16,18,42,0.92)',
    padding: 16,
    marginBottom: 14,
  },
  cardTitle: { color: '#fff', fontSize: 19, fontWeight: '800' },
  cardDesc: { color: '#9AA0B5', fontSize: 14, marginTop: 2 },
  radio: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: { color: '#000', fontSize: 16, fontWeight: '900' },
  readout: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 4, marginBottom: 16 },
  startBtn: { backgroundColor: '#22D3EE', borderRadius: 18, paddingVertical: 14, alignItems: 'center', marginBottom: 12 },
  startText: { color: '#000', fontSize: 18, fontWeight: '900' },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: '#2A2E55',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  timer: { fontSize: 44, fontWeight: '900', textAlign: 'center' },
  timerBar: { height: 6, borderRadius: 3, backgroundColor: '#1A1D33', marginVertical: 12, overflow: 'hidden' },
  timerFill: { height: 6, borderRadius: 3 },
  kindLabel: { color: '#22D3EE', fontSize: 13, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' },
  question: { color: '#fff', fontSize: 21, fontWeight: '800', lineHeight: 28, marginTop: 6, marginBottom: 18 },
  optionText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  timeoutText: { color: '#F87171', fontSize: 16, fontWeight: '800', textAlign: 'center', marginTop: 4 },
  score: { color: '#fff', fontSize: 64, fontWeight: '900', textAlign: 'center', marginTop: 8 },
  verdict: { fontSize: 24, fontWeight: '900', textAlign: 'center', marginTop: 8 },
  resultRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginVertical: 18 },
  resultMark: { fontSize: 28, fontWeight: '900' },
  bottomRow: { flexDirection: 'row', gap: 10, marginTop: 24 },
  backBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#2A2E55',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
  },
  backText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  homeBtn: { flex: 1, backgroundColor: '#22D3EE', borderRadius: 18, paddingVertical: 14, alignItems: 'center' },
  homeText: { color: '#000', fontSize: 18, fontWeight: '900' },
});
