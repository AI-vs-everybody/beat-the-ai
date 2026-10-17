// src/components/FeaturedDashboard.tsx
// RESTORATION Step 2 — featured dashboard, from refs/ref-featured-dashboard.jpg.
// Daily Pot, countdown, Missions, and Streak are REAL, driven by progress.ts.
// "Play Now — Risk It" stays disabled + SOON until Roast Sort gameplay exists
// (no nonfunctional navigation, per the brief).
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Alert, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  DAILY_POT_CAP,
  dailyPot,
  formatCountdown,
  getMissions,
  msUntilMidnight,
  Progress,
} from '../data/progress';

const HERO = require('../../assets/featured-hero.jpg');

export const POT_RULES =
  'Daily Pot: starts at 1,000 fictional coins each day. Each Daily Challenge win adds 20 coins (+2%). The pot resets at midnight. Fictional coins only — no cash value, no purchases, no cash-out.';

export default function FeaturedDashboard({ progress }: { progress: Progress }) {
  const nav = useNavigation();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const pot = dailyPot(progress);
  const missions = getMissions(progress);
  const openMissions = missions.some((m) => !m.done);

  return (
    <View>
      {/* Hero: Save Humanity card with the new (#2) art. */}
      <View style={styles.hero}>
        <Image source={HERO} style={styles.heroImg} resizeMode="cover" />
        <View style={styles.ribbon}>
          <Text style={styles.ribbonText}>Save Humanity</Text>
        </View>
      </View>

      {/* Roast Sort featured panel */}
      <View style={styles.panel}>
        <View style={styles.panelHead}>
          <View style={styles.aiCircle}>
            <Text style={styles.aiText}>AI</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.panelTitle}>Beat the AI</Text>
            <Text style={styles.panelSub}>ROAST SORT</Text>
          </View>
          <View style={styles.featuredPill}>
            <Text style={styles.featuredText}>⚡ FEATURED</Text>
          </View>
        </View>

        <View style={styles.potBox}>
          <View style={styles.potRow}>
            <Text style={styles.potLabel}>Daily Pot</Text>
            <Text style={styles.potValue}>🪙 {pot.toLocaleString()}</Text>
          </View>
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${Math.min(100, (pot / DAILY_POT_CAP) * 100)}%` }]} />
          </View>
          <View style={styles.potRow}>
            <Text style={styles.potNote}>+2% per win today</Text>
            <Text style={styles.potNote}>Resets in {formatCountdown(msUntilMidnight(new Date(now)))}</Text>
          </View>
          <Text style={styles.disclaimer}>
            Fictional coins only. For in-game use only. No cash value. No real-money gambling.
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable disabled style={[styles.playBtn, { opacity: 0.6 }]}>
            <Text style={styles.playText}>▶ Play Now — Risk It · SOON</Text>
          </Pressable>
          <Pressable onPress={() => Alert.alert('Daily Pot', POT_RULES)} style={styles.qBtn}>
            <Text style={styles.qText}>?</Text>
          </Pressable>
        </View>
        <Text style={styles.luck}>Beginner&apos;s luck expires soon.</Text>
      </View>

      {/* Missions + Streak */}
      <View style={styles.row}>
        <Pressable onPress={() => nav.navigate('Missions' as never)} style={styles.missionsBtn}>
          <Text style={styles.missionsText}>⚑ Missions {openMissions ? '●' : ''}</Text>
        </Pressable>
        <View style={styles.streakPill}>
          <Text style={styles.streakText}>
            🧊 Streak {progress.streak} (best {progress.bestStreak})
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2A2E55',
    marginBottom: 16,
  },
  heroImg: { width: '100%', height: 210 },
  ribbon: {
    position: 'absolute',
    right: -38,
    top: 84,
    transform: [{ rotate: '70deg' }],
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 40,
    paddingVertical: 6,
  },
  ribbonText: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
  panel: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#2A2E55',
    backgroundColor: 'rgba(16,18,42,0.92)',
    padding: 16,
    marginBottom: 16,
  },
  panelHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  aiCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: '#5B6CFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiText: { color: '#fff', fontSize: 20, fontWeight: '900' },
  panelTitle: { color: '#fff', fontSize: 22, fontWeight: '900' },
  panelSub: { color: '#8EA0FF', fontSize: 15, fontWeight: '800', letterSpacing: 2 },
  featuredPill: { backgroundColor: '#FACC15', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  featuredText: { color: '#000', fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  potBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#2A2E55',
    backgroundColor: 'rgba(10,12,32,0.9)',
    padding: 14,
    marginBottom: 14,
  },
  potRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  potLabel: { color: '#fff', fontSize: 19, fontWeight: '800' },
  potValue: { color: '#FACC15', fontSize: 19, fontWeight: '900' },
  barBg: { height: 14, borderRadius: 7, backgroundColor: '#23264A', marginVertical: 10, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 7, backgroundColor: '#5B9CFF' },
  potNote: { color: '#B9C0D8', fontSize: 14, fontWeight: '700' },
  disclaimer: { color: '#9AA0B5', fontSize: 13, marginTop: 8, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  playBtn: {
    flex: 1,
    backgroundColor: '#5B7CFF',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
  },
  playText: { color: '#000', fontWeight: '900', fontSize: 16 },
  qBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2E55',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  luck: { color: '#B9C0D8', fontSize: 15, fontWeight: '700', marginTop: 10 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  missionsBtn: { backgroundColor: '#FACC15', borderRadius: 999, paddingHorizontal: 18, paddingVertical: 12 },
  missionsText: { color: '#000', fontWeight: '900', fontSize: 15 },
  streakPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#2A2E55',
    backgroundColor: 'rgba(60,64,100,0.9)',
    paddingVertical: 12,
  },
  streakText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
