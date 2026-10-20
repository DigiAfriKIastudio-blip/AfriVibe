import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { colors, radii, spacing } from '@/constants/theme';
import type { Comment, Profile } from '@/types/entities';
import { formatCount, formatRelativeTime } from '@/utils/format';

interface CommentItemProps {
  comment: Comment;
  author: Profile | undefined;
  liked: boolean;
  isOwn: boolean;
  onToggleLike: () => void;
  onDelete: () => void;
}

export function CommentItem({
  comment,
  author,
  liked,
  isOwn,
  onToggleLike,
  onDelete,
}: CommentItemProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => author && !isOwn && router.push(`/user/${author.username}`)}
        accessibilityRole="button"
        accessibilityLabel={`Profil de ${author?.displayName ?? 'utilisateur'}`}
        hitSlop={4}
      >
        <Avatar
          profile={author ?? { displayName: '?', username: 'inconnu', avatarColor: colors.surfaceMuted }}
          size={36}
        />
      </Pressable>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <AppText variant="label" weight="700" color={colors.textMuted}>
            @{author?.username ?? 'inconnu'}
            {author?.isVerified ? ' ✓' : ''}
          </AppText>
          <AppText variant="caption" color={colors.textFaint}>
            {formatRelativeTime(comment.createdAt)}
          </AppText>
        </View>

        <AppText variant="body" style={styles.text}>
          {comment.text}
        </AppText>

        <View style={styles.actionsRow}>
          <Pressable
            onPress={onToggleLike}
            accessibilityRole="button"
            accessibilityLabel={liked ? 'Retirer le j’aime du commentaire' : "Aimer le commentaire"}
            accessibilityState={{ selected: liked }}
            style={styles.likeButton}
            hitSlop={6}
          >
            <Icon
              name={liked ? 'heart' : 'heart-outline'}
              size={14}
              color={liked ? colors.like : colors.textMuted}
            />
            {comment.likes > 0 ? (
              <AppText variant="caption" color={colors.textMuted}>
                {formatCount(comment.likes)}
              </AppText>
            ) : null}
          </Pressable>

          {isOwn ? (
            <Pressable
              onPress={onDelete}
              accessibilityRole="button"
              accessibilityLabel="Supprimer mon commentaire"
              hitSlop={6}
            >
              <Icon name="trash-outline" size={14} color={colors.textFaint} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  text: {
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.xs,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
});
