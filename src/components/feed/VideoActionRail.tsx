import { useRouter } from 'expo-router';
import { Share, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { IconButton } from '@/components/ui/IconButton';
import { colors, spacing } from '@/constants/theme';
import { selectIsFollowing, selectIsLiked, selectIsSaved, useAppStore } from '@/store/appStore';
import type { Profile, Video } from '@/types/entities';

interface VideoActionRailProps {
  video: Video;
  author: Profile | undefined;
}

/** Colonne d'actions à droite du fil (like, commentaires, favoris, partage). */
export function VideoActionRail({ video, author }: VideoActionRailProps) {
  const router = useRouter();
  const isLiked = useAppStore((state) => selectIsLiked(state, video.id));
  const isSaved = useAppStore((state) => selectIsSaved(state, video.id));
  const isFollowing = useAppStore((state) => (author ? selectIsFollowing(state, author.id) : false));
  const toggleLike = useAppStore((state) => state.toggleLike);
  const toggleSave = useAppStore((state) => state.toggleSave);
  const toggleFollow = useAppStore((state) => state.toggleFollow);
  const registerShare = useAppStore((state) => state.registerShare);
  const showToast = useAppStore((state) => state.showToast);

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: `${author ? `@${author.username}` : 'AfriVibe'} sur AfriVibe : ${video.description}`,
      });
      if (result.action === Share.sharedAction) {
        await registerShare(video.id);
      }
    } catch {
      showToast('Partage annulé');
    }
  };

  return (
    <View style={styles.container}>
      {author ? (
        <View style={styles.avatarWrapper}>
          <Avatar
            profile={author}
            size={46}
            ring
            style={isFollowing ? styles.avatarFollowing : undefined}
          />
          {!isFollowing ? (
            <View style={styles.followBadge}>
              <IconButton
                name="add"
                size={14}
                color={colors.background}
                onPress={() => void toggleFollow(author.id)}
                accessibilityLabel={`S'abonner à ${author.displayName}`}
                style={styles.followButton}
              />
            </View>
          ) : null}
          <View style={styles.avatarSpacer} />
        </View>
      ) : null}

      <IconButton
        name={isLiked ? 'heart' : 'heart-outline'}
        count={video.stats.likes}
        active={isLiked}
        onPress={() => void toggleLike(video.id)}
        accessibilityLabel={isLiked ? 'Retirer le j’aime' : "J'aime cette vidéo"}
      />

      <IconButton
        name="chatbubble-outline"
        count={video.stats.comments}
        onPress={() => router.push({ pathname: '/comments/[videoId]', params: { videoId: video.id } })}
        accessibilityLabel="Ouvrir les commentaires"
      />

      <IconButton
        name={isSaved ? 'bookmark' : 'bookmark-outline'}
        count={video.stats.saves}
        active={isSaved}
        color={isSaved ? colors.primary : colors.text}
        onPress={() => void toggleSave(video.id)}
        accessibilityLabel={isSaved ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      />

      <IconButton
        name="share-social-outline"
        count={video.stats.shares}
        onPress={() => void handleShare()}
        accessibilityLabel="Partager la vidéo"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: spacing.md,
    bottom: 132,
    alignItems: 'center',
    gap: spacing.lg,
  },
  avatarWrapper: {
    alignItems: 'center',
  },
  avatarFollowing: {
    borderColor: colors.primary,
  },
  followBadge: {
    marginTop: -8,
    backgroundColor: colors.primary,
    borderRadius: 999,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followButton: {
    paddingVertical: 0,
  },
  avatarSpacer: {
    height: 2,
  },
});
