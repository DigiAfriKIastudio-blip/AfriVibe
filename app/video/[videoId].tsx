import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FeedVideoItem } from '@/components/feed/FeedVideoItem';
import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { colors, radii, spacing } from '@/constants/theme';
import { useAppStore } from '@/store/appStore';
import type { Profile } from '@/types/entities';

/** Lecture d'une vidéo en plein écran (depuis une grille). */
export default function VideoScreen() {
  const { videoId } = useLocalSearchParams<{ videoId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const video = useAppStore((state) => state.videos[String(videoId ?? '')]);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  if (!video) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="videocam-off-outline"
          title="Vidéo introuvable"
          description="Cette vidéo n’est pas disponible sur cet appareil."
          actionLabel="Retour au fil"
          onAction={() => router.replace('/')}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FeedVideoItem
        video={video}
        height={height}
        isActive
        onPressAuthor={(profile: Profile) =>
          router.push({ pathname: '/user/[username]', params: { username: profile.username } })
        }
      />
      <Pressable
        onPress={goBack}
        style={[styles.backButton, { top: insets.top + spacing.sm }]}
        accessibilityRole="button"
        accessibilityLabel="Fermer la vidéo"
        hitSlop={8}
      >
        <Icon name="chevron-back" size={22} color={colors.text} />
        <AppText variant="label" weight="600">
          Retour
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backButton: {
    position: 'absolute',
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: radii.pill,
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: spacing.md,
  },
});
