// src/screens/MissionsScreen.tsx
// Missions list (restoration Step 2). Progress is real, from progress.ts.
// Missions carry no coin rewards yet — that rule is stated, not implied.
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { getMissions, loadProgress, Progress } from '../data/progress';

export default function MissionsScreen() {
  const [progress, setProgress] = useState<Progress | null>(null);

  useEffect(() => {
    loadProgress().then(setProgress);
  }, []);

  const missions = progress ? getMissions(progress) : [];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Missions</Text>
      <Text style={styles.note}>
        Real progress, tracked on-device. Missions carry no coin rewards yet.
      </Text>
      {missions.map((m) => (
        <View key={m.id} style={styles.card}>
          <Text style={styles.mTitle}>
            {m.done ? '✓ ' : ''}
            {m.title}
          </Text>
          <Text style={styles.mDesc}>{m.desc}</Text>
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${(m.progress / m.target) * 100}%` }]} />
          </View>
          <Text style={styles.mProg}>
            {m.progress} / {m.target}
            {m.done ? ' — Done' : ''}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#05060F' },
  title: { color: '#fff', fontSize: 28, fontWeight: '900', marginBottom: 6 },
  note: { color: '#9AA0B5', fontSize: 14, marginBottom: 18 },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#2A2E55',
    backgroundColor: 'rgba(16,18,42,0.92)',
    padding: 16,
    marginBottom: 12,
  },
  mTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  mDesc: { color: '#9AA0B5', fontSize: 14, marginTop: 4 },
  barBg: { height: 10, borderRadius: 5, backgroundColor: '#23264A', marginTop: 10, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 5, backgroundColor: '#FACC15' },
  mProg: { color: '#B9C0D8', fontSize: 13, marginTop: 6, fontWeight: '700' },
});
