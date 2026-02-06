/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SetupScreen from './src/screens/SetupScreen';
import ResourcesScreen from './src/screens/ResourcesScreen';
import { loadConfig } from './src/api/pangolin';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const [configured, setConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const cfg = await loadConfig();
      setConfigured(!!cfg);
    })();
  }, []);

  if (configured === null) return <View style={styles.container} />;

  return (
    <View style={styles.container}>
      {configured ? (
        <ResourcesScreen onReset={() => setConfigured(false)} />
      ) : (
        <SetupScreen onDone={() => setConfigured(true)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#071022',
    padding: 12,
  },
});

export default App;
