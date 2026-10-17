// screens/HomeScreen.tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const nav = useNavigation();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <Text
        style={{
          color: '#0ff',
          fontSize: 24,
          fontWeight: '900',
          textAlign: 'center',
          marginBottom: 16,
        }}
      >
        Welcome, human. Try not to embarrass yourself. [HUB v1]
      </Text>

      <Pressable onPress={() => nav.navigate('Daily' as never)} style={{ marginTop: 12 }}>
        <Text style={{ color: '#0ff', textDecorationLine: 'underline' }}>Daily Challenge</Text>
      </Pressable>

      <Pressable onPress={() => nav.navigate('Pattern' as never)} style={{ marginTop: 12 }}>
        <Text style={{ color: '#0ff', textDecorationLine: 'underline' }}>Pattern Gauntlet</Text>
      </Pressable>

      <Pressable onPress={() => nav.navigate('Leaderboard' as never)} style={{ marginTop: 12 }}>
        <Text style={{ color: '#0ff', textDecorationLine: 'underline' }}>Leaderboard</Text>
      </Pressable>

      <Pressable onPress={() => nav.navigate('Settings' as never)} style={{ marginTop: 12 }}>
        <Text style={{ color: '#0ff', textDecorationLine: 'underline' }}>Settings</Text>
      </Pressable>
    </View>
  );
}
