import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import safeAlert from '../utils/safeAlert';
import { loadConfig, saveConfig, Config } from '../api/pangolin';

export default function SeerrSetupScreen({ onDone }: { onDone: () => void }) {
  const [seerrUrl, setSeerrUrl] = useState('');
  const [seerrApiKey, setSeerrApiKey] = useState('');

  useEffect(() => {
    (async () => {
      const cfg = await loadConfig();
      if (cfg) {
        setSeerrUrl(cfg.seerrUrl || '');
        setSeerrApiKey(cfg.seerrApiKey || '');
      }
    })();
  }, []);

  const save = async () => {
    if (!seerrUrl || !seerrApiKey) return safeAlert('Please fill Seerr URL and API key');
    const cfg = (await loadConfig()) || ({ baseUrl: '', apiKey: '', orgId: undefined } as Config);
    const newCfg: Config = { ...cfg, seerrUrl, seerrApiKey } as any;
    await saveConfig(newCfg);
    onDone();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Seerr URL</Text>
      <TextInput style={styles.input} value={seerrUrl} onChangeText={setSeerrUrl} placeholder='http://seerr.local:5055' />

      <Text style={styles.label}>Seerr API Key</Text>
      <TextInput style={styles.input} value={seerrApiKey} onChangeText={setSeerrApiKey} secureTextEntry />

      <Pressable
        focusable={true}
        onPress={save}
        style={({ focused, pressed }) => [styles.saveButton, focused && styles.saveButtonFocused, pressed && styles.pressed]}
      >
        <Text style={styles.saveButtonText}>Save Seerr Settings</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  label: { marginTop: 12, color: '#fff' },
  input: { backgroundColor: '#222', color: '#fff', padding: 8, borderRadius: 6, marginTop: 6 },
  saveButton: { marginTop: 18, paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#222', borderRadius: 8, alignItems: 'center' },
  saveButtonFocused: { borderWidth: 2, borderColor: '#FFD54F' },
  saveButtonText: { color: '#fff' },
  pressed: { opacity: 0.75 },
});
