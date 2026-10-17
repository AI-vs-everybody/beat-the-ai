// screens/DailyChallengeScreen.tsx
import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Pressable, Alert, BackHandler, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { recordDailyCompletion } from '../data/progress';

type Q = { q: string; options: string[]; a: number };

const BANK: Q[] = [
  { q: '2 + 2 × 2 = ?', options: ['4', '6', '8', '2'], a: 1 },
  { q: 'Which color often signals success?', options: ['Red', 'Green', 'Gray', 'Beige'], a: 1 },
  { q: 'Tap the odd one out', options: ['AI', 'ML', 'CPU', 'DL'], a: 2 },
];

function seedFromDateUTC(): number {
  const d = new Date();
  return Number(
    `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`
  );
}
function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export default function DailyChallengeScreen() {
  const navigation = useNavigation();
  const seed = seedFromDateUTC();
  const rand = useMemo(() => rng(seed), [seed]);

  const questions = useMemo(() => {
    const pool = [...BANK];
    const arr: Q[] = [];
    for (let i = 0; i < 3; i++) {
      const idx = Math.floor(rand() * pool.length);
      arr.push(pool.splice(idx, 1)[0]);
    }
    return arr;
  }, [rand]);

  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const done = i >= questions.length;

  // Record one completion per day (idempotent in progress.ts -- replays record nothing). A completion counts as a Daily win for the pot.
  const recorded = useRef(false);
  useEffect(() => {
    if (done && !recorded.current) {
      recorded.current = true;
      recordDailyCompletion(score);
    }
  }, [done, score]);

  const confirmExit = useCallback(() => {
    Alert.alert('Exit Daily?', 'Your progress will be lost.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Exit', style: 'destructive', onPress: () => (navigation as any).navigate('Home') },
    ]);
  }, [navigation]);

  // Android hardware back => confirm
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      confirmExit();
      return true; // block default
    });
    return () => sub.remove();
  }, [confirmExit]);

  const submit = (choice: number) => {
    if (done) return;
    if (choice === questions[i].a) setScore((s) => s + 1);
    setI((n) => n + 1);
  };

  if (done) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <StatusBar barStyle="light-content" />
        <Text style={{ color: '#0ff', fontSize: 22, fontWeight: '900', marginBottom: 12 }}>Daily Complete</Text>
        <Text style={{ color: '#fff', marginBottom: 24 }}>
          Score: {score} / {questions.length}
        </Text>
        <Pressable onPress={() => (navigation as any).navigate('Home')}>
          <Text style={{ color: '#0ff', textDecorationLine: 'underline' }}>Back to Home</Text>
        </Pressable>
      </View>
    );
  }

  const q = questions[i];

  return (
    <View style={{ flex: 1, backgroundColor: '#000', padding: 20, justifyContent: 'center' }}>
      <StatusBar barStyle="light-content" />
      <Text style={{ color: '#0ff', fontSize: 14, marginBottom: 8 }}>Daily Challenge</Text>
      <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 16 }}>
        Q{i + 1}. {q.q}
      </Text>

      {q.options.map((opt, idx) => (
        <Pressable
          key={idx}
          onPress={() => submit(idx)}
          style={{ backgroundColor: '#0ff', padding: 14, borderRadius: 12, marginBottom: 10 }}
        >
          <Text style={{ color: '#000', fontWeight: '900' }}>{opt}</Text>
        </Pressable>
      ))}
    </View>
  );
}
