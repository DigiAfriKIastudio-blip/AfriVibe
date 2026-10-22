import { useRouter } from 'expo-router';
import { useBottomTabBarHeight } from 'expo-router/js-tabs';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FeedList } from '@/components/feed/FeedList';
import { AppText } from '@/components/ui/AppText';
import { colors, radii, spacing } from '@/constants/theme';
import { useAppStore } from '@/store/appStore';
import type { Profile } from '@/types/entities';

type Scope = 'forYou' | 'following';

/** Fil principal : « Pour toi » et « Abonnements ». */
export default function FeedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { height: windowHeight } = useWindowDimensions();

  const [scope, setScope] = useState<Scope>('forYou');

  const videos = useAppStore((state) => state.videos);
  const feedOrder = useAppStore((state) => state.feedOrder);
  const followingIds = useAppStore((state) => state.interactions.followingIds);

  const videoIds = useMemo(() => {
    if (scope === 'forYou') {
      return feedOrder;
    }
    const following = new Set(followingIds);
    return feedOrder.filter((id) => {
      const video = videos[id];
      return video ? following.has(video.authorId) : false;
    });
  }, [feedOrder, followingIds, scope, videos]);

  const onPressAuthor = useCallback(
    (profile: Profile) => {
      router.push({ pathname: '/user/[username]', params: { username: profile.username } });
    },
    [router]
  );

  const feedHeight = windowHeight - tabBarHeight;

  return (
    <View style={styles.container}>
      <FeedList
        videoIds={videoIds}
        height={feedHeight}
        emptyTitle={
          scope === 'following' ? 'Votre fil abonnements est vide' : 'Aucune vidéo pour le moment'
        }
        emptyDescription={
          scope === 'following'
            ? 'Abonnez-vous à des créateurs depuis « Découvrir » pour retrouver leurs vidéos ici.'
            : 'Publiez la première vidéo depuis l’onglet « Créer ».'
        }
        emptyActionLabel={scope === 'following' ? 'Découvrir des créateurs' : 'Créer une vidéo'}
        onEmptyAction={() => router.push(scope === 'following' ? '/discover' : '/create')}
        onPressAuthor={onPressAuthor}
      />

      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]} pointerEvents="box-none">
        <View style={styles.headerRow}>
          <View style={styles.brandLockup}>
            <View style={styles.brandMark}>
              <AppText variant="subtitle" weight="900" style={styles.brandMarkText}>
                A
              </AppText>
            </View>
            <AppText variant="subtitle" weight="800" style={styles.brand}>
              AfriVibe
            </AppText>
          </View>
          <View style={styles.switcher}>
            <Pressable
              onPress={() => setScope('forYou')}
              accessibilityRole="tab"
              accessibilityState={{ selected: scope === 'forYou' }}
              style={[styles.switchButton, scope === 'forYou' ? styles.switchActive : null]}
            >
              <AppText
                variant="label"
                weight={scope === 'forYou' ? '700' : '500'}
                color={scope === 'forYou' ? colors.text : colors.textMuted}
              >
                Pour toi
              </AppText>
            </Pressable>
            <Pressable
              onPress={() => setScope('following')}
              accessibilityRole="tab"
              accessibilityState={{ selected: scope === 'following' }}
              style={[styles.switchButton, scope === 'following' ? styles.switchActive : null]}
            >
              <AppText
                variant="label"
                weight={scope === 'following' ? '700' : '500'}
                color={scope === 'following' ? colors.text : colors.textMuted}
              >
                Abonnements
              </AppText>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandLockup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandMark: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: '#1E3F20',
    borderWidth: 1,
    borderColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkText: {
    color: '#D4AF37',
    fontSize: 18,
    lineHeight: 22,
  },
  brand: {
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 6,
  },
  switcher: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(11,11,15,0.45)',
    borderRadius: radii.pill,
    padding: 3,
  },
  switchButton: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
  },
  switchActive: {
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
});
