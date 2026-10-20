import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { colors, radii, spacing } from '@/constants/theme';
import { resolvePosterSource } from '@/constants/media';
import type { Video } from '@/types/entities';
import { formatCount } from '@/utils/format';

interface VideoTileProps {
  video: Video;
  onPress: (video: Video) => void;
  size?: number;
}

/** Vignette carrée utilisée dans les grilles (profil, recherche, favoris). */
export function VideoTile({ video, onPress, size }: VideoTileProps) {
  const poster = resolvePosterSource(video.poster);

  return (
    <Pressable
      onPress={() => onPress(video)}
      accessibilityRole="button"
      accessibilityLabel={`Vidéo : ${video.description.slice(0, 60)}`}
      style={({ pressed }) => [
        styles.container,
        size ? { width: size, height: size } : null,
        pressed ? styles.pressed : null,
      ]}
    >
      {poster ? (
        <Image source={poster} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
      ) : (
        <LinearGradient colors={[colors.surfaceMuted, colors.surface]} style={StyleSheet.absoluteFill} />
      )}

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.75)']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={styles.playBadge}>
        <Icon name="play" size={12} color={colors.text} />
      </View>

      <View style={styles.footer}>
        <Icon name="eye-outline" size={12} color={colors.text} />
        <AppText variant="caption" weight="600">
          {formatCount(video.stats.views)}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: radii.sm,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: 0.8,
  },
  playBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 22,
    height: 22,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    position: 'absolute',
    left: spacing.xs,
    bottom: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
});
