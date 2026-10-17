import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function TosScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Terms of Service</Text>
      <Text style={styles.body}>
        Here’s where your Terms of Service text will go...
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  body: { fontSize: 16, lineHeight: 22 },
});
