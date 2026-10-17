// src/screens/PuzzleArenaScreen.tsx
// PUZZLE ARENA — STAGE 1 ONLY (Atlas-authorized).
// Scope: difficulty selection UI + safe entry/return navigation.
// Explicitly NOT implemented: puzzles, scoring, taunts, coins,
// monetization. The Start control is disabled + SOON; nothing launches.
// No gameplay systems are touched: no progress.ts, no AsyncStorage,
// no new dependencies. Selection lives in local state only.
import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTIES: { key: Difficulty; label: string; desc: string; color: string }[] = [
  { key: 'easy', label: 'Easy', desc: 'Relaxed pace, generous time.', color: '#4ADE80' },
  { key: 'medium', label: 'Medium', desc: 'Balanced pace and challenge.', color: '#FACC15' },
  { key: 'hard', label: 'Hard', desc: 'Fast pace, tight margins.', color: '#F87171' },
];

export default function PuzzleArenaScreen() {
  const nav = useNavigation();
  const [selected, setSelected] = useState<Difficulty>('medium');

  const selectedLabel = DIFFICULTIES.find((d) => d.key === selected)?.label ?? 'Medium';

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Puzzle Arena</Text>
        <Text style={styles.sub}>Pick a difficulty. Puzzles arrive in Stage 2.</Text>

        {DIFFICULTIES.map((d) => {
          const isSelected = d.key === selected;
          return (
            <Pressable
              key={d.key}
              onPress={() => setSelected(d.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              style={[
                styles.card,
                { borderColor: isSelected ? d.color : '#2A2E55' },
              ]}
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

        <Pressable disabled style={[styles.startBtn, { opacity: 0.6 }]}>
          <Text style={styles.startText}>Enter the Arena · SOON</Text>
        </Pressable>
        <Text style={styles.note}>Stage 1: difficulty selection only. Puzzle gameplay arrives in Stage 2.</Text>

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
  startBtn: { backgroundColor: '#22D3EE', borderRadius: 18, paddingVertical: 14, alignItems: 'center' },
  startText: { color: '#000', fontSize: 18, fontWeight: '900' },
  note: { color: '#9AA0B5', fontSize: 13, marginTop: 10, textAlign: 'center' },
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
