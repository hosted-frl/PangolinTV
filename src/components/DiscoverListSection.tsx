import React, { forwardRef, useEffect, useState } from 'react';
import { View, FlatList, Text, StyleSheet } from 'react-native';
import { SeerrResult, SeerrDiscoverParams } from '../api/seerr';
import seerr from '../api/seerr';
import MediaCard from './MediaCard';
import theme from '../theme';

type DiscoverListSectionProps = {
  id: string;
  title: string;
  endpoint: 'movies' | 'tv' | 'upcoming' | 'popular' | 'trending';
  params?: SeerrDiscoverParams;
  focusedMediaKey: string | null;
  baseUrl?: string | null;
  screenWidth: number;
  marginTop?: number;
  onFocus: (sectionId: string, itemId: number) => void;
  onBlur: () => void;
  onLayout?: (id: string, event: any) => void;
  onDataChange?: (id: string, items: SeerrResult[]) => void;
};

const DiscoverListSection = forwardRef<any, DiscoverListSectionProps>(
  (
    {
      id,
      title,
      endpoint,
      params,
      focusedMediaKey,
      baseUrl,
      screenWidth,
      marginTop = 8,
      onFocus,
      onBlur,
      onLayout,
      onDataChange,
    },
    ref
  ) => {
    const [data, setData] = useState<SeerrResult[]>([]);
    const [loading, setLoading] = useState(true);
    const listRef = React.useRef<any>(null);

    // Fetch data for this section
    useEffect(() => {
      setLoading(true);
      (async () => {
        try {
          const response = await seerr.discover(endpoint, params?.page || 1);
          setData(response.results);
          onDataChange?.(id, response.results);
        } catch (error) {
          console.warn(`Failed to fetch ${endpoint}:`, error);
          setData([]);
          onDataChange?.(id, []);
        } finally {
          setLoading(false);
        }
      })();
    }, [endpoint, params, id, onDataChange]);

    // Auto-scroll focused item to center
    useEffect(() => {
      if (!focusedMediaKey) return;

      const [sectionId, itemIdRaw] = focusedMediaKey.split(':');
      if (sectionId !== id) return;

      const itemId = Number(itemIdRaw);
      if (Number.isNaN(itemId)) return;

      const focusedIndex = data.findIndex(item => item.id === itemId);
      if (focusedIndex >= 0) {
        listRef.current?.scrollToIndex({
          index: focusedIndex,
          viewPosition: 0.5,
          animated: true,
        });
      }
    }, [focusedMediaKey, data, id]);

    if (loading || data.length === 0) {
      return null; // Don't render empty sections
    }

    return (
      <View onLayout={(e) => onLayout?.(id, e)}>
        <Text style={[styles.sectionTitle, { marginTop }]}>{title}</Text>
        <FlatList
          ref={listRef}
          data={data}
          horizontal
          showsHorizontalScrollIndicator={false}
          extraData={focusedMediaKey}
          keyExtractor={(it: SeerrResult) => `${it.type}-${String(it.id)}`}
          renderItem={({ item }) => (
            <MediaCard
              item={item}
              width={Math.min(160, Math.floor(screenWidth * 0.18))}
              baseUrl={baseUrl}
              focused={focusedMediaKey === `${id}:${item.id}`}
              onFocus={() => onFocus(id, item.id)}
              onBlur={onBlur}
            />
          )}
          contentContainerStyle={{ paddingVertical: 12 }}
          scrollEnabled={true}
          nestedScrollEnabled={false}
        />
      </View>
    );
  }
);

DiscoverListSection.displayName = 'DiscoverListSection';

const styles = StyleSheet.create({
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default DiscoverListSection;
