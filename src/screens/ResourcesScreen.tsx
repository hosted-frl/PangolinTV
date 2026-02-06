import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Alert, Animated, Image } from 'react-native';
import { loadConfig, listPublicResources, fetchPublicIp, addClientToResource } from '../api/pangolin';
import { Resource } from '../types/pangolin';

export default function ResourcesScreen({ onReset }: { onReset: () => void }) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [focusedId, setFocusedId] = useState<number | null>(null);
  const [healthMap, setHealthMap] = useState<Record<string, { up: boolean; latency?: number; info?: string; favicon?: string }>>({});
  const [refreshing, setRefreshing] = useState(false);
  const scales = React.useRef(new Map<number, Animated.Value>());
  const settingsScale = React.useRef(new Animated.Value(1));
  const refreshScale = React.useRef(new Animated.Value(1));

  const getScale = (id: number) => {
    let v = scales.current.get(id);
    if (!v) {
      v = new Animated.Value(1);
      scales.current.set(id, v);
    }
    return v as Animated.Value;
  };

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

  const checkResourceHealth = async (r: Resource) => {
    const id = resourceKey(r);
    // prefer target healthStatus if available
    if (r.targets && r.targets.length > 0) {
      const t = r.targets[0];
      if (t.healthStatus) {
        setHealthMap((m) => ({ ...m, [id]: { up: t.healthStatus === 'healthy', info: t.healthStatus } }));
        return;
      }
    }
    // try an HTTP probe if resource looks HTTP
    const scheme = r.ssl || r.protocol === 'http' ? 'https' : 'http';
    let host = r.fullDomain || '';
    if (!host && r.targets && r.targets.length > 0) {
      const t = r.targets[0];
      host = `${t.ip}${t.port ? `:${t.port}` : ''}`;
    }
    Alert.alert('Debug', `Checking health for ${r.name} at ${host}`);

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
            <Animated.View style={{ transform: [{ scale: refreshScale.current }] }}>
              <Text style={styles.actionButtonText}>{refreshing ? 'Refreshing…' : 'Refresh'}</Text>
            </Animated.View>
          </Pressable>
          <Pressable
            focusable={true}
            onFocus={() => Animated.timing(settingsScale.current, { toValue: 1.06, duration: 120, useNativeDriver: true }).start()}
            onBlur={() => Animated.timing(settingsScale.current, { toValue: 1, duration: 120, useNativeDriver: true }).start()}
            onPress={onReset}
            style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
          >
            <Animated.View style={{ transform: [{ scale: settingsScale.current }] }}>
              <Text style={styles.actionButtonText}>Change Settings</Text>
            </Animated.View>
          </Pressable>
        </View>
      </View>
      {loading ? (
        <Text style={styles.info}>Loading…</Text>
      ) : (
        <FlatList
          data={resources}
          keyExtractor={(it) => String(it.resourceId ?? it.niceId ?? Math.random())}
          numColumns={5}
          columnWrapperStyle={styles.columnWrapper}
          renderItem={({ item, index }) => {
            const focused = focusedId === item.resourceId;
            return (
              <View style={styles.gridCell}>
                <Pressable
                  focusable={true}
                  hasTVPreferredFocus={index === 0}
                  onFocus={() => {
                    setFocusedId(item.resourceId);
                    Animated.timing(getScale(item.resourceId), { toValue: 1.06, duration: 120, useNativeDriver: true }).start();
                  }}
                  onBlur={() => {
                    setFocusedId((id) => (id === item.resourceId ? null : id));
                    Animated.timing(getScale(item.resourceId), { toValue: 1, duration: 120, useNativeDriver: true }).start();
                  }}
                  onPress={() => onSelect(item)}
                  style={({ pressed }) => [styles.pressableWrap, pressed && styles.pressed]}
                >
                  <Animated.View style={[styles.gridItem, focused ? styles.itemFocused : null, { transform: [{ scale: getScale(item.resourceId) }] }]}>
                    {(() => {
                      const key = String(item.resourceId ?? item.niceId ?? '');
                      const s = healthMap[key];
                      const targetStatus = item.targets && item.targets.length > 0 ? item.targets[0].healthStatus : undefined;
                      const up = s ? s.up : targetStatus ? targetStatus === 'healthy' : undefined;
                      return (
                        <>
                          <View style={styles.statusOverlay} pointerEvents="none">
                            <View style={[styles.statusDot, up ? styles.statusUp : styles.statusDown]} />
                            <Text style={styles.statusText}>{s ? (s.up ? `${s.latency ?? '–'}ms` : 'Down') : targetStatus ? targetStatus : 'Unknown'}</Text>
                          </View>
                          {s?.favicon ? (
                            <Image source={{ uri: s.favicon }} style={styles.favicon} />
                          ) : null}
                        </>
                      );
                    })()}
                    <Text style={styles.itemTitle} numberOfLines={2}>{item.name || item.niceId || item.resourceId}</Text>
                    <Text style={styles.itemSub} numberOfLines={1}>{item.fullDomain || ''}</Text>
                  </Animated.View>
                </Pressable>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', color: '#FFF' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  info: { marginTop: 20 },
  columnWrapper: { justifyContent: 'flex-start', marginTop: 12 },
  gridCell: { flex: 1 / 5, paddingHorizontal: 4, marginBottom: 10 },
  gridItem: { padding: 10, borderRadius: 8, backgroundColor: '#111', aspectRatio: 1, justifyContent: 'flex-end', position: 'relative' },
  itemFocused: {
    borderWidth: 2,
    borderColor: '#FFD54F',
    backgroundColor: '#1b1b1b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  pressableWrap: { flex: 1 },
  pressed: { opacity: 0.7 },
  actionButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, backgroundColor: '#222' },
  actionButtonDisabled: { opacity: 0.6 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  actionButtonFocused: { borderWidth: 2, borderColor: '#FFD54F' },
  actionButtonText: { color: '#fff' },
  itemTitle: { color: '#fff', fontSize: 16 },
  itemSub: { color: '#aaa', marginTop: 4 },
  statusOverlay: { position: 'absolute', top: 8, right: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  favicon: { position: 'absolute', top: 8, left: 8, width: 28, height: 28, borderRadius: 6, overflow: 'hidden', borderColor: 'green' },
  statusDot: { width: 8, height: 8, borderRadius: 6, marginRight: 6 },
  statusUp: { backgroundColor: '#4CAF50' },
  statusDown: { backgroundColor: '#e53935' },
  statusText: { color: '#ccc', fontSize: 12 },
});
