import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

export default function TermsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Terms of Service</Text>
      <Text style={styles.body}>
        {/* Replace with your real TOS text */}
        These are the sample Terms of Service. By using this app, you agree to follow all rules...
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  body: { fontSize: 16, lineHeight: 22 },
});
