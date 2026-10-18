// src/screens/HomeScreen.tsx
// HOME SCREEN — Master Concept implementation (Atlas-approved, 2026-10-18).
// Atlas: Asset 001 Story Mode banner visually approved + locked; Assets
// 002–007 visually approved for integration testing. Implement on the
// isolated development branch only. STOP before merging.
//
// Layout (390x844 iPhone, safe areas via useSafeAreaInsets):
// - Hero artwork (original file, proportions intact): shown at a width
//   that lets the faces + complete "BEAT THE AI" title fit WITHOUT
//   cropping either. The image is scaled uniformly to heroWidth; the
//   container height = heroWidth * (1650/1179), so it shows original
//   y 0–1650 (faces + title) and hides only the non-essential floor
//   (y 1650–2549) below the container. NEVER crop faces or title.
// - Story Mode banner beneath the hero. Artwork only in the PNG;
//   "STORY MODE" + subtitle + "COMING SOON" lock pill are rendered
//   in code. Feature remains disabled (Pressable disabled, no onPress).
// - Six illustrated icons in a compact 3x2 grid, labels in code.
//   Streak + Daily Pot show LIVE values in code (NOT baked into art):
//   Streak -> "N days" (from progress.streak), Daily Pot -> "N fictional
//   coins" (from dailyPot(progress)). Streak taps to Missions; Daily Pot
//   taps to an Alert with the pot rules + fictional-coins disclaimer.
// - Earth (rotating), starfield, meteors stay BEHIND the interface,
//   all pointerEvents="none", never intercept touches.
// - Walking character REMOVED from Home per Atlas V2/V3/Master
//   directions. WalkingCharacter.tsx + frame PNGs are PRESERVED in
//   the repo for future Story Mode — NOT rendered here, NOT deleted.
// - Settings gear: small, upper-right, 44x44 + hitSlop (effective 60).
// - Navigation / game logic / progress / fictional-coin balances are
//   unchanged: Daily, PuzzleArena, Missions, Multiplayer routes; pot
//   + streak + midnight rollover via progress.ts (unchanged).
// - Reduced motion: if AccessibilityInfo reports reduce-motion, Earth
//   renders static (no spin loop) and meteors are hidden.
// - No new dependencies. No Stage 3 gameplay. No baseline merge.
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  Alert,
  ImageSourcePropType,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { loadProgress, todayKey, Progress, dailyPot } from '../data/progress';
import { POT_RULES } from '../components/FeaturedDashboard';

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
  route?: string;
  action?: 'potInfo';
  valueKind?: 'streak' | 'pot';
};

