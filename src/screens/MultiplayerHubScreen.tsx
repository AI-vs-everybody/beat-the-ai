// src/screens/MultiplayerHubScreen.tsx
// RESTORATION Step 3 — Multiplayer Hub, from refs/ref-multiplayer-hub.jpg.
// All six modes are visibly marked SOON and disabled: none has gameplay yet.
// The Hub's own navigation is real: Back returns, Home goes Home.
// Deviation from the screenshot (recorded): the screenshot's chevrons are
// replaced by SOON pills — the brief requires incomplete modes to be clearly
// marked unavailable rather than implying navigation that does not exist.
import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

type Mode = {
  key: string;
  icon: string;
  title: string;
  desc: string;
  color: string;
  badge: string;
};

const MODES: Mode[] = [
  {
    key: 'coop',
    icon: '👥',
    title: 'Co-op vs AI',
    desc: 'Team up and conquer the machine. Shared lives, shared glory.',
    color: '#3EC1F3',
    badge: 'Local',
  },
  {
    key: 'pvp',
    icon: '⚔️',
    title: 'PvP (Couples/Friends)',
    desc: 'Head-to-head. Fast rounds. Bragging rights unlocked.',
    color: '#FBBF24',
    badge: '1v1',
  },
  {
    key: 'pvpvai',
    icon: '⚡',
    title: 'PvPvAI',
    desc: 'You vs friend vs the AI. Chaos mode. Adapt or lose.',
    color: '#C084FC',
    badge: 'Chaotic',
  },
  {
    key: 'couples',
    icon: '❤️',
    title: 'Couples Mode',
    desc: 'Play nice—or don’t. Alternating turns, sweetest rivalry.',
    color: '#F9A8D4',
    badge: 'Duo',
  },
  {
    key: 'charades',
    icon: '🎭',
    title: 'Charades (Local)',
    desc: 'Act it out. No words. Fast laughs, faster points.',
    color: '#A7F3D0',
    badge: 'Party',
  },
  {
    key: 'party',
    icon: '🎮',
    title: 'Party Games',
    desc: 'Quickfire mini-games for groups. Laughs guaranteed.',
    color: '#A78BFA',
    badge: 'Group',
  },
];

export default function MultiplayerHubScreen() {
  const nav = useNavigation();

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Multiplayer Hub</Text>
          <View style={styles.localPill}>
            <Text style={styles.localText}>🛡️ Local First</Text>
          </View>
        </View>
        <Text style={styles.sub}>Pick a mode. Mastery grows when you play together.</Text>

        {MODES.map((m) => (
          <Pressable key={m.key} disabled style={[styles.card, { backgroundColor: m.color, opacity: 0.95 }]}>
            <View style={styles.iconBox}>
              <Text style={styles.icon}>{m.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{m.title}</Text>
              <Text style={styles.cardDesc}>{m.desc}</Text>
            </View>
            <View style={styles.rightCol}>
              <Text style={styles.badge}>{m.badge}</Text>
              <Text style={styles.soon}>SOON</Text>
            </View>
          </Pressable>
        ))}

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
  root: { flex: 1, backgroundColor: '#0B0B12' },
  scroll: { padding: 20, paddingTop: 56, paddingBottom: 32 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: '#fff', fontSize: 32, fontWeight: '900' },
  localPill: {
    borderWidth: 1,
    borderColor: '#2A2E55',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(16,18,42,0.9)',
  },
  localText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  sub: { color: '#9AA0B5', fontSize: 15, marginTop: 6, marginBottom: 18 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 28 },
  cardTitle: { color: '#000', fontSize: 21, fontWeight: '900' },
  cardDesc: { color: '#1A1A1A', fontSize: 14, fontWeight: '600', marginTop: 2, lineHeight: 19 },
  rightCol: { alignItems: 'flex-end', gap: 6 },
  badge: {
    borderWidth: 1.5,
    borderColor: '#000',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    color: '#000',
    fontWeight: '800',
    fontSize: 12,
    overflow: 'hidden',
  },
  soon: {
    backgroundColor: '#000',
    color: '#fff',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 1,
    overflow: 'hidden',
  },
  bottomRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
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
