// src/screens/HomeScreen.tsx
// HOME SCREEN — Master Implementation (Atlas, 2026-10-18).
// The attached Master Concept mockup is the visual source of truth for
// COMPOSITION (hierarchy, neon, atmosphere, panels, spacing). The ARTWORK
// itself comes from the approved production files — the mockup's hero is a
// generated composition reference, NOT a replacement for the existing hero
// file (per the Master prompt's own rule).
//
// Geometry (390x844 iPhone, safe areas via useSafeAreaInsets):
// - Hero: FULL-WIDTH (W), 505 tall. The original file (1179x2549) is shown
//   at uniform scale (no stretch). Displayed crop = original y 182-1710
//   (a measured 10.6% TOP crop: y 0-150 is dark scenery, solid character
//   mass starts ~150; a 15% crop would cut ~107px of hair, so 10.6% is
//   used). Faces + complete "BEAT THE AI" title fully visible. The hero's
//   lower edge fades into the space background BELOW the title (title ends
//   y485, fade 485-505) via 10 stepped opacity Views (no new dependency —
//   expo-linear-gradient NOT added, per the no-new-deps rule). NO frame,
//   NO border, NO rounded corners. The banner overlaps the hero's fade by
//   3px so the hero transitions into the interface with no rectangular break.
// - Story Mode banner: FULL-WIDTH within margins (W-32 = 358, height 100,
//   aspect 1074:300 preserved, no distortion). Artwork only in the PNG;
//   ALL text (STORY MODE + subtitle + COMING SOON pill) rendered in code.
//   Pressable disabled, feature closed. Subtle ambient border-glow pulse
//   (no flashing).
// - Six icons: 3x2 grid, tiles 114x132, icon 72 ("large"), labels in code,
//   neon borders, dark translucent bg (70% — Earth shows through). Streak
//   + Daily Pot show LIVE values in code (NOT baked into art). Streak and
//   Daily Pot BOTH navigate to Missions (Master prompt §8 — this supersedes
//   the V1 Daily Pot pot-rules Alert).
// - Micro-animations (RN Animated, already proven in this file — no new
//   deps, no Reanimated Babel risk): icon float (translateY ±4px, 2400ms,
//   staggered 350ms per tile), border-glow pulse (opacity 0.15-0.45, same
//   stagger), press scale-down (0.96, spring return) + brief glow boost.
//   Story Mode border glow (opacity 0.25-0.65, 3000ms). ALL gated by
//   reduced-motion: when enabled, no float/glow/press-scale, Earth static,
//   meteors hidden.
// - Earth: rotating (120s), darkened 15% by a translucent overlay
//   (rgba(5,6,15,0.15)) so labels read better over it — the Earth file
//   itself is UNCHANGED. Starfield (60 seeded) + 4 staggered meteors
//   preserved BEHIND the interface, all pointerEvents="none".
// - Walking character REMOVED from Home (WalkingCharacter.tsx + frame PNGs
//   preserved for Story Mode — NOT rendered, NOT deleted).
// - Settings gear upper-right, 44x44 + hitSlop. Navigation / game logic /
//   progress / fictional-coin balances UNCHANGED. Fictional-coins
//   disclaimer REMOVED from Home (Atlas Final Adjustment 2026-10-18) —
//   disclosures remain in Settings / Terms / FeaturedDashboard.
// - Screen fit (Atlas Final Correction, 390x844): hero extends into the
//   top safe area (ScrollView paddingTop 0 — hero top is dark, status-bar
//   text stays legible, Dynamic Island overlays dark scenery, no faces
//   covered). Hero 485 (shows original y 182-1648: faces + COMPLETE title
//   intact, cuts only non-essential floor) + banner 100 (3px hero overlap)
//   + grid 240 (tiles 116, icon 60, gap 8) = row 2 ends y822, 8px clearance
//   above the home indicator (830). All six tiles + labels + values fit
//   without scrolling. ScrollView gap 0, grid marginTop 0. Meteors render
//   ABOVE the ScrollView (pointerEvents="none", peak opacity 0.6) so they
//   are visible without obscuring faces/logo/labels. Earth 120s + 15% dim
//   UNCHANGED. 375x667: content overflows (row 2 ends ~818, screen 667) —
//   scrolling required on the smaller screen (graceful degradation, no
//   clipping, gear accessible). No further shrinking (stop condition).
// - No new dependencies. No Stage 3 gameplay. No baseline merge.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Animated,
  Image,
  StyleSheet,
  Easing,
  Dimensions,
  AccessibilityInfo,
  ImageSourcePropType,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { loadProgress, todayKey, Progress, dailyPot } from '../data/progress';

