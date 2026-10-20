import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { FeedVideoItem } from '@/components/feed/FeedVideoItem';
import { EmptyState } from '@/components/ui/EmptyState';
import { colors, spacing } from '@/constants/theme';
import { useAppStore } from '@/store/appStore';
import type { Profile } from '@/types/entities';

interface FeedListProps {
  videoIds: string[];
  height: number;
  emptyTitle: string;
  emptyDescription: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  onPressAuthor: (profile: Profile) => void;
}

const viewabilityConfig = { itemVisiblePercentThreshold: 60 };

/** Sous-ensemble de `ViewToken` utilisé ici (le type n'est pas exporté par RN 0.88). */
interface ViewableItem {
  index: number | undefined;
  isViewable: boolean;
}

/** Fil vertical paginé : une vidéo plein écran par page. */
export function FeedList({
  videoIds,
  height,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
  onPressAuthor,
}: FeedListProps) {
  const videos = useAppStore((state) => state.videos);
  const [activeIndex, setActiveIndex] = useState(0);

  // Référence stable exigée par FlatList : la callback ne dépend d'aucune valeur.
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewableItem[] }) => {
      const first = viewableItems[0];
      if (first && typeof first.index === 'number') {
        setActiveIndex(first.index);
      }
    },
    []
  );

  const renderItem = useCallback(
    ({ item, index }: { item: string; index: number }) => {
      const video = videos[item];
      if (!video) {
        return <View style={{ height }} />;
      }
      return (
        <FeedVideoItem
          video={video}
          height={height}
          isActive={index === activeIndex}
          onPressAuthor={onPressAuthor}
        />
      );
    },
    [activeIndex, height, onPressAuthor, videos]
  );

  const getItemLayout = useCallback(
    (_data: ArrayLike<string> | null | undefined, index: number) => ({
      length: height,
      offset: height * index,
      index,
    }),
    [height]
  );

  if (videoIds.length === 0) {
    return (
      <View style={[styles.empty, { height }]}>
        <EmptyState
          icon="videocam-outline"
          title={emptyTitle}
          description={emptyDescription}
          actionLabel={emptyActionLabel}
          onAction={onEmptyAction}
        />
      </View>
    );
  }

  return (
    <FlatList
      data={videoIds}
      keyExtractor={(item) => item}
      renderItem={renderItem}
      getItemLayout={getItemLayout}
      pagingEnabled
      snapToInterval={height}
      snapToAlignment="start"
      decelerationRate="fast"
      disableIntervalMomentum
      showsVerticalScrollIndicator={false}
      windowSize={3}
      initialNumToRender={2}
      maxToRenderPerBatch={2}
      removeClippedSubviews
      viewabilityConfig={viewabilityConfig}
      onViewableItemsChanged={onViewableItemsChanged}
      testID="feed-list"
    />
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
});
