// src/screens/HomeScreen.tsx
// RESTORATION Step 1 — Home shell + Game Modes list, rebuilt from the
// authoritative screenshots (refs/ref-home-game-modes.jpg).
// - Rotating Earth (NASA Blue Marble, public domain) behind all panels.
// - Daily Challenge is the only wired mode. Every other card is visibly
//   marked SOON and disabled — no nonfunctional navigation (per brief).
// - The skeleton's "Welcome, human..." greeting is replaced by the
//   screenshot's own taglines ("Save the world...", "The AI's waiting...").
// - The "Dark" pill is a display-only theme indicator, not a toggle.
// - Meteor streaks fly across the sky on staggered loops (Step 1b).
//   Pure decoration: pointerEvents="none", never blocks touches.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, Animated, Image, StyleSheet, Easing, Dimensions } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import FeaturedDashboard from '../components/FeaturedDashboard';
import WalkingCharacter from '../components/WalkingCharacter';
import { loadProgress, todayKey, Progress } from '../data/progress';

const EARTH = require('../../assets/earth.jpg');
const { width: W } = Dimensions.get('window');

// Deterministic starfield (seeded, so it never flickers between renders).
function buildStars(count: number) {
  let seed = 42;
  const next = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: next() * 100,
    top: next() * 100,
    size: 1 + next() * 2,
    opacity: 0.25 + next() * 0.6,
  }));
}
const STARS = buildStars(60);

type Mode = {
  key: string;
  icon: string;
  title: string;
  subtitle: string;
  color: string;
  route?: string;
  soon?: boolean;
};

const MODES: Mode[] = [
  {
    key: 'roast',
    icon: '🤖',
    title: 'Beat the AI — Roast Sort',
    subtitle: 'Neon data, savage taunts, jackpots.',
    color: '#5B6CFF',
    soon: true,
  },
  {
    key: 'daily',
    icon: '⚡',
    title: 'Daily Challenge',
    subtitle: 'Smart trivia sessions. New set every day.',
    color: '#22D3EE',
    route: 'Daily',
  },
  {
    key: 'pattern',
    icon: '🧠',
    title: 'Pattern Gauntlet',
    subtitle: 'Remember and repeat the sequences.',
    color: '#7C6CFF',
    soon: true,
  },
  {
    key: 'reflex',
    icon: '💨',
    title: 'Reflex Arena',
    subtitle: 'Arcade-speed taps & swipes. Escalating pace.',
    color: '#22D3EE',
    soon: true,
  },
  {
    key: 'multiplayer',
    icon: '👥',
    title: 'Multiplayer',
    subtitle: 'Co-op vs AI or head-to-head.',
    color: '#FACC15',
    route: 'Multiplayer',
  },
  {
    key: 'party',
    icon: '🎉',
    title: 'Party Mode (soon)',
    subtitle: 'Up to 4 players — versus or co-op.',
    color: '#F87171',
    soon: true,
  },
  {
    key: 'leaderboard',
    icon: '🏆',
    title: 'Leaderboard',
    subtitle: 'Global rankings (coming soon).',
    color: '#4ADE80',
    soon: true,
  },
  {
    key: 'puzzle',
    icon: '🧩',
    title: 'Puzzle Arena',
    subtitle: 'Pick a difficulty. Puzzles coming soon.',
    color: '#F472B6',
    route: 'PuzzleArena',
  },
];