const HERO = require('../../assets/hero-artwork.jpg');
const BANNER = require('../../assets/story-mode-banner.png');
const ICON_DAILY = require('../../assets/icon-daily-challenge.png');
const ICON_PUZZLE = require('../../assets/icon-puzzle-arena.png');
const ICON_MISSIONS = require('../../assets/icon-missions.png');
const ICON_MULTIPLAYER = require('../../assets/icon-multiplayer.png');
const ICON_STREAK = require('../../assets/icon-streak.png');
const ICON_POT = require('../../assets/icon-daily-pot.png');
const EARTH = require('../../assets/earth.jpg');

const { width: W, height: H } = Dimensions.get('window');

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

type Tile = {
  key: string;
  label: string;
  icon: ImageSourcePropType;
  border: string;
  route: string;
  valueKind?: 'streak' | 'pot';
};

const TILES: Tile[] = [
  { key: 'daily', label: 'Daily Challenge', icon: ICON_DAILY, border: '#22D3EE', route: 'Daily' },
  { key: 'puzzle', label: 'Puzzle Arena', icon: ICON_PUZZLE, border: '#C084FC', route: 'PuzzleArena' },
  { key: 'missions', label: 'Missions', icon: ICON_MISSIONS, border: '#34D399', route: 'Missions' },
  { key: 'multiplayer', label: 'Multiplayer', icon: ICON_MULTIPLAYER, border: '#60A5FA', route: 'Multiplayer' },
  { key: 'streak', label: 'Streak', icon: ICON_STREAK, border: '#FB923C', route: 'Missions', valueKind: 'streak' },
  { key: 'pot', label: 'Daily Pot', icon: ICON_POT, border: '#FACC15', route: 'Missions', valueKind: 'pot' },
];

