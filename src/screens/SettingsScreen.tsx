// src/screens/SettingsScreen.tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function SettingsScreen() {
  const nav = useNavigation();

  return (
    <View style={{ flex: 1, backgroundColor: '#000', padding: 20, justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontSize: 24, fontWeight: '900', marginBottom: 16 }}>
        Settings
      </Text>

      <View style={{ gap: 12 }}>
        <Pressable onPress={() => nav.navigate('Privacy' as never)}>
          <Text style={{ color: '#0ff', textDecorationLine: 'underline' }}>Privacy Policy</Text>
        </Pressable>
        <Pressable onPress={() => nav.navigate('Terms' as never)}>
          <Text style={{ color: '#0ff', textDecorationLine: 'underline' }}>Terms of Service</Text>
        </Pressable>
      </View>
    </View>
  );
}
