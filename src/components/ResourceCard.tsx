import React from 'react';
import { View, Text, Pressable, Animated, Image, StyleSheet, Alert } from 'react-native';
import safeAlert from '../utils/safeAlert';
import Icon from './Icon';
import theme from '../theme';
import { loadConfig, fetchPublicIp, addClientToResource, listResourceRules } from '../api/pangolin';

export default function ResourceCard({
  item,
  index,
  focused,
  getScale,
  setFocusedId,
  s,
  targetStatus,
  up,
  columns,
  whitelisted,
  onWhitelistChange,
}: any) {
  const handlePress = async () => {
    // prevent add when not configured
    const cfg = await loadConfig();
    if (!cfg || !cfg.apiKey) {
      safeAlert('Not configured', 'Set your Pangolin API key in Settings before adding whitelist entries');
      return;
    }
    try {

      const ip = await fetchPublicIp();
      let rulesData: any;
      try {
        rulesData = await listResourceRules(String(item.resourceId));
      } catch (rerr: any) {
        safeAlert('Error', rerr?.message || 'Failed to fetch resource rules');
        return;
      }

      const rulesArr = Array.isArray(rulesData)
        ? rulesData
        : rulesData?.data?.rules ?? rulesData?.rules ?? rulesData?.items ?? [];
      const already = Array.isArray(rulesArr) && rulesArr.some((r: any) => {
        const candidates = [r.ip, r.value, r.address, r.client?.ip];
        return candidates.some((v) => v === ip);
      });
      if (already) {
        safeAlert('Already Whitelisted', `${ip} is already whitelisted for ${item.name || item.niceId || item.resourceId}`);
        // update parent map just in case
        onWhitelistChange && onWhitelistChange(String(item.resourceId), true);
        return;
      }
      safeAlert(
        'Add to whitelist',
        `Add ${ip} to whitelist for ${item.name || item.niceId || item.resourceId}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Add',
            onPress: async () => {
              try {
                await addClientToResource(String(item.resourceId), ip);
                onWhitelistChange && onWhitelistChange(String(item.resourceId), true);
                safeAlert('Success', `Added ${ip} to whitelist for ${item.name || item.niceId || item.resourceId}`);
              } catch (e: any) {
                safeAlert('Error', e.message || 'Failed to add to whitelist');
              }
            },
          },
        ]
      );
    } catch (e: any) {
      safeAlert('Error', e.message || 'Failed to fetch public IP');
    }
  };
  return (
    <View style={[styles.gridCell, { flex: 1 / (columns ?? 5) }]}> 
      <Pressable
        focusable={true}
        hasTVPreferredFocus={index === 0}
        onFocus={() => {
          setFocusedId(item.resourceId);
          Animated.timing(getScale(item.resourceId), { toValue: 1.02, duration: 120, useNativeDriver: true }).start();
        }}
        onBlur={() => {
          setFocusedId((id: any) => (id === item.resourceId ? null : id));
          Animated.timing(getScale(item.resourceId), { toValue: 1, duration: 120, useNativeDriver: true }).start();
        }}
        onPress={handlePress}
        style={({ pressed }) => [styles.pressableWrap, pressed && styles.pressed]}
      >
        <Animated.View style={[styles.gridItem, focused ? styles.itemFocused : null, { transform: [{ scale: getScale(item.resourceId) }] }]}>
          <>
            <View style={styles.statusOverlay} pointerEvents="none">
              {(() => {
                const isLocked = item.sso && !whitelisted;
                return (
                  <Icon
                    name={isLocked ? 'lock-fill' : 'unlock-fill'}
                    size={16}
                    color={isLocked ? theme.primaryScale[50] : theme.tertiaryScale[30]}
                    style={styles.ssoIcon}
                    accessible={true}
                    accessibilityRole="image"
                    accessibilityLabel={isLocked ? 'Locked' : 'Unlocked'}
                  />
                );
              })()}
              <View style={[styles.statusDot, up ? styles.statusUp : styles.statusDown]} />
              {focused ? (
                <Text style={styles.statusText}>{s ? (s.up ? `${s.latency ?? '–'} ms` : 'Down') : targetStatus ? targetStatus : 'Unknown'}</Text>
              ) : null}
            </View>
            <View style={styles.faviconWrapper} pointerEvents="none">
              {s?.favicon ? (
                <Image source={{ uri: s.favicon }} style={styles.favicon} />
              ) : null}
            </View>
          </>
          <Text style={styles.itemTitle} numberOfLines={2}>{item.name || item.niceId || item.resourceId}</Text>
          <Text style={styles.itemSub} numberOfLines={1}>{focused ? item.fullDomain || '' : ''}</Text>
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  gridCell: { flex: 1 / 5, paddingHorizontal: 4, marginBottom: 10 },
  gridItem: { padding: 10, borderRadius: 8, backgroundColor: theme.primaryScale[20], aspectRatio: 1, justifyContent: 'flex-end', position: 'relative' },
  itemFocused: {
    borderWidth: 2,
    borderColor: theme.primaryScale[50],
    backgroundColor: theme.primaryScale[30],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  pressableWrap: { flex: 1 },
  pressed: { opacity: 0.7 },
  itemTitle: { color: '#fff', fontSize: 16 },
  itemSub: { color: '#aaa', marginTop: 4 },
  statusOverlay: { position: 'absolute', top: 8, right: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  faviconWrapper: { width: '100%', alignItems: 'center', marginBottom: 20 },
  favicon: { width: 40, height: 40, borderRadius: 6, overflow: 'hidden' },
  ssoIcon: { marginRight: 6, fontSize: 14 },
  statusDot: { width: 8, height: 8, borderRadius: 6, marginRight: 6 },
  statusUp: { backgroundColor: '#4CAF50' },
  statusDown: { backgroundColor: '#e53935' },
  statusText: { color: '#ccc', fontSize: 12 },
});
