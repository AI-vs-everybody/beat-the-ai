// src/components/WalkingCharacter.tsx
// ASSET #008 — Controlled game integration test (isolated, reversible).
// - Uses ONLY the approved Frame 1 + Frame 2 assets (no modification).
// - Animation: Frame 1 -> Frame 2 -> Frame 1, 150ms per frame.
// - Stationary, over the Earth, at the tested mobile scale (~250px tall).
// - pointerEvents="none": never blocks buttons, navigation, or gameplay.
// - Disable: set WALK_TEST_ENABLED = false (returns null, game unaffected).
// - Remove: delete this file + the <WalkingCharacter /> line in HomeScreen.
// - No new dependencies. No Stage 3 gameplay. Not merged into the
//   protected baseline — STOP for Atlas review before merging.
import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';

const WALK_TEST_ENABLED = true;
const FRAME_MS = 150;
const FRAME1 = require('../../assets/character-walk-frame1.png');
const FRAME2 = require('../../assets/character-walk-frame2.png');

export default function WalkingCharacter() {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!WALK_TEST_ENABLED) return;
    const id = setInterval(() => setFrame((f) => (f + 1) % 2), FRAME_MS);
    return () => clearInterval(id);
  }, []);

  if (!WALK_TEST_ENABLED) return null;

  return (
    <View pointerEvents="none" style={styles.wrap}>
      <Image source={frame === 0 ? FRAME1 : FRAME2} style={styles.img} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  // Over the Earth (Earth spans y -140..420, centered), behind the
  // ScrollView panels. Feet land at the Earth's bottom edge (y 420).
  wrap: { position: 'absolute', top: 170, alignSelf: 'center', width: 177, height: 250 },
  img: { width: 177, height: 250 },
});
