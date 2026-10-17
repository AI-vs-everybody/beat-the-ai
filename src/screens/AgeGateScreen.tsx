import React from 'react';
import { View, Text, Button } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export default function AgeGateScreen({ onPassed }: { onPassed: () => void }) {
  const confirmAge = async () => {
    await SecureStore.setItemAsync('ageGate13', 'true');
    onPassed();
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
      <Text style={{ color: '#fff', marginBottom: 20 }}>Are you 13 or older?</Text>
      <Button title="Yes" onPress={confirmAge} />
    </View>
  );
}
