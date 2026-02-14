import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { loadConfig } from '../api/pangolin';
import theme from '../theme';
import { useNavigation } from '@react-navigation/core';
import seerr from '../api/seerr';
import FocusedItemDetail from '../components/FocusedItemDetail';
import DiscoverListSection from '../components/DiscoverListSection';

export default function SeerrOverview() {
  const navigation = useNavigation<any>();
    
  const [cfg, setCfg] = useState<any | null>(null);
  const [focusedMediaKey, setFocusedMediaKey] = useState<string | null>(null);
  const [allItems, setAllItems] = useState<Map<string, any[]>>(new Map());
  const screenW = Dimensions.get('window').width;
  const screenH = Dimensions.get('window').height;
  
  const scrollViewRef = React.useRef<any>(null);
  const [sectionHeights, setSectionHeights] = useState<Map<string, { y: number; height: number }>>(new Map());

  // Define list configuration
  const listConfigs = useMemo(
    () => [
      { id: 'trending', title: 'Trending', endpoint: 'trending' as const },
      { id: 'movies', title: 'Movies', endpoint: 'movies' as const },
      { id: 'tv', title: 'TV Shows', endpoint: 'tv' as const },
    ],
    []
  );

  // Track items from all sections to find focused item
  const handleSectionDataChange = useCallback(
    (sectionId: string, items: any[]) => {
      setAllItems(prev => new Map(prev).set(sectionId, items));
    },
    []
  );

  // Find the focused item from all aggregated items
  const focusedItem = useMemo(() => {
    if (!focusedMediaKey) return null;

    const [sectionId, itemIdRaw] = focusedMediaKey.split(':');
    const itemId = Number(itemIdRaw);
    if (Number.isNaN(itemId)) return null;

    const items = allItems.get(sectionId) || [];
    return items.find(it => it.id === itemId) || null;
  }, [focusedMediaKey, allItems]);

  useEffect(() => {
    (async () => {
      const c = await loadConfig();
      setCfg(c);
    })();
  }, []);

  const handleSectionLayout = useCallback(
    (sectionId: string, event: any) => {
      const { y, height } = event.nativeEvent.layout;
      setSectionHeights(prev => new Map(prev).set(sectionId, { y, height }));
    },
    []
  );

  // Scroll ScrollView to center the section containing focused item
  useEffect(() => {
    if (!focusedMediaKey || sectionHeights.size === 0) return;

    const [targetSectionId, itemIdRaw] = focusedMediaKey.split(':');
    const itemId = Number(itemIdRaw);
    if (!targetSectionId || Number.isNaN(itemId)) return;

    const items = allItems.get(targetSectionId) || [];
    if (!items.some((item: any) => item.id === itemId)) return;

    const sectionLayout = sectionHeights.get(targetSectionId);
    if (!sectionLayout) return;

    // Calculate offset to center section vertically (accounting for header)
    const centerOffset = sectionLayout.y - screenH / 2 + sectionLayout.height / 2 + 60; // 60 for header
    
    scrollViewRef.current?.scrollTo({
      y: Math.max(0, centerOffset),
      animated: true,
    });
  }, [focusedMediaKey, sectionHeights, allItems, screenH]);

  if (!cfg) return (
    <View style={styles.container}><Text style={styles.text}>No Seerr configuration found.</Text>
      <Pressable onPress={() => navigation.navigate('Resources')} style={styles.button}><Text style={styles.buttonText}>Close</Text></Pressable>
    </View>
  );

  const openSeerr = async () => {
    navigation.navigate('SeerrSetup');
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.fixedHeader}>
        <Text style={styles.title}>Seerr Overview</Text>
        <View style={styles.headerActions}>
          <Pressable focusable={true} onPress={openSeerr} style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}>
            <Text style={styles.actionButtonText}>Seerr</Text>
          </Pressable>
          <Pressable focusable={true} onPress={() => navigation.navigate('Resources')} style={({ pressed }) => [styles.actionButton, pressed && styles.pressed, { marginLeft: 8 }]}>
            <Text style={styles.actionButtonText}>Close</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.leftPanel}>
          <FocusedItemDetail item={focusedItem} baseUrl={cfg?.seerrUrl} />
        </View>

        <ScrollView ref={scrollViewRef} style={styles.rightPanel} contentContainerStyle={styles.scrollContent}>

      {listConfigs.map((config) => (
        <DiscoverListSection
          key={config.id}
          id={config.id}
          title={config.title}
          endpoint={config.endpoint}
          focusedMediaKey={focusedMediaKey}
          baseUrl={cfg?.seerrUrl}
          screenWidth={screenW}
          marginTop={config.marginTop}
          onFocus={(sectionId, itemId) => setFocusedMediaKey(`${sectionId}:${itemId}`)}
          onBlur={() => setFocusedMediaKey(null)}
          onLayout={handleSectionLayout}
          onDataChange={handleSectionDataChange}
        />
      ))}

      </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, overflow: 'hidden', backgroundColor: theme.primaryScale[0] },
  fixedHeader: { position: 'absolute', top: 20, right: 20, zIndex: 10, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  contentContainer: { flex: 1, flexDirection: 'row', marginTop: 60 },
  leftPanel: { width: '50%', height: '100%', overflow: 'visible' },
  rightPanel: { width: '50%', paddingHorizontal: 20 },
  scrollContent: { paddingBottom: 20, flexGrow: 1 },
  container: { padding: 20 },
  title: { fontSize: 18, fontWeight: '700', color: '#fff' },
  label: { color: theme.primaryScale[80], marginTop: 8 },
  text: { color: '#fff', marginTop: 4 },
  button: { marginTop: 18, paddingVertical: 12, paddingHorizontal: 16, backgroundColor: theme.primaryScale[30], borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff' },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  actionButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, backgroundColor: theme.primaryScale[10] },
  actionButtonText: { color: '#fff' },
  pressed: { opacity: 0.75 },
});
