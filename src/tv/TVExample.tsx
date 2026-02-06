import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useTVEventHandler } from 'react-native';

export default function TVExample() {
  const _tvEventHandler = (evt: any) => {
    // evt.eventType: "right", "left", "up", "down", "select", etc.
    console.log('TV event:', evt);
  };

  useTVEventHandler(_tvEventHandler);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>TV Example — D‑pad navigation</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.8}
          hasTVPreferredFocus={true}
          focusable={true}
        >
          <Text style={styles.buttonText}>Play</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.8}
          focusable={true}
        >
          <Text style={styles.buttonText}>Details</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.8}
          focusable={true}
        >
          <Text style={styles.buttonText}>More</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
  title: { color: '#fff', fontSize: 20, marginBottom: 20 },
  row: { flexDirection: 'row' },
  button: {
    width: 160,
    height: 80,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginHorizontal: 8,
  },
  buttonText: { color: '#fff', fontSize: 18 },
});
