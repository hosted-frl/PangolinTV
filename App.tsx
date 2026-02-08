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
import SeerrSetupScreen from './src/screens/SeerrSetupScreen';
import SeerrOverview from './src/screens/SeerrOverview';
import CustomAlert from './src/components/CustomAlert';
import { loadConfig } from './src/api/pangolin';
import theme from './src/theme';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <CustomAlert />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const navigationRef = createNavigationContainerRef();
  const Stack = createNativeStackNavigator();

  useEffect(() => {
    (async () => {
      const cfg = await loadConfig();
      setConfigured(!!cfg);
    })();
  }, []);

  if (configured === null) return <View style={styles.container} />;

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar />
      {configured ? (
        <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.primaryScale[10] } }}>
          <Stack.Screen name="Resources">
            {() => (
              <ResourcesScreen
                onReset={() => setConfigured(false)}
                onOpenSeerr={async () => {
                  const cfg = await loadConfig();
                  if (!cfg || !cfg.seerrUrl || !cfg.seerrApiKey) navigationRef.current?.navigate('SeerrSetup');
                  else navigationRef.current?.navigate('SeerrOverview');
                }}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="SeerrSetup" component={SeerrSetupScreen} />
          <Stack.Screen name="SeerrOverview" component={SeerrOverview} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.primaryScale[10] } }}>
          <Stack.Screen name="Setup">
            {() => <SetupScreen onDone={() => setConfigured(true)} />}
          </Stack.Screen>
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.primaryScale[10],
    padding: 12,
  },
});

export default App;
