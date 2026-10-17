import React, { useState } from 'react';
import { View, Text, Button } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export default function AgeGateScreen({ onPassed }: { onPassed: () => void }) {
  const [blocked, setBlocked] = useState(false);

  const confirmAge = async () => {
    await SecureStore.setItemAsync('ageGate13', 'true');
    onPassed();
  };

  // Under-13: no way forward. The player stays on this screen; closing the
  // app is the only exit. No account, data, or gameplay is unlocked.
  if (blocked) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', padding: 20 }}>
        <Text style={{ color: '#fff', marginBottom: 12, textAlign: 'center' }}>
          Sorry — you must be 13 or older to play Beat the AI.
        </Text>
        <Text style={{ color: '#888', textAlign: 'center' }}>You can close the app.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
      <Text style={{ color: '#fff', marginBottom: 20 }}>Are you 13 or older?</Text>
      <Button title="Yes" onPress={confirmAge} />
      <View style={{ height: 12 }} />
      <Button title="No" onPress={() => setBlocked(true)} />
    </View>
  );
}
