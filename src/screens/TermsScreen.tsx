import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

// DRAFT legal text — Kennedy must review before submission. Must match the
// in-app behavior (no purchases, no ads, no virtual currency) and the web
// terms at docs/terms.html. Effective date + contact email are filled in
// at submission time.

const TERMS_TEXT = `Effective: [Launch Date — fill in at submission]

1. License. You are granted a limited, non-exclusive, non-transferable license to use Beat the AI ("the Game") for personal entertainment only. All rights remain with the developer.

2. Age. You must be 13 or older to play. An age gate appears on first launch.

3. Fair play. Play fairly. Do not attempt to cheat, exploit, or disrupt the Game.

4. No purchases. This version of the Game has no in-app purchases, no ads, and no virtual currency.

5. As-is. The Game is provided "as is," without warranties of any kind.

6. Liability. To the fullest extent permitted by law, the developer is not liable for any damages arising from your use of the Game.

7. Changes. These Terms may change with future updates. Continued use after an update means you accept the updated Terms.

Contact: [Support email — Kennedy to provide]`;

export default function TermsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Terms of Service</Text>
      <Text style={styles.body}>{TERMS_TEXT}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  body: { fontSize: 16, lineHeight: 22 },
});
