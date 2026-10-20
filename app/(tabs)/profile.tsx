import { useRouter } from 'expo-router';
import { useBottomTabBarHeight } from 'expo-router/js-tabs';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { VideoGrid } from '@/components/profile/VideoGrid';
import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';
import { colors, radii, spacing } from '@/constants/theme';
import { getDataSource } from '@/data';
import { resetDatabase } from '@/data/local/database';
import {
  selectLikedVideos,
  selectSavedVideos,
  selectVideosByAuthor,
  useAppStore,
} from '@/store/appStore';

type Tab = 'posts' | 'saved' | 'liked';

const tabs: { key: Tab; label: string }[] = [
  { key: 'posts', label: 'Publications' },
  { key: 'saved', label: 'Favoris' },
  { key: 'liked', label: 'Aimées' },
];

/** Profil de l'utilisateur courant. */
export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const [tab, setTab] = useState<Tab>('posts');

  const state = useAppStore();
  const profile = state.profiles[state.currentProfileId];
  const hydrate = state.hydrate;

  const posts = useMemo(
    () => (state.currentProfileId ? selectVideosByAuthor(state, state.currentProfileId) : []),
    [state]
  );
  const saved = useMemo(() => selectSavedVideos(state), [state]);
  const liked = useMemo(() => selectLikedVideos(state), [state]);

  const displayed = tab === 'posts' ? posts : tab === 'saved' ? saved : liked;

  if (!profile) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="person-outline"
          title="Profil indisponible"
          description="Les données locales n’ont pas pu être chargées."
          actionLabel="Recharger"
          onAction={() => void hydrate()}
        />
      </View>
    );
  }

  const handleReset = () => {
    Alert.alert(
      'Réinitialiser la démo',
      'Toutes les interactions locales (j’aime, favoris, abonnements, commentaires, publications) seront effacées et remplacées par les données de démonstration.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: async () => {
            await resetDatabase();
            await hydrate();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing.md,
          paddingBottom: tabBarHeight + spacing.xxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeader
          profile={profile}
          isOwn
          isFollowing={false}
          postsCount={posts.length}
          onToggleFollow={() => undefined}
          onEditProfile={() => router.push('/edit-profile')}
        />

        <View style={styles.tabs}>
          {tabs.map((entry) => (
            <Pressable
              key={entry.key}
              onPress={() => setTab(entry.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === entry.key }}
              style={[styles.tab, tab === entry.key ? styles.tabActive : null]}
            >
              <AppText
                variant="label"
                weight={tab === entry.key ? '700' : '500'}
                color={tab === entry.key ? colors.text : colors.textMuted}
              >
                {entry.label}
              </AppText>
            </Pressable>
          ))}
        </View>

        {displayed.length > 0 ? (
          <VideoGrid
            videos={displayed}
            onPressVideo={(video) =>
              router.push({ pathname: '/video/[videoId]', params: { videoId: video.id } })
            }
          />
        ) : (
          <View style={styles.emptyWrapper}>
            <EmptyState
              icon={tab === 'posts' ? 'videocam-outline' : tab === 'saved' ? 'bookmark-outline' : 'heart-outline'}
              title={
                tab === 'posts'
                  ? 'Aucune publication'
                  : tab === 'saved'
                    ? 'Aucun favori'
                    : 'Aucune vidéo aimée'
              }
              description={
                tab === 'posts'
                  ? 'Créez votre première vidéo depuis l’onglet « Créer ».'
                  : 'Vos actions dans le fil apparaîtront ici.'
              }
              actionLabel={tab === 'posts' ? 'Créer une vidéo' : 'Explorer le fil'}
              onAction={() => router.push(tab === 'posts' ? '/create' : '/')}
            />
          </View>
        )}

        {getDataSource().name === 'local' ? (
          <Pressable
            onPress={handleReset}
            accessibilityRole="button"
            accessibilityLabel="Réinitialiser les données de démonstration"
            style={styles.resetButton}
          >
            <AppText variant="caption" color={colors.textFaint} align="center">
              Réinitialiser les données de démonstration
            </AppText>
          </Pressable>
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
  tabs: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  emptyWrapper: {
    height: 260,
  },
  resetButton: {
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.lg,
    borderRadius: radii.md,
  },
});
