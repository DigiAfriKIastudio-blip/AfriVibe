import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { VideoTile } from '@/components/ui/VideoTile';
import type { Video } from '@/types/entities';

interface VideoGridProps {
  videos: Video[];
  onPressVideo: (video: Video) => void;
}

const COLUMNS = 3;

/** Grille de vignettes (3 colonnes) façon galerie. */
export function VideoGrid({ videos, onPressVideo }: VideoGridProps) {
  const rows = useMemo(() => {
    const chunks: Video[][] = [];
    for (let index = 0; index < videos.length; index += COLUMNS) {
      chunks.push(videos.slice(index, index + COLUMNS));
    }
    return chunks;
  }, [videos]);

  return (
    <View style={styles.container}>
      {rows.map((row) => (
        <View key={row[0]?.id ?? 'row'} style={styles.row}>
          {row.map((video) => (
            <View key={video.id} style={styles.cell}>
              <VideoTile video={video} onPress={onPressVideo} />
            </View>
          ))}
          {Array.from({ length: COLUMNS - row.length }).map((_, index) => (
            <View key={`filler-${index}`} style={styles.cell} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 2,
    paddingTop: 2,
  },
  row: {
    flexDirection: 'row',
    gap: 2,
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
  },
});
