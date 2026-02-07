import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, FlatList, Pressable, StyleSheet, Alert, Animated, Image, useWindowDimensions } from 'react-native';
import ResourceCard from '../components/ResourceCard';
import { Easing } from 'react-native';
import { loadConfig, listPublicResources, fetchPublicIp, addClientToResource } from '../api/pangolin';
import { Resource } from '../types/pangolin';
import Icon from '../components/Icon';
import theme from '../theme';

export default function ResourcesScreen({ onReset }: { onReset: () => void }) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [focusedId, setFocusedId] = useState<number | null>(null);
  const [healthMap, setHealthMap] = useState<Record<string, { up: boolean; latency?: number; info?: string; favicon?: string }>>({});
  const [refreshing, setRefreshing] = useState(false);
  const scales = React.useRef(new Map<number, Animated.Value>());
  const settingsScale = React.useRef(new Animated.Value(1));
  const refreshScale = React.useRef(new Animated.Value(1));
  const rotateAnim = React.useRef(new Animated.Value(0));
  const rotateLoop = React.useRef<Animated.CompositeAnimation | null>(null);

  const getScale = (id: number) => {
    let v = scales.current.get(id);
    if (!v) {
      v = new Animated.Value(1);
      scales.current.set(id, v);
    }
    return v as Animated.Value;
  };

  const { width } = useWindowDimensions();
  const getNumColumns = () => {
    if (width <= 420) return 2; // small phones
    if (width <= 800) return 3; // larger phones / small tablets
    if (width <= 1100) return 4; // tablets
    return 5; // TV / large screens
  };
  const numColumns = getNumColumns();

  const resourceKey = (r: Partial<Resource> | { resourceId?: any; niceId?: any }) => String(r.resourceId ?? r.niceId ?? '');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const cfg = await loadConfig();
      if (!cfg) {
        setLoading(false);
        return;
      }
      try {
        const list = await listPublicResources(cfg);
        const items = Array.isArray(list) ? list : list.items || [];
        setResources(items);
        // set initial focus to first item
        if (items.length > 0) setFocusedId(items[0].resourceId ?? null);
        // kick off health checks
        setTimeout(() => {
          items.forEach(checkResourceHealth);
        }, 120);
      } catch (e: any) {
        Alert.alert('Error', e.message || 'Failed to load resources');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const refreshHealth = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await Promise.all(resources.map((r) => checkResourceHealth(r)));
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (refreshing) {
      rotateAnim.current.setValue(0);
      rotateLoop.current = Animated.loop(
        Animated.timing(rotateAnim.current, {
          toValue: 1,
          duration: 900,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      rotateLoop.current.start();
    } else {
      if (rotateLoop.current) {
        rotateLoop.current.stop();
        rotateLoop.current = null;
      }
      rotateAnim.current.setValue(0);
    }
    return () => {
      if (rotateLoop.current) rotateLoop.current.stop();
    };
  }, [refreshing]);

  const checkResourceHealth = async (r: Resource) => {
    const id = resourceKey(r);
    // prefer target healthStatus if available
    if (r.targets && r.targets.length > 0) {
      const t = r.targets[0];
      console.warn('checking health for target', t.ip, 'status', t.healthStatus, r);
      if (t.healthStatus) {
        setHealthMap((m) => ({ ...m, [id]: { up: t.healthStatus === 'healthy', info: t.healthStatus } }));
      }
    }
    // try an HTTP probe if resource looks HTTP
    const scheme = r.ssl || r.protocol === 'http' ? 'https' : 'http';
    let host = r.fullDomain || '';
    if (!host && r.targets && r.targets.length > 0) {
      const t = r.targets[0];
      host = `${t.ip}${t.port ? `:${t.port}` : ''}`;
    }
    if (!host) return;
    // normalize
    host = host.replace(/https?:\/\//, '').replace(/\/$/, '');
    const url = `${scheme}://${host}/`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const start = Date.now();
    try {
      const res = await fetch(url, { method: 'GET', signal: controller.signal });
      const latency = Date.now() - start;
      clearTimeout(timeout);
      // try fetch favicon (separate timeout)
      const faviconUrl = `${scheme}://${host.replace(/\/$/, '')}/favicon.ico`;
      const favController = new AbortController();
      const favTimeout = setTimeout(() => favController.abort(), 2000);
        try {
          const favRes = await fetch(faviconUrl, { method: 'GET', signal: favController.signal });
          clearTimeout(favTimeout);
          if (favRes.ok) {
            setHealthMap((m) => ({ ...m, [id]: { up: res.ok, latency, favicon: faviconUrl } }));
          } else {
            setHealthMap((m) => ({ ...m, [id]: { up: res.ok, latency } }));
          }
        } catch (favErr: any) {
          clearTimeout(favTimeout);
          console.debug('favicon fetch failed', faviconUrl, favErr?.message);
          setHealthMap((m) => ({ ...m, [id]: { up: res.ok, latency } }));
        }
    } catch (err: any) {
      clearTimeout(timeout);
      console.debug('health probe failed for', url, err?.message);
      setHealthMap((m) => ({ ...m, [id]: { up: false, info: err?.message } }));
    }
  };

  const onSelect = async (item: any) => {
    const cfg = await loadConfig();
    if (!cfg) return;
    try {
      const ip = await fetchPublicIp();
      await addClientToResource(cfg, String(item.resourceId), ip);
      Alert.alert('Success', `Added ${ip} to whitelist for ${item.name || item.niceId || item.resourceId}`);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to add to whitelist');
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeAreaTop}>
        <View style={styles.header}>
          <Text style={styles.title}>Public Resources</Text>
          <View style={styles.headerActions}>
          <Pressable
            focusable={true}
            onFocus={() => Animated.timing(refreshScale.current, { toValue: 1.06, duration: 120, useNativeDriver: true }).start()}
            onBlur={() => Animated.timing(refreshScale.current, { toValue: 1, duration: 120, useNativeDriver: true }).start()}
            onPress={refreshHealth}
            style={({ pressed }) => [styles.actionButton, pressed && styles.pressed, refreshing && styles.actionButtonDisabled]}
          >
            {(() => {
              const rotate = rotateAnim.current.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
              return (
                <Animated.View style={{ transform: [{ scale: refreshScale.current }, { rotate }] }}>
                  <Icon
                    name={'refresh'}
                    size={16}
                    color={theme.tertiaryScale[50]}
                    style={styles.actionButtonIcon}
                    accessible={true}
                    accessibilityRole="link"
                    accessibilityLabel={'Refresh'}
                  />
                </Animated.View>
              );
            })()}
          </Pressable>
          <Pressable
            focusable={true}
            onFocus={() => Animated.timing(settingsScale.current, { toValue: 1.06, duration: 120, useNativeDriver: true }).start()}
            onBlur={() => Animated.timing(settingsScale.current, { toValue: 1, duration: 120, useNativeDriver: true }).start()}
            onPress={onReset}
            style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
          >
            <Animated.View style={{ transform: [{ scale: settingsScale.current }] }}>
              <Icon
                name={'settings'}
                size={16}
                color={theme.tertiaryScale[50]}
                style={styles.actionButtonIcon}
                accessible={true}
                accessibilityRole="link"
                accessibilityLabel={'Settings'}
              />
            </Animated.View>
          </Pressable>
          </View>
        </View>
      </SafeAreaView>
      {loading ? (
        <Text style={styles.info}>Loading…</Text>
      ) : (
        <FlatList
          data={resources}
          keyExtractor={(it) => String(it.resourceId ?? it.niceId ?? Math.random())}
          numColumns={numColumns}
          columnWrapperStyle={styles.columnWrapper}
          renderItem={({ item, index }) => {
            const focused = focusedId === item.resourceId;
            const key = String(item.resourceId ?? item.niceId ?? '');
            const s = healthMap[key];
            const targetStatus = item.targets && item.targets.length > 0 ? item.targets[0].healthStatus : undefined;
            const up = s ? s.up : targetStatus ? targetStatus === 'healthy' : undefined;
            return (
              <ResourceCard
                item={item}
                index={index}
                focused={focused}
                getScale={getScale}
                onSelect={onSelect}
                setFocusedId={setFocusedId}
                s={s}
                targetStatus={targetStatus}
                up={up}
                columns={numColumns}
              />
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  safeAreaTop: { backgroundColor: 'transparent', paddingTop: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', color: '#FFF' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  info: { marginTop: 20 },
  columnWrapper: { justifyContent: 'flex-start', marginTop: 12 },
  actionButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, backgroundColor: '#222' },
  actionButtonDisabled: { opacity: 0.6 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  actionButtonFocused: { borderWidth: 2, borderColor: '#FFD54F' },
  actionButtonText: { color: '#fff' },
  actionButtonIcon: { marginRight: 6, fontSize: 14, color: theme.tertiaryScale[50] },
});
