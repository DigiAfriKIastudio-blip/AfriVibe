import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { VideoGrid } from '@/components/profile/VideoGrid';
import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { colors, spacing } from '@/constants/theme';
import { useAppStore } from '@/store/appStore';

/** Profil public d'un créateur. */
export default function UserProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const profiles = useAppStore((state) => state.profiles);
  const videos = useAppStore((state) => state.videos);
  const followingIds = useAppStore((state) => state.interactions.followingIds);
  const currentProfileId = useAppStore((state) => state.currentProfileId);
  const toggleFollow = useAppStore((state) => state.toggleFollow);

  const profile = useMemo(
    () => Object.values(profiles).find((item) => item.username === String(username ?? '')),
    [profiles, username]
  );

  const authorVideos = useMemo(() => {
    if (!profile) {
      return [];
    }
    return Object.values(videos)
      .filter((video) => video.authorId === profile.id)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }, [profile, videos]);

  const isFollowing = profile ? followingIds.includes(profile.id) : false;
  const isOwn = profile?.id === currentProfileId;

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          accessibilityRole="button"
          accessibilityLabel="Revenir en arrière"
          hitSlop={10}
        >
          <Icon name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <AppText variant="subtitle" weight="700" lines={1}>
          {profile ? `@${profile.username}` : 'Profil'}
        </AppText>
        <View style={styles.topBarSpacer} />
      </View>

      {!profile ? (
        <EmptyState
          icon="person-outline"
          title="Profil introuvable"
          description={`Aucun compte ne correspond à « ${String(username ?? '')} ».`}
          actionLabel="Retour au fil"
          onAction={() => router.replace('/')}
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingTop: spacing.sm, paddingBottom: insets.bottom + spacing.xxl }}
          showsVerticalScrollIndicator={false}
        >
          <ProfileHeader
            profile={profile}
            isOwn={isOwn}
            isFollowing={isFollowing}
            postsCount={authorVideos.length}
            onToggleFollow={() => void toggleFollow(profile.id)}
            onEditProfile={() => router.push('/edit-profile')}
          />

          <View style={styles.section}>
            <AppText variant="label" weight="700" color={colors.textMuted}>
              Publications
            </AppText>
            {authorVideos.length > 0 ? (
              <VideoGrid
                videos={authorVideos}
                onPressVideo={(video) =>
                  router.push({ pathname: '/video/[videoId]', params: { videoId: video.id } })
                }
              />
            ) : (
              <View style={styles.emptyWrapper}>
                <EmptyState icon="videocam-outline" title="Aucune publication" />
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  topBarSpacer: {
    width: 26,
  },
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: 0,
    gap: spacing.sm,
  },
  emptyWrapper: {
    height: 220,
  },
});
