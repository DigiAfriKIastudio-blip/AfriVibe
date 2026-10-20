import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CommentComposer } from '@/components/comments/CommentComposer';
import { CommentItem } from '@/components/comments/CommentItem';
import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { colors, radii, spacing } from '@/constants/theme';
import { formatCount } from '@/utils/format';
import { useAppStore } from '@/store/appStore';

/** Feuille de commentaires d'une vidéo. */
export default function CommentsScreen() {
  const { videoId } = useLocalSearchParams<{ videoId: string }>();
  const id = String(videoId ?? '');
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const comments = useAppStore((state) => state.comments[id]);
  const profiles = useAppStore((state) => state.profiles);
  const video = useAppStore((state) => state.videos[id]);
  const currentProfileId = useAppStore((state) => state.currentProfileId);
  const likedCommentIds = useAppStore((state) => state.interactions.likedCommentIds);
  const loadComments = useAppStore((state) => state.loadComments);
  const deleteComment = useAppStore((state) => state.deleteComment);
  const toggleCommentLike = useAppStore((state) => state.toggleCommentLike);

  useEffect(() => {
    if (id) {
      void loadComments(id);
    }
  }, [id, loadComments]);

  const items = useMemo(() => comments ?? [], [comments]);

  const confirmDelete = (commentId: string) => {
    Alert.alert('Supprimer le commentaire', 'Cette action est définitive.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => void deleteComment(id, commentId),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerInner}>
          <View style={styles.headerSpacer} />
          <View style={styles.headerTitle}>
            <AppText variant="subtitle" weight="700">
              Commentaires
            </AppText>
            <AppText variant="caption" color={colors.textMuted}>
              {formatCount(video?.stats.comments ?? items.length)}
            </AppText>
          </View>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            accessibilityRole="button"
            accessibilityLabel="Fermer les commentaires"
            hitSlop={10}
            style={styles.closeButton}
          >
            <Icon name="close" size={22} color={colors.text} />
          </Pressable>
        </View>
        <View style={styles.grabber} />
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.emptyWrapper}>
            <EmptyState
              icon="chatbubble-ellipses-outline"
              title="Soyez le premier à commenter"
              description="Votre commentaire sera enregistré sur cet appareil."
            />
          </View>
        }
        renderItem={({ item }) => (
          <CommentItem
            comment={item}
            author={profiles[item.authorId]}
            liked={likedCommentIds.includes(item.id)}
            isOwn={item.authorId === currentProfileId}
            onToggleLike={() => void toggleCommentLike(id, item.id)}
            onDelete={() => confirmDelete(item.id)}
          />
        )}
      />

      {video ? (
        <CommentComposer videoId={id} />
      ) : (
        <AppText variant="caption" color={colors.textFaint} align="center" style={styles.missing}>
          Vidéo introuvable : impossible d’ajouter un commentaire.
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerSpacer: {
    width: 34,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  closeButton: {
    width: 34,
    alignItems: 'flex-end',
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.sm,
  },
  listContent: {
    paddingVertical: spacing.md,
    flexGrow: 1,
  },
  emptyWrapper: {
    height: 320,
  },
  missing: {
    padding: spacing.lg,
  },
});
