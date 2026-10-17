// App.tsx (root)
import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import TermsScreen from './src/screens/TermsScreen';
import PrivacyScreen from './src/screens/PrivacyScreen';
import AgeGateScreen from './src/screens/AgeGateScreen';
import DailyChallengeScreen from './src/screens/DailyChallengeScreen';
import PatternGauntletScreen from './src/screens/PatternGauntletScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import MissionsScreen from './src/screens/MissionsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [gated, setGated] = useState<boolean | null>(null);

  // Read age-gate once on boot
  useEffect(() => {
    (async () => {
      try {
        const v = await SecureStore.getItemAsync('ageGate13');
        setGated(v === 'true');
      } catch {
        setGated(false);
      }
    })();
  }, []);

  // Loading state
  if (gated === null) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#fff' }}>Loading…</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {/* Headers ON by default; we’ll disable on Home & Age only */}
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: '#000' },
          headerTitleStyle: { color: '#0ff', fontWeight: '800' },
          headerTintColor: '#0ff',
        }}
      >
        {gated ? (
          <>
            {/* Home (Hub) — header hidden */}
            <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />

            <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
            <Stack.Screen name="Privacy" component={PrivacyScreen} options={{ title: 'Privacy Policy' }} />
            <Stack.Screen name="Terms" component={TermsScreen} options={{ title: 'Terms of Service' }} />
            <Stack.Screen name="Missions" component={MissionsScreen} options={{ title: 'Missions' }} />

            {/* Daily with Exit in header */}
            <Stack.Screen
              name="Daily"
              component={DailyChallengeScreen}
              options={({ navigation }) => ({
                title: 'Daily Challenge',
                headerRight: () => (
                  <Text
                    onPress={() =>
                      Alert.alert('Exit Daily?', 'Your progress will be lost.', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Exit', style: 'destructive', onPress: () => navigation.navigate('Home' as never) },
                      ])
                    }
                    style={{ color: '#0ff', fontWeight: '800', paddingHorizontal: 12 }}
                  >
                    Exit
                  </Text>
                ),
              })}
            />


            {/* Pattern with Exit in header */}
            <Stack.Screen
              name="Pattern"
              component={PatternGauntletScreen}
              options={({ navigation }) => ({
                title: 'Pattern Gauntlet',
                headerRight: () => (
                  <Text
                    onPress={() =>
                      Alert.alert('Exit Pattern?', 'Your progress will be lost.', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Exit', style: 'destructive', onPress: () => navigation.navigate('Home' as never) },
                      ])
                    }
                    style={{ color: '#0ff', fontWeight: '800', paddingHorizontal: 12 }}
                  >
                    Exit
                  </Text>
                ),
              })}
            />

            {/* Leaderboard with Exit in header */}
            <Stack.Screen
              name="Leaderboard"
              component={LeaderboardScreen}
              options={({ navigation }) => ({
                title: 'Leaderboard',
                headerRight: () => (
                  <Text
                    onPress={() => navigation.navigate('Home' as never)}
                    style={{ color: '#0ff', fontWeight: '800', paddingHorizontal: 12 }}
                  >
                    Exit
                  </Text>
                ),
              })}
            />
          </>
        ) : (
          // Hide header on Age Gate
          <Stack.Screen name="Age" options={{ headerShown: false }}>
            {() => (
              <AgeGateScreen
                onPassed={async () => {
                  await SecureStore.setItemAsync('ageGate13', 'true');
                  setGated(true);
                }}
              />
            )}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