// One game tile: float + glow pulse (staggered) + press scale + press glow.
// All animation uses RN Animated with useNativeDriver (opacity/transform
// only) — no re-renders, no new dependencies. Memoized so a parent
// re-render (e.g. progress refresh) does not restart the animations.
const GameTile = React.memo(function GameTile({
  tile,
  index,
  value,
  accessibilityLabel,
  onPress,
  reduceMotion,
}: {
  tile: Tile;
  index: number;
  value: string | null;
  accessibilityLabel: string;
  onPress: () => void;
  reduceMotion: boolean;
}) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;
  const pressGlow = useRef(new Animated.Value(0)).current;

  // Gentle float (icon artwork only, labels stay stable) + glow pulse.
  // Staggered by index so tiles don't move together. Gated by reduced-motion.
  useEffect(() => {
    if (reduceMotion) return;
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(index * 350),
        Animated.timing(floatAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(index * 350),
        Animated.timing(glowAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    floatLoop.start();
    glowLoop.start();
    return () => {
      floatLoop.stop();
      glowLoop.stop();
    };
  }, [floatAnim, glowAnim, index, reduceMotion]);

  const floatY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -4] });
  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.45] });

  const handlePressIn = () => {
    if (reduceMotion) return;
    Animated.spring(pressScale, { toValue: 0.96, useNativeDriver: true, speed: 50, bounciness: 8 }).start();
    Animated.timing(pressGlow, { toValue: 0.6, duration: 150, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    if (reduceMotion) return;
    Animated.spring(pressScale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 8 }).start();
    Animated.timing(pressGlow, { toValue: 0, duration: 250, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={{ flex: 1, transform: [{ scale: pressScale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.tile, { borderColor: tile.border }]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {/* Glow pulse (ambient) + press glow (brief boost) — both
            pointerEvents="none", never intercept taps. */}
        <Animated.View
          pointerEvents="none"
          style={[styles.glowOverlay, { borderColor: tile.border, opacity: reduceMotion ? 0.25 : glowOpacity }]}
        />
        <Animated.View
          pointerEvents="none"
          style={[styles.glowOverlay, { borderColor: tile.border, opacity: pressGlow }]}
        />
        {/* Floating icon artwork (labels stay stable). */}
        <Animated.View style={{ transform: [{ translateY: reduceMotion ? 0 : floatY }] }}>
          <Image
            source={tile.icon}
            style={styles.tileIcon}
            resizeMode="contain"
            accessibilityLabel={`${tile.label} icon`}
          />
        </Animated.View>
        <Text style={styles.tileLabel} numberOfLines={2}>
          {tile.label}
        </Text>
        {value !== null ? (
          <Text style={[styles.tileValue, { color: tile.border }]} numberOfLines={1}>
            {value}
          </Text>
        ) : (
          <View style={styles.tileValueSpacer} />
        )}
      </Pressable>
    </Animated.View>
  );
});

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
  const opacity = p.interpolate({ inputRange: [0, 0.08, 0.85, 1], outputRange: [0, 0.6, 0.6, 0] });

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

// Hero fade: 10 stepped opacity Views (2px each) blending the hero's lower
// edge into the space background BELOW the title. Stepped (not a gradient
// library) to avoid adding a new dependency.
const HERO_FADE_STEPS = [0.05, 0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 0.95];

export default function HomeScreen() {
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const spin = useRef(new Animated.Value(0)).current;
  const bannerGlow = useRef(new Animated.Value(0)).current;
  const [progress, setProgress] = useState<Progress | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Reduced-motion: stop/reduce background + icon animation when the OS asks.
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  // Focus refresh + midnight refresh, both only while Home is focused.
  // - Focus refresh: reload progress whenever Home regains focus.
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
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 120000, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin, reduceMotion]);

  // Story Mode ambient border glow — subtle, slow, no flashing.
  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bannerGlow, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bannerGlow, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bannerGlow, reduceMotion]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const bannerGlowOpacity = bannerGlow.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.65] });

  // Hero geometry: FULL-WIDTH, 485 tall. The original file (1179x2549) is
  // shown at uniform scale (width W → full height W*2549/1179 = 843).
  // The container shows original y 182-1648 (10.6% top crop, measured):
  // image top offset = -(182 * W/1179) = -60. Faces + complete title
  // fully visible (title ends original y 1647, container y 485). Fade
  // (465-485) blends the title's lower edge into the banner below.
  const heroFullHeight = W * (2549 / 1179);
  const heroTopOffset = -(182 * (W / 1179));
  const HERO_HEIGHT = 485;
  const HERO_FADE_TOP = 465;

  // Story Mode banner geometry: full-width within margins (W-32), aspect
  // 1074:300 preserved (no distortion). Overlaps the hero's fade by 3px.
  const bannerWidth = W - 32;
  const bannerHeight = bannerWidth * (300 / 1074);
  const BANNER_OVERLAP = 3;

  // Live values, rendered in code (NOT baked into the icon artwork).
  const streakValue = progress ? `🔥 ${progress.streak} day${progress.streak === 1 ? '' : 's'}` : '—';
  const potValue = progress ? `🪙 ${dailyPot(progress).toLocaleString()}` : '—';

  const tileValue = useCallback(
    (t: Tile): string | null => {
      if (t.valueKind === 'streak') return streakValue;
      if (t.valueKind === 'pot') return potValue;
      return null;
    },
    [streakValue, potValue],
  );

  const tileAccessibilityLabel = useCallback(
    (t: Tile): string => {
      if (t.valueKind === 'streak') return `Streak, ${progress ? `${progress.streak} days` : 'loading'}`;
      if (t.valueKind === 'pot') return `Daily Pot, ${progress ? `${dailyPot(progress).toLocaleString()} fictional coins` : 'loading'}`;
      return t.label;
    },
    [progress],
  );

  const tilesWithValues = useMemo(
    () => TILES.map((t) => ({ ...t, value: tileValue(t), a11y: tileAccessibilityLabel(t) })),
    [tileValue, tileAccessibilityLabel],
  );

  return (
    <View style={styles.root}>
      {/* Space backdrop: stars + rotating Earth + meteors, behind everything. */}
      {STARS.map((s) => (
        <View
          key={s.id}
          pointerEvents="none"
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
      <Animated.View
        pointerEvents="none"
        style={[styles.earthWrap, { left: (W - 560) / 2, top: H - 420, transform: [{ rotate }] }]}
      >
        <Image source={EARTH} style={styles.earth} resizeMode="cover" />
      </Animated.View>
      {/* Earth darkening (15%): translucent overlay over the Earth only,
          so labels read better over it. The Earth file itself is unchanged. */}
      <View pointerEvents="none" style={[styles.earthDim, { left: (W - 560) / 2, top: H - 420 }]} />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: 0, paddingBottom: insets.bottom + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero artwork (original file, uniform scale, no distortion).
            Container shows original y 182-1710: faces + complete title.
            Fade below the title blends into the space background. */}
        <View
          style={[styles.heroWrap, { width: W, height: HERO_HEIGHT }]}
          accessibilityLabel="Beat the AI hero artwork"
        >
          <Image
            source={HERO}
            style={{ width: W, height: heroFullHeight, position: 'absolute', top: heroTopOffset, left: 0 }}
            resizeMode="cover"
            accessibilityLabel="Beat the AI hero artwork: yellow hero versus robot"
          />
          {HERO_FADE_STEPS.map((alpha, i) => (
            <View
              key={i}
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: HERO_FADE_TOP + i * 2,
                height: 2,
                backgroundColor: `rgba(5,6,15,${alpha})`,
              }}
            />
          ))}
        </View>

        {/* Story Mode banner. Artwork only in the PNG; ALL text is
            rendered in code. Feature remains DISABLED. Overlaps the
            hero's fade by 3px (no rectangular break). */}
        <Pressable
          disabled
          style={[styles.banner, { width: bannerWidth, height: bannerHeight, marginTop: -BANNER_OVERLAP }]}
          accessibilityRole="button"
          accessibilityState={{ disabled: true }}
          accessibilityLabel="Story Mode, coming soon. Earth is under attack. You're humanity's last hope."
        >
          <Image
            source={BANNER}
            style={{ width: bannerWidth, height: bannerHeight }}
            resizeMode="cover"
            accessibilityLabel="Story Mode banner artwork"
          />
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>STORY MODE</Text>
            <Text style={styles.bannerSub}>Earth is under attack.{'\n'}You&apos;re humanity&apos;s last hope.</Text>
            <View style={styles.comingSoonPill}>
              <Text style={styles.comingSoonText}>🔒 COMING SOON</Text>
            </View>
          </View>
          {/* Ambient border glow — subtle, slow, no flashing. */}
          <Animated.View
            pointerEvents="none"
            style={[styles.bannerGlow, { opacity: reduceMotion ? 0.35 : bannerGlowOpacity }]}
          />
        </Pressable>

        {/* Six illustrated icons, compact 3x2 grid, labels in code. */}
        <View style={styles.grid}>
          {[tilesWithValues.slice(0, 3), tilesWithValues.slice(3, 6)].map((row, ri) => (
            <View key={ri} style={styles.row}>
              {row.map((t, ci) => (
                <GameTile
                  key={t.key}
                  tile={t}
                  index={ri * 3 + ci}
                  value={t.value}
                  accessibilityLabel={t.a11y}
                  onPress={() => nav.navigate(t.route as never)}
                  reduceMotion={reduceMotion}
                />
              ))}
            </View>
          ))}
        </View>

      </ScrollView>

      {/* Meteors: rendered ABOVE the ScrollView content (pointerEvents="none")
          so streaks are visible over the opaque hero/banner/cards. Peak
          opacity 0.6 (translucent) so they never obscure faces, the logo,
          labels, or interactive elements. Taps pass through. */}
      {!reduceMotion &&
        METEORS.map((m, i) => (
          <Meteor key={i} delay={m.delay} duration={m.duration} topPct={m.topPct} drift={m.drift} />
        ))}

      {/* Settings gear: small, upper-right safe area, always accessible. */}
      <Pressable
        onPress={() => nav.navigate('Settings' as never)}
        style={[styles.gear, { top: insets.top + 8 }]}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Open Settings"
      >
        <Text style={styles.gearText}>⚙️</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#05060F' },
  earthWrap: {
    position: 'absolute',
    width: 560,
    height: 560,
    borderRadius: 280,
    overflow: 'hidden',
    opacity: 0.9,
  },
  earth: { width: 560, height: 560 },
  earthDim: {
    position: 'absolute',
    width: 560,
    height: 560,
    borderRadius: 280,
    backgroundColor: 'rgba(5,6,15,0.15)',
  },
  scroll: { paddingHorizontal: 16, gap: 0, alignItems: 'center' },
  heroWrap: {
    overflow: 'hidden',
    backgroundColor: '#05060F',
  },
  banner: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#22D3EE',
    backgroundColor: '#0A0E2A',
  },
  bannerText: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '62%',
    padding: 12,
    justifyContent: 'center',
    backgroundColor: 'rgba(5,6,15,0.45)',
  },
  bannerTitle: { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
  bannerSub: { color: '#C7D2FE', fontSize: 11.5, lineHeight: 15, marginTop: 3 },
  comingSoonPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#FACC15',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 8,
  },
  comingSoonText: { color: '#000', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  bannerGlow: {
    position: 'absolute',
    left: -1,
    right: -1,
    top: -1,
    bottom: -1,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#22D3EE',
  },
  grid: { width: '100%', gap: 8, marginTop: 0 },
  row: { flexDirection: 'row', gap: 8 },
  tile: {
    flex: 1,
    height: 116,
    borderWidth: 1.5,
    borderRadius: 18,
    backgroundColor: 'rgba(16,18,42,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  glowOverlay: {
    position: 'absolute',
    left: -2,
    right: -2,
    top: -2,
    bottom: -2,
    borderRadius: 20,
    borderWidth: 2,
  },
  tileIcon: { width: 60, height: 60 },
  tileLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 15,
    marginTop: 6,
  },
  tileValue: { fontSize: 11, fontWeight: '800', textAlign: 'center', marginTop: 2, height: 16 },
  tileValueSpacer: { height: 16, marginTop: 2 },
  gear: {
    position: 'absolute',
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#2A2E55',
    backgroundColor: 'rgba(16,18,42,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearText: { fontSize: 22 },
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
