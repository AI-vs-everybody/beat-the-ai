import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

// DRAFT legal text — Kennedy must review before submission. Must match the
// App Store privacy label ("Data Not Collected") and the web policy at
// docs/privacy-policy.html. Effective date + contact email are filled in
// at submission time.

const PRIVACY_TEXT = `Effective: [Launch Date — fill in at submission]

Beat the AI ("the Game") does not collect, transmit, sell, or share any personal data. There is no account, no sign-in, and nothing that identifies you.

What stays on your device (and never leaves it):
• Game statistics: wins and losses vs. the AI, best streak, daily challenge completion, and per-mode stats. Stored in on-device storage.
• Age-gate flag: whether you confirmed you are 13 or older. Stored in secure on-device storage.

What we do NOT do:
• No name, email, phone number, contacts, photos, or location.
• No analytics, no advertising, no trackers, and no third-party data-collection SDKs.
• No network calls. The Game works fully offline.
• No ads and no in-app purchases in this version.

Children: The Game is for players 13 and older. An age gate appears on first launch.

Changes: If this policy ever changes, the updated policy will ship with the app update.

Contact: [Support email — Kennedy to provide]`;

export default function PrivacyScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Privacy Policy</Text>
      <Text style={styles.body}>{PRIVACY_TEXT}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  body: { fontSize: 16, lineHeight: 22 },
});
