import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, NativeModules, Platform } from 'react-native';
import { saveConfig, loadConfig, Config } from '../api/pangolin';

export default function SetupScreen({ onDone }: { onDone: () => void }) {
  const [baseUrl, setBaseUrl] = useState('https://pangolin-api.hosted.frl/v1');
  const [apiKey, setApiKey] = useState('');
  const [name, setName] = useState('My TV');
  const [orgId, setOrgId] = useState('');

  useEffect(() => {
    (async () => {
      const cfg = await loadConfig();
      if (cfg) {
        setBaseUrl(cfg.baseUrl);
        setApiKey(cfg.apiKey);
        setName(cfg.name);
        setOrgId(cfg.orgId || '');
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (name && name !== 'My TV') return;
      const detect = async () => {
        try {
          const RNDeviceInfo = (NativeModules as any).RNDeviceInfo;
          if (RNDeviceInfo && typeof RNDeviceInfo.getDeviceName === 'function') {
            const devName = await RNDeviceInfo.getDeviceName();
            if (devName) return devName;
          }
        } catch (e) {}
        try {
          const pc = (NativeModules as any).PlatformConstants || (NativeModules as any).PlatformConstantsAndroid || (NativeModules as any).PlatformConstantsIOS;
          const model = pc && (pc.Model || pc.model || pc.Brand || pc.manufacturer || pc.DeviceName);
          if (model) return `${Platform.OS} ${model}`;
        } catch (e) {}
        return `${Platform.OS} device`;
      };
      const detected = await detect();
      if (detected) setName(detected);
    })();
  }, []);

  const save = async () => {
    if (!baseUrl || !apiKey || !name) return Alert.alert('Please fill all fields');
    const cfg: Config = { baseUrl, apiKey, name, orgId: orgId || undefined };
    await saveConfig(cfg);
    onDone();
  };

  // Organization must be entered manually for now.

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Pangolin API Base URL</Text>
      <TextInput style={styles.input} value={baseUrl} onChangeText={setBaseUrl} />

      <Text style={styles.label}>API Key</Text>
      <TextInput style={styles.input} value={apiKey} onChangeText={setApiKey} secureTextEntry />

      <Text style={styles.label}>Device Name</Text>
      <Text style={[styles.input, { paddingVertical: 10 }]}>{name}</Text>

      <Text style={styles.label}>Organization ID (optional)</Text>
      <TextInput style={styles.input} value={orgId} onChangeText={setOrgId} />

      <Pressable
        focusable={true}
        onPress={save}
        style={({ focused, pressed }) => [styles.saveButton, focused && styles.saveButtonFocused, pressed && styles.pressed]}
      >
        <Text style={styles.saveButtonText}>Save and Continue</Text>
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
