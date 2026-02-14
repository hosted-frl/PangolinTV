import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { MediaStatus } from '../api/seerr';
import Icon from './Icon';
import theme from '../theme';

type MediaStatusBadgeProps = {
  status?: MediaStatus;
  size?: number;
  style?: ViewStyle;
};

export default function MediaStatusBadge({ status, size = 20, style }: MediaStatusBadgeProps) {
  if (!status || status === MediaStatus.UNKNOWN || status === MediaStatus.DELETED) {
    return null;
  }

  const getIconConfig = () => {
    switch (status) {
      case MediaStatus.PENDING:
        return { name: 'pending' as const, color: theme.primaryScale[70] };
      case MediaStatus.PROCESSING:
        return { name: 'processing' as const, color: theme.secondaryScale[50] };
      case MediaStatus.PARTIALLY_AVAILABLE:
        return { name: 'partially' as const, color: theme.tertiaryScale[50] };
      case MediaStatus.AVAILABLE:
        return { name: 'available' as const, color: '#4ade80' }; // green
      default:
        return null;
    }
  };

  const iconConfig = getIconConfig();
  if (!iconConfig) return null;

  return (
    <View style={[styles.badge, style]}>
      <Icon name={iconConfig.name} size={size} color={iconConfig.color} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
