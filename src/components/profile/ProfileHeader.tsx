import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { colors, radii, spacing } from '@/constants/theme';
import type { Profile } from '@/types/entities';
import { formatCount } from '@/utils/format';

interface ProfileHeaderProps {
  profile: Profile;
  isOwn: boolean;
  isFollowing: boolean;
  postsCount: number;
  onToggleFollow: () => void;
  onEditProfile: () => void;
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <AppText variant="subtitle" weight="700">
        {formatCount(value)}
      </AppText>
      <AppText variant="caption" color={colors.textMuted}>
        {label}
      </AppText>
    </View>
  );
}

export function ProfileHeader({
  profile,
  isOwn,
  isFollowing,
  postsCount,
  onToggleFollow,
  onEditProfile,
}: ProfileHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Avatar profile={profile} size={84} ring />
        <View style={styles.statsRow}>
          <Stat value={postsCount} label="publications" />
          <Stat value={profile.stats.followers} label="abonnés" />
          <Stat value={profile.stats.following} label="abonnements" />
        </View>
      </View>

      <View style={styles.identity}>
        <View style={styles.nameRow}>
          <AppText variant="subtitle" weight="700">
            {profile.displayName}
          </AppText>
          {profile.isVerified ? (
            <AppText variant="label" color={colors.primary}>
              ✓
            </AppText>
          ) : null}
        </View>
        <AppText variant="label" color={colors.textMuted}>
          @{profile.username}
        </AppText>
        {profile.bio ? (
          <AppText variant="body" style={styles.bio}>
            {profile.bio}
          </AppText>
        ) : null}
        <AppText variant="caption" color={colors.textFaint} style={styles.likes}>
          {formatCount(profile.stats.likes)} j’aime au total
        </AppText>
      </View>

      <View style={styles.actions}>
        {isOwn ? (
          <Button label="Modifier mon profil" variant="secondary" compact onPress={onEditProfile} icon="create-outline" style={styles.actionButton} />
        ) : (
          <Button
            label={isFollowing ? 'Abonné' : "S'abonner"}
            variant={isFollowing ? 'secondary' : 'primary'}
            compact
            onPress={onToggleFollow}
            icon={isFollowing ? 'checkmark' : 'add'}
            style={styles.actionButton}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  statsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
    gap: 2,
  },
  identity: {
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  bio: {
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  likes: {
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    borderRadius: radii.md,
  },
});
