import { useEventListener } from 'expo';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { VideoActionRail } from '@/components/feed/VideoActionRail';
import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { colors, radii, spacing } from '@/constants/theme';
import { resolvePosterSource, resolveVideoSource } from '@/constants/media';
import { useAppStore } from '@/store/appStore';
import type { Profile, Video } from '@/types/entities';
import { formatCount } from '@/utils/format';

interface FeedVideoItemProps {
  video: Video;
  height: number;
  isActive: boolean;
  onPressAuthor: (profile: Profile) => void;
}

/**
 * Une « page » du fil vertical : vidéo plein écran + surcouche d'actions.
 * Seule la page active joue ; les autres sont en pause et affichent l'affiche.
 */
export function FeedVideoItem({ video, height, isActive, onPressAuthor }: FeedVideoItemProps) {
  const author = useAppStore((state) => state.profiles[video.authorId]);
  const registerView = useAppStore((state) => state.registerView);
  const insets = useSafeAreaInsets();

  const videoSource = useMemo(() => resolveVideoSource(video.video), [video.video]);
  const posterSource = useMemo(() => resolvePosterSource(video.poster), [video.poster]);

  const player = useVideoPlayer(videoSource, (instance) => {
    instance.loop = true;
    // Le fil lit le son original des vidéos publiées ; l'utilisateur peut le couper.
    instance.muted = false;
    instance.timeUpdateEventInterval = 0.25;
  });

  const [appIsActive, setAppIsActive] = useState(AppState.currentState === 'active');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasError, setHasError] = useState(false);

  useEventListener(player, 'playingChange', ({ isPlaying: next }) => setIsPlaying(next));
  useEventListener(player, 'statusChange', ({ status }) => {
    setIsLoading(status === 'loading');
    setHasError(status === 'error');
  });
  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    const duration = player.duration || video.durationSec || 0;
    setProgress(duration > 0 ? Math.min(1, currentTime / duration) : 0);
  });

  // Android peut suspendre les lecteurs quand l'utilisateur quitte l'app.
  // Suivre l'état système évite de laisser un lecteur bloqué en pause au retour.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      setAppIsActive(nextState === 'active');
    });
    return () => subscription.remove();
  }, []);

  // Une seule vidéo joue à la fois, uniquement lorsque l'app est au premier plan.
  useEffect(() => {
    if (!videoSource) {
      return;
    }
    if (isActive && appIsActive) {
      player.play();
      void registerView(video.id);
    } else {
      player.pause();
    }
    if (!isActive) {
      player.currentTime = 0;
    }
  }, [appIsActive, isActive, player, registerView, video.id, videoSource]);

  const togglePlayback = () => {
    if (!videoSource) {
      return;
    }
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  const toggleMute = () => {
    player.muted = !player.muted;
    setIsMuted(player.muted);
  };

  return (
    <View style={[styles.container, { height }]} testID={`feed-video-${video.id}`}>
      {isActive && videoSource ? (
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
          surfaceType="textureView"
          accessibilityLabel={`Vidéo de ${author?.displayName ?? 'AfriVibe'}`}
        />
      ) : posterSource ? (
        <Image source={posterSource} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <LinearGradient colors={[colors.surfaceMuted, colors.background]} style={StyleSheet.absoluteFill} />
      )}

      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={togglePlayback}
        accessibilityRole="button"
        accessibilityLabel={isPlaying ? 'Mettre en pause' : 'Lire la vidéo'}
      />

      {hasError ? (
        <View style={styles.centered}>
          <Icon name="alert-circle-outline" size={34} color={colors.textMuted} />
          <AppText variant="label" color={colors.textMuted}>
            Vidéo indisponible
          </AppText>
        </View>
      ) : null}

      {isActive && isLoading && !hasError ? (
        <View style={styles.centered} pointerEvents="none">
          <ActivityIndicator color={colors.text} />
        </View>
      ) : null}

      {!isPlaying && !isLoading && !hasError ? (
        <View style={styles.centered} pointerEvents="none">
          <View style={styles.pausedBadge}>
            <Icon name="play" size={34} color={colors.text} />
          </View>
        </View>
      ) : null}

      <LinearGradient
        colors={['rgba(0,0,0,0.45)', 'transparent', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.8)']}
        locations={[0, 0.28, 0.55, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]} pointerEvents="box-none">
        <View style={styles.topSpacer} />
        <Pressable
          onPress={toggleMute}
          style={styles.muteButton}
          accessibilityRole="button"
          accessibilityLabel={isMuted ? 'Activer le son' : 'Couper le son'}
          hitSlop={8}
        >
          <Icon name={isMuted ? 'volume-mute' : 'volume-high'} size={18} color={colors.text} />
        </Pressable>
      </View>

      <VideoActionRail video={video} author={author} />

      <View style={styles.caption} pointerEvents="box-none">
        <Pressable
          onPress={() => author && onPressAuthor(author)}
          accessibilityRole="button"
          accessibilityLabel={`Voir le profil de ${author?.displayName ?? ''}`}
        >
          <AppText variant="subtitle" weight="700">
            @{author?.username ?? 'inconnu'}
            {author?.isVerified ? '  ✓' : ''}
          </AppText>
        </Pressable>

        <AppText variant="body" lines={3} style={styles.description}>
          {video.description}
        </AppText>

        <View style={styles.tagsRow}>
          <Icon name="musical-notes" size={13} color={colors.text} />
          <AppText variant="caption" weight="500" lines={1} style={styles.soundName}>
            {video.soundName}
          </AppText>
        </View>

        <AppText variant="caption" color={colors.textMuted} style={styles.views}>
          {formatCount(video.stats.views)} vues
        </AppText>
      </View>

      <View style={styles.progressTrack} pointerEvents="none">
        <View
          style={[styles.progressFill, { width: `${Math.round((isActive ? progress : 0) * 100)}%` }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  centered: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pausedBadge: {
    width: 72,
    height: 72,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  topSpacer: {
    flex: 1,
  },
  muteButton: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: {
    position: 'absolute',
    left: spacing.lg,
    right: 88,
    bottom: 28,
    gap: spacing.xs,
  },
  description: {
    marginTop: 2,
    lineHeight: 20,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  soundName: {
    flexShrink: 1,
  },
  views: {
    marginTop: 2,
  },
  progressTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.text,
  },
});
