import { useRouter } from 'expo-router';
import { useBottomTabBarHeight } from 'expo-router/js-tabs';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProfileRow } from '@/components/search/ProfileRow';
import { SearchBar } from '@/components/search/SearchBar';
import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';
import { VideoGrid } from '@/components/profile/VideoGrid';
import { colors, radii, spacing } from '@/constants/theme';
import { aggregateTags, searchCatalog, suggestProfiles } from '@/features/search/search';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useAppStore } from '@/store/appStore';
import type { Profile } from '@/types/entities';

/** Découverte : recherche (comptes, vidéos, hashtags) + suggestions. */
export default function DiscoverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 220);

  const profilesMap = useAppStore((state) => state.profiles);
  const videosMap = useAppStore((state) => state.videos);
  const followingIds = useAppStore((state) => state.interactions.followingIds);
  const currentProfileId = useAppStore((state) => state.currentProfileId);
  const toggleFollow = useAppStore((state) => state.toggleFollow);

  const profiles = useMemo(() => Object.values(profilesMap), [profilesMap]);
  const videos = useMemo(
    () =>
      Object.values(videosMap).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    [videosMap]
  );

  const results = useMemo(
    () => searchCatalog(profiles, videos, debouncedQuery),
    [debouncedQuery, profiles, videos]
  );
  const trends = useMemo(() => aggregateTags(videos).slice(0, 8), [videos]);
  const suggestions = useMemo(
    () => suggestProfiles(profiles, followingIds, currentProfileId, 5),
    [currentProfileId, followingIds, profiles]
  );

  const isSearching = debouncedQuery.trim().length > 0;
  const hasResults =
    results.profiles.length > 0 || results.videos.length > 0 || results.tags.length > 0;

  const openProfile = (profile: Profile) =>
    router.push({ pathname: '/user/[username]', params: { username: profile.username } });

  const openVideo = (videoId: string) =>
    router.push({ pathname: '/video/[videoId]', params: { videoId } });

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.header}>
        <AppText variant="title">Découvrir</AppText>
        <SearchBar value={query} onChangeText={setQuery} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {isSearching && !hasResults ? (
          <EmptyState
            icon="search-outline"
            title="Aucun résultat"
            description={`Rien ne correspond à « ${debouncedQuery.trim()} ». Essayez un autre mot-clé.`}
          />
        ) : null}

        {isSearching && results.profiles.length > 0 ? (
          <View style={styles.section}>
            <AppText variant="subtitle">Comptes</AppText>
            {results.profiles.map((profile) => (
              <ProfileRow
                key={profile.id}
                profile={profile}
                isOwn={profile.id === currentProfileId}
                isFollowing={followingIds.includes(profile.id)}
                onPress={() => openProfile(profile)}
                onToggleFollow={() => void toggleFollow(profile.id)}
              />
            ))}
          </View>
        ) : null}

        {isSearching && results.tags.length > 0 ? (
          <View style={styles.section}>
            <AppText variant="subtitle">Hashtags</AppText>
            <View style={styles.tagsWrap}>
              {results.tags.map((entry) => (
                <Pressable
                  key={entry.tag}
                  onPress={() => setQuery(`#${entry.tag}`)
                  style={styles.chip}
                  accessibilityRole="button"
                  accessibilityLabel={`Rechercher le hashtag ${entry.tag}`}
                >
                  <AppText variant="label" color={colors.text}>
                    #{entry.tag}
                  </AppText>
                  <AppText variant="caption" color={colors.textFaint}>
                    {entry.count}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {isSearching && results.videos.length > 0 ? (
          <View style={styles.section}>
            <AppText variant="subtitle">Vidéos</AppText>
            <VideoGrid videos={results.videos} onPressVideo={(video) => openVideo(video.id)} />
          </View>
        ) : null}

        {!isSearching ? (
          <>
            <View style={styles.section}>
              <AppText variant="subtitle">Tendances</AppText>
              <View style={styles.tagsWrap}>
                {trends.map((entry) => (
                  <Pressable
                    key={entry.tag}
                    onPress={() => setQuery(entry.tag)}
                    style={styles.chip}
                    accessibilityRole="button"
                    accessibilityLabel={`Rechercher le hashtag ${entry.tag}`}
                  >
                    <AppText variant="label" color={colors.text}>
                      #{entry.tag}
                    </AppText>
                    <AppText variant="caption" color={colors.textFaint}>
                      {entry.count} vidéos
                    </AppText>
                  </Pressable>
                ))}
              </View>
            </View>

            {suggestions.length > 0 ? (
              <View style={styles.section}>
                <AppText variant="subtitle">Créateurs à suivre</AppText>
                {suggestions.map((profile) => (
                  <ProfileRow
                    key={profile.id}
                    profile={profile}
                    isOwn={false}
                    isFollowing={followingIds.includes(profile.id)}
                    onPress={() => openProfile(profile)}
                    onToggleFollow={() => void toggleFollow(profile.id)}
                  />
                ))}
              </View>
            ) : null}

            <View style={styles.section}>
              <AppText variant="subtitle">Récent</AppText>
              <VideoGrid videos={videos} onPressVideo={(video) => openVideo(video.id)} />
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xl,
  },
  section: {
    gap: spacing.sm,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
});
