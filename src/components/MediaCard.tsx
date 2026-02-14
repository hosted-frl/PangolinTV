import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { SeerrResult } from '../api/seerr';
import { getDisplayName, resolveSeerrImage } from './seerrHelpers';
import theme from '../theme';
import MediaStatusBadge from './MediaStatusBadge';

type MediaCardProps = {
  item: SeerrResult;
  width: number;
  baseUrl?: string | null;
  focused?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
};

export default function MediaCard({
  item,
  width,
  baseUrl,
  focused,
  onFocus,
  onBlur,
}: MediaCardProps) {
  const pressableRef = React.useRef<any>(null);
  const [resolvedPoster] = React.useState<string | null>(() =>
    resolveSeerrImage(baseUrl, item.posterPath || item.backdropPath || undefined, 'poster')
  );
  const [imgError, setImgError] = React.useState(false);
  const year = item.releaseDate ? new Date(item.releaseDate).getFullYear() : null;
  const description = item.overview
    ? item.overview.length > 120
      ? item.overview.substring(0, 120) + '...'
      : item.overview
    : '';

  return (
    <Pressable
      ref={pressableRef}
      onFocus={onFocus}
      onBlur={onBlur}
      style={({ pressed }) => [styles.card, { width }, pressed && styles.cardPressed]}
    >
      {resolvedPoster && !imgError ? (
        <Image
          source={{ uri: resolvedPoster }}
          style={[styles.poster, {
            width, aspectRatio: 2 / 3,
            opacity: focused ? 1 : 0.4,
            borderColor: focused ? theme.primaryScale[50] : 'transparent',
            }]}
          resizeMode="cover"
          onError={(e) => {
            console.warn('Seerr image failed', resolvedPoster, e?.nativeEvent || e);
            setImgError(true);
          }}
        />
      ) : (
        <View style={[styles.posterPlaceholder, { width, aspectRatio: 2 / 3 }]}>
          <Text style={styles.posterText}>{getDisplayName(item)}</Text>
        </View>
      )}
      <MediaStatusBadge
        status={item.mediaInfo?.status}
        size={18}
        style={styles.statusBadge}
      />
      {/* {focused && (
        <View style={[styles.focusOverlay, { width, aspectRatio: 2 / 3 }]}>
          <Text style={styles.overlayTitle} numberOfLines={2}>
            {getDisplayName(item)}
          </Text>
          {year && <Text style={styles.overlayYear}>{year}</Text>}
          {description && (
            <Text style={styles.overlayDescription} numberOfLines={3}>
              {description}
            </Text>
          )}
        </View>
      )} */}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { marginRight: 12, borderRadius: 8 },
  poster: {borderWidth: 2, borderRadius: 8, backgroundColor: theme.primaryScale[10] },
  posterPlaceholder: {
    borderRadius: 8,
    backgroundColor: theme.primaryScale[10],
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  posterText: { color: '#fff', textAlign: 'center', fontSize: 12 },
  cardPressed: { opacity: 0.9 },
  overlayTitle: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 4 },
  overlayYear: { color: theme.tertiaryScale[50], fontSize: 12, fontWeight: '600', marginBottom: 6 },
  overlayDescription: { color: theme.primaryScale[80], fontSize: 11, lineHeight: 14 },
  statusBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 4,
  },
});
