import { useRouter } from 'expo-router';
import { useBottomTabBarHeight } from 'expo-router/js-tabs';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon, type IconName } from '@/components/ui/Icon';
import { colors, radii, spacing } from '@/constants/theme';
import { useAppStore } from '@/store/appStore';
import type { AppNotification, NotificationKind } from '@/types/entities';
import { formatRelativeTime } from '@/utils/format';

const kindMeta: Record<NotificationKind, { icon: IconName; color: string; label: string }> = {
  like: { icon: 'heart', color: colors.like, label: 'J’aime' },
  comment: { icon: 'chatbubble', color: colors.primary, label: 'Commentaire' },
  follow: { icon: 'person-add', color: colors.success, label: 'Abonnement' },
  mention: { icon: 'at', color: colors.accent, label: 'Mention' },
};

/** Centre d'activité : j'aime, commentaires, abonnements (démo locale). */
export default function ActivityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const notifications = useAppStore((state) => state.notifications);
  const profiles = useAppStore((state) => state.profiles);
  const markNotificationsRead = useAppStore((state) => state.markNotificationsRead);

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const openNotification = (notification: AppNotification) => {
    if (notification.videoId) {
      router.push({ pathname: '/video/[videoId]', params: { videoId: notification.videoId } });
      return;
    }
    const actor = profiles[notification.actorId];
    if (actor) {
      router.push({ pathname: '/user/[username]', params: { username: actor.username } });
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.header}>
        <View>
          <AppText variant="title">Activité</AppText>
          <AppText variant="label" color={colors.textMuted}>
            {unreadCount > 0 ? `${unreadCount} nouvelle(s) activité(s)` : 'Tout est à jour'}
          </AppText>
        </View>
        {unreadCount > 0 ? (
          <Button
            label="Tout lire"
            variant="secondary"
            compact
            onPress={() => void markNotificationsRead()}
          />
        ) : null}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: tabBarHeight + spacing.xl }}
        ListEmptyComponent={
          <EmptyState
            icon="notifications-outline"
            title="Aucune activité"
            description="Les j’aime, commentaires et abonnements apparaîtront ici."
          />
        }
        renderItem={({ item }) => {
          const actor = profiles[item.actorId];
          const meta = kindMeta[item.kind];
          return (
            <Pressable
              onPress={() => openNotification(item)}
              accessibilityRole="button"
              accessibilityLabel={`${actor?.displayName ?? 'Quelqu’un'} ${item.message}`}
              style={({ pressed }) => [
                styles.row,
                item.read ? null : styles.rowUnread,
                pressed ? styles.pressed : null,
              ]}
            >
              <View>
                <Avatar
                  profile={actor ?? { displayName: '?', username: '?', avatarColor: colors.surfaceMuted }}
                  size={44}
                />
                <View style={[styles.kindBadge, { backgroundColor: meta.color }]}>
                  <Icon name={meta.icon} size={10} color={colors.background} />
                </View>
              </View>
              <View style={styles.rowContent}>
                <AppText variant="body" lines={3}>
                  <AppText variant="body" weight="700">
                    @{actor?.username ?? 'inconnu'}
                  </AppText>{' '}
                  {item.message}
                </AppText>
                <AppText variant="caption" color={colors.textFaint}>
                  {formatRelativeTime(item.createdAt)} · {meta.label}
                </AppText>
              </View>
              {item.read ? null : <View style={styles.unreadDot} />}
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowUnread: {
    backgroundColor: 'rgba(255,107,53,0.06)',
  },
  pressed: {
    opacity: 0.7,
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  kindBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 18,
    height: 18,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
});
