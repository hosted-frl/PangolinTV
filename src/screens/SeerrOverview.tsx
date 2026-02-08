import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Linking } from 'react-native';
import { loadConfig } from '../api/pangolin';
import theme from '../theme';

export default function SeerrOverview({ onClose }: { onClose: () => void }) {
  const [cfg, setCfg] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      const c = await loadConfig();
      setCfg(c);
    })();
  }, []);

  if (!cfg) return (
    <View style={styles.container}><Text style={styles.text}>No Seerr configuration found.</Text>
      <Pressable onPress={onClose} style={styles.button}><Text style={styles.buttonText}>Close</Text></Pressable>
    </View>
  );

  const openSeerr = async () => {
    const url = cfg.seerrUrl?.replace(/\/$/, '') || '';
    if (!url) return;
    const toOpen = url;
    try { await Linking.openURL(toOpen); } catch (e) { /* ignore */ }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Seerr Overview</Text>
      <Text style={styles.label}>URL</Text>
      <Text style={styles.text}>{cfg.seerrUrl || '—'}</Text>
      <Text style={styles.label}>API Key</Text>
      <Text style={styles.text}>{cfg.seerrApiKey ? 'Configured' : 'Not configured'}</Text>

      <Pressable onPress={openSeerr} style={styles.button}><Text style={styles.buttonText}>Open Seerr</Text></Pressable>
      <Pressable onPress={onClose} style={[styles.button, { marginTop: 8 }]}><Text style={styles.buttonText}>Close</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 12 },
  label: { color: '#ddd', marginTop: 8 },
  text: { color: '#fff', marginTop: 4 },
  button: { marginTop: 18, paddingVertical: 12, paddingHorizontal: 16, backgroundColor: theme.primaryScale[30], borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff' },
});