const TILES: Tile[] = [
  { key: 'daily', label: 'Daily Challenge', icon: ICON_DAILY, border: '#22D3EE', route: 'Daily' },
  { key: 'puzzle', label: 'Puzzle Arena', icon: ICON_PUZZLE, border: '#C084FC', route: 'PuzzleArena' },
  { key: 'missions', label: 'Missions', icon: ICON_MISSIONS, border: '#34D399', route: 'Missions' },
  { key: 'multiplayer', label: 'Multiplayer', icon: ICON_MULTIPLAYER, border: '#60A5FA', route: 'Multiplayer' },
  { key: 'streak', label: 'Streak', icon: ICON_STREAK, border: '#FB923C', route: 'Missions', valueKind: 'streak' },
  { key: 'pot', label: 'Daily Pot', icon: ICON_POT, border: '#FACC15', action: 'potInfo', valueKind: 'pot' },
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
  const insets = useSafeAreaInsets();
  const spin = useRef(new Animated.Value(0)).current;
  const [progress, setProgress] = useState<Progress | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Reduced-motion: stop/reduce background animation when the OS asks.
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

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  // Hero geometry: uniform scale, faces + title visible, floor hidden.
  // Width chosen so hero + banner + grid + disclaimer fit the 390x844
  // first screen with no scrolling needed to discover the modes, and
  // the disclaimer ends above the home indicator.
  const heroWidth = Math.min(W * 0.58, 225);
  const heroHeight = heroWidth * (1650 / 1179);
  const heroFullHeight = heroWidth * (2549 / 1179);

  // Story Mode banner geometry: artwork aspect 1074:300 preserved.
  const bannerWidth = W - 48;
  const bannerHeight = bannerWidth * (300 / 1074);

  // Live values, rendered in code (NOT baked into the icon artwork).
  const streakValue = progress ? `🔥 ${progress.streak} day${progress.streak === 1 ? '' : 's'}` : '—';
  const potValue = progress ? `🪙 ${dailyPot(progress).toLocaleString()}` : '—';

  const tileValue = (t: Tile): string | null => {
    if (t.valueKind === 'streak') return streakValue;
    if (t.valueKind === 'pot') return potValue;
    return null;
  };

  const onTilePress = (t: Tile) => {
    if (t.action === 'potInfo') {
      Alert.alert('Daily Pot', POT_RULES);
      return;
    }
    if (t.route) nav.navigate(t.route as never);
  };

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
      {!reduceMotion &&
        METEORS.map((m, i) => (
          <Meteor key={i} delay={m.delay} duration={m.duration} topPct={m.topPct} drift={m.drift} />
        ))}

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero artwork (original file, proportions intact). Container
            shows faces + complete title; only the floor is hidden. */}
        <View
          style={[styles.heroWrap, { width: heroWidth, height: heroHeight }]}
          accessibilityLabel="Beat the AI hero artwork"
        >
          <Image
            source={HERO}
            style={{ width: heroWidth, height: heroFullHeight }}
            resizeMode="cover"
            accessibilityLabel="Beat the AI hero artwork: yellow hero versus robot"
          />
        </View>

        {/* Story Mode banner. Artwork only in the PNG; ALL text is
            rendered in code. Feature remains DISABLED. */}
        <Pressable
          disabled
          style={[styles.banner, { width: bannerWidth, height: bannerHeight }]}
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
        </Pressable>

        {/* Six illustrated icons, compact 3x2 grid, labels in code. */}
        <View style={styles.grid}>
          {[TILES.slice(0, 3), TILES.slice(3, 6)].map((row, ri) => (
            <View key={ri} style={styles.row}>
              {row.map((t) => {
                const value = tileValue(t);
                return (
                  <Pressable
                    key={t.key}
                    onPress={() => onTilePress(t)}
                    style={[styles.tile, { borderColor: t.border }]}
                    accessibilityRole="button"
                    accessibilityLabel={
                      t.valueKind === 'streak'
                        ? `Streak, ${progress ? `${progress.streak} days` : 'loading'}`
                        : t.valueKind === 'pot'
                          ? `Daily Pot, ${progress ? `${dailyPot(progress).toLocaleString()} fictional coins` : 'loading'}. Shows pot rules.`
                          : t.label
                    }
                  >
                    <Image
                      source={t.icon}
                      style={styles.tileIcon}
                      resizeMode="contain"
                      accessibilityLabel={`${t.label} icon`}
                    />
                    <Text style={styles.tileLabel} numberOfLines={2}>
                      {t.label}
                    </Text>
                    {value !== null ? (
                      <Text style={[styles.tileValue, { color: t.border }]} numberOfLines={1}>
                        {value}
                      </Text>
                    ) : (
                      <View style={styles.tileValueSpacer} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        {/* Fictional-coins disclaimer, always visible on Home. Dark pill
            keeps it readable over the bright Earth behind the list. */}
        <View style={styles.disclaimerWrap}>
          <Text style={styles.disclaimer}>
            Fictional coins only. For in-game use only. No cash value. No real-money gambling.
          </Text>
        </View>
      </ScrollView>

      {/* Settings gear: small, upper-right, always accessible. */}
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
  scroll: { paddingHorizontal: 16, gap: 12, alignItems: 'center' },
  heroWrap: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#2A2E55',
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
  grid: { width: '100%', gap: 10 },
  row: { flexDirection: 'row', gap: 10 },
  tile: {
    flex: 1,
    height: 140,
    borderWidth: 1.5,
    borderRadius: 18,
    backgroundColor: 'rgba(16,18,42,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  tileIcon: { width: 72, height: 72 },
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
  disclaimerWrap: {
    backgroundColor: 'rgba(5,6,15,0.7)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 4,
  },
  disclaimer: { color: '#9AA0B5', fontSize: 11, lineHeight: 15, textAlign: 'center' },
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