// One meteor streak: flies diagonally down-left, fades in/out, then rests
// before the loop repeats. Staggered delays keep them irregular.
function Meteor({ delay, duration, topPct, drift }: { delay: number; duration: number; topPct: number; drift: number }) {
  const p = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(p, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(p, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(4000),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [p, delay, duration]);

  const translateX = p.interpolate({ inputRange: [0, 1], outputRange: [W + 80, -220] });
  const translateY = p.interpolate({ inputRange: [0, 1], outputRange: [0, drift] });
  const opacity = p.interpolate({ inputRange: [0, 0.08, 0.85, 1], outputRange: [0, 1, 1, 0] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: `${topPct}%`,
        left: 0,
        opacity,
        transform: [{ translateX }, { translateY }, { rotate: '-24deg' }],
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <View style={styles.meteorHead} />
      <View style={styles.meteorTail} />
    </Animated.View>
  );
}

const METEORS = [
  { delay: 800, duration: 1600, topPct: 6, drift: 300 },
  { delay: 5200, duration: 2100, topPct: 18, drift: 380 },
  { delay: 9800, duration: 1400, topPct: 32, drift: 260 },
  { delay: 14200, duration: 2400, topPct: 12, drift: 420 },
];

export default function HomeScreen() {
  const nav = useNavigation();
  const spin = useRef(new Animated.Value(0)).current;
  const [progress, setProgress] = useState<Progress | null>(null);

  // Focus refresh + midnight refresh, both only while Home is focused.
  // - Focus refresh (existing behavior): reload progress whenever Home
  //   regains focus (e.g. returning from Daily).
  // - Midnight refresh: while focused, poll the local calendar date every
  //   30s. The date string is compared BEFORE any storage read — if the
  //   date has not changed, AsyncStorage is never touched. On a date flip,
  //   reload (pot rolls, streak decay applies via loadProgress).
  // The interval is created on focus and cleared on blur, so it never
  // runs while another screen is in front.
  useFocusEffect(
    useCallback(() => {
      loadProgress().then(setProgress);
      let lastSeenDate = todayKey();
      const id = setInterval(() => {
        const now = todayKey();
        if (now === lastSeenDate) return;
        lastSeenDate = now;
        loadProgress().then(setProgress);
      }, 30_000);
      return () => clearInterval(id);
    }, []),
  );

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 120000, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.root}>
      {/* Space backdrop: stars + rotating Earth, behind everything. */}
      {STARS.map((s) => (
        <View
          key={s.id}
          style={{
            position: 'absolute',
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            borderRadius: s.size / 2,
            backgroundColor: '#fff',
            opacity: s.opacity,
          }}
        />
      ))}
      <Animated.View pointerEvents="none" style={[styles.earthWrap, { transform: [{ rotate }] }]}>
        <Image source={EARTH} style={styles.earth} resizeMode="cover" />
      </Animated.View>
      {METEORS.map((m, i) => (
        <Meteor key={i} delay={m.delay} duration={m.duration} topPct={m.topPct} drift={m.drift} />
      ))}
      {/* ASSET #008 walk test — over Earth, behind panels, pointerEvents="none". */}
      <WalkingCharacter />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Beat the AI</Text>
            <Text style={styles.tagline}>Save the world. One pattern at a time.</Text>
          </View>
          <Pressable
            onPress={() => nav.navigate('Settings' as never)}
            style={styles.gear}
            accessibilityLabel="Open Settings"
          >
            <Text style={{ fontSize: 24 }}>⚙️</Text>
          </Pressable>
        </View>

        {/* Featured dashboard (Step 2) — real pot / countdown / missions / streak. */}
        {progress && <FeaturedDashboard progress={progress} />}

        {/* Game Modes */}
        <Text style={styles.sectionTitle}>Game Modes</Text>
        <Text style={styles.sectionSub}>The AI&apos;s waiting. Don&apos;t keep it bored.</Text>

        {MODES.map((m) => (
          <Pressable
            key={m.key}
            disabled={m.soon}
            onPress={() => m.route && nav.navigate(m.route as never)}
            style={[styles.card, { borderColor: m.color, opacity: m.soon ? 0.75 : 1 }]}
          >
            <Text style={styles.cardIcon}>{m.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{m.title}</Text>
              <Text style={styles.cardSub}>{m.subtitle}</Text>
            </View>
            {m.soon ? (
              <Text style={[styles.soonPill, { borderColor: m.color, color: m.color }]}>SOON</Text>
            ) : (
              <View style={[styles.dot, { backgroundColor: m.color }]} />
            )}
          </Pressable>
        ))}

        {/* Theme indicator (display-only — Dark is the only theme). */}
        <View style={styles.darkPill}>
          <View style={styles.darkDot} />
          <Text style={styles.darkText}>Dark</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#05060F' },
  earthWrap: {
    position: 'absolute',
    top: -140,
    alignSelf: 'center',
    width: 560,
    height: 560,
    borderRadius: 280,
    overflow: 'hidden',
    opacity: 0.9,
  },
  earth: { width: 560, height: 560 },
  scroll: { padding: 20, paddingTop: 56, paddingBottom: 32 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { color: '#fff', fontSize: 40, fontWeight: '900', letterSpacing: 0.5 },
  tagline: { color: '#9AA0B5', fontSize: 15, fontWeight: '600', marginTop: 4 },
  gear: {
    borderWidth: 1,
    borderColor: '#2A2E55',
    borderRadius: 14,
    padding: 10,
    backgroundColor: 'rgba(16,18,42,0.85)',
  },
  sectionTitle: { color: '#fff', fontSize: 30, fontWeight: '900', marginTop: 28 },
  sectionSub: { color: '#9AA0B5', fontSize: 15, marginTop: 4, marginBottom: 16 },
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
  cardIcon: { fontSize: 28 },
  cardTitle: { color: '#fff', fontSize: 19, fontWeight: '800' },
  cardSub: { color: '#9AA0B5', fontSize: 14, marginTop: 2 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  soonPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    overflow: 'hidden',
  },
  darkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#2A2E55',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 8,
    backgroundColor: 'rgba(16,18,42,0.85)',
  },
  darkDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#22D3EE' },
  darkText: { color: '#fff', fontWeight: '700' },
  meteorHead: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
    shadowColor: '#fff',
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  meteorTail: {
    width: 110,
    height: 2.5,
    borderRadius: 1.25,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
});
