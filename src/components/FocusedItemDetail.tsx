import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ImageBackground, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SeerrResult, SeerrGenre } from '../api/seerr';
import seerr from '../api/seerr';
import { getDisplayName, resolveSeerrImage } from './seerrHelpers';
import theme from '../theme';
import MediaStatusBadge from './MediaStatusBadge';

type FocusedItemDetailProps = {
  item: SeerrResult | null | undefined;
  baseUrl?: string | null;
};

export default function FocusedItemDetail({ item, baseUrl }: FocusedItemDetailProps) {
  const [backdropError, setBackdropError] = React.useState(false);
  const [genres, setGenres] = useState<SeerrGenre[]>([]);
  const [randomBackdrop, setRandomBackdrop] = useState<string | null>(null);

  // Fetch genres on mount
  useEffect(() => {
    (async () => {
      const movieGenres = await seerr.fetchGenres('movie');
      const tvGenres = await seerr.fetchGenres('tv');
      // Merge both for now (in case we have mixed content)
      const allGenres = [...movieGenres, ...tvGenres];
      setGenres(allGenres);
      
      // Pick a random backdrop from genres
      const genresWithBackdrops = allGenres.filter(g => g.backdrops && g.backdrops.length > 0);
      if (genresWithBackdrops.length > 0) {
        const randomGenre = genresWithBackdrops[Math.floor(Math.random() * genresWithBackdrops.length)];
        const randomBackdropPath = randomGenre.backdrops![Math.floor(Math.random() * randomGenre.backdrops!.length)];
        setRandomBackdrop(resolveSeerrImage(baseUrl, randomBackdropPath, 'backdrop'));
      }
    })();
  }, [baseUrl]);

  const screenW = Dimensions.get('window').width;
  const backdropWidth = screenW * 0.5;

  // Create a spoofed item when no real item is selected
  const displayItem: SeerrResult = item || {
    id: 0,
    type: 'movie',
    title: 'Seerr',
    overview: 'Browse movies and TV shows',
    backdropPath: randomBackdrop || null,
    posterPath: null,
    voteAverage: undefined,
    genreIds: [],
  };

  const resolvedBackdrop = React.useMemo(
    () => resolveSeerrImage(baseUrl, displayItem.backdropPath || undefined, 'backdrop'),
    [displayItem, baseUrl]
  );

  const year = displayItem.releaseDate ? new Date(displayItem.releaseDate).getFullYear() : null;

  // Build metadata string (year • genres • rating)
  const metadataParts: string[] = [];
  if (year) metadataParts.push(String(year));
  
  // Get genre names
  const genreNames = seerr.getGenreNames(displayItem.genreIds || [], genres);
  if (genreNames.length > 0) {
    metadataParts.push(genreNames.slice(0, 3).join(', ')); // Show up to 3 genres
  }
  
  if (displayItem.voteAverage !== undefined) metadataParts.push(`★ ${displayItem.voteAverage.toFixed(1)}`);
  const metadata = metadataParts.join('   •   ');

  return (
    <View style={styles.detailContainer}>
      {resolvedBackdrop && !backdropError ? (
        <ImageBackground
          source={{ uri: resolvedBackdrop }}
          style={[styles.backdropImage, { width: backdropWidth }]}
          imageStyle={styles.backdropImageStyle}
          onError={() => setBackdropError(true)}
        >
          <LinearGradient
            colors={['rgba(0, 0, 0, 0.3)', theme.primaryScale[10]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientFade}
            pointerEvents="none"
          />
          <View style={styles.detailOverlay}>
            {item && (
              <MediaStatusBadge
                status={displayItem.mediaInfo?.status}
                size={24}
                style={styles.statusBadgeTop}
              />
            )}
            <View style={styles.titleRow}>
              <Text style={styles.detailTitle} numberOfLines={4}>
                {getDisplayName(displayItem)}
              </Text>
            </View>
            {metadata && <Text style={styles.detailMetadata}>{metadata}</Text>}
            {displayItem.overview && (
              <Text style={styles.detailOverview} numberOfLines={8}>
                {displayItem.overview}
              </Text>
            )}
          </View>
        </ImageBackground>
      ) : (
        <View style={[styles.backdropPlaceholder, { width: backdropWidth }]}>
          <LinearGradient
            colors={['rgba(0, 0, 0, 0.3)', theme.primaryScale[10]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientFade}
            pointerEvents="none"
          />
          <Text style={styles.detailTitle} numberOfLines={4}>
            {getDisplayName(displayItem)}
          </Text>
          {metadata && <Text style={styles.detailMetadata}>{metadata}</Text>}
          {displayItem.overview && (
            <Text style={styles.detailOverview} numberOfLines={8}>
              {displayItem.overview}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  detailContainer: { flex: 1, width: '100%', height: '100%', overflow: 'visible' },
  backdropImage: { flex: 1, justifyContent: 'flex-end' },
  backdropImageStyle: {},
  detailOverlay: { padding: 16, justifyContent: 'flex-end', maxWidth: '80%' },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  detailTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 40,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 20,
  },
  statusBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 16,
    padding: 6,
    marginTop: 4,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  titleSection: {
    flex: 1,
  },
  statusBadgeTop: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 16,
    padding: 6,
    marginBottom: 12,
    width: 40,
  },
  detailYear: {
    color: theme.tertiaryScale[70],
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 20,
  },
  detailMetadata: {
    color: theme.tertiaryScale[70],
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 20,
  },
  detailRating: {
    color: theme.tertiaryScale[70],
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 20,
  },
  detailOverview: {
    color: theme.primaryScale[100],
    fontSize: 12,
    lineHeight: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  backdropPlaceholder: { flex: 1, backgroundColor: theme.primaryScale[10], justifyContent: 'flex-end' },
  gradientFade: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '100%',
  },
});
