import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { colors, spacing } from '@/constants/theme';
import type { Profile } from '@/types/entities';
import { formatCount } from '@/utils/format';

interface ProfileRowProps {
  profile: Profile;
  isFollowing: boolean;
  isOwn: boolean;
  onPress: () => void;
  onToggleFollow: () => void;
}

export function ProfileRow({ profile, isFollowing, isOwn, onPress, onToggleFollow }: ProfileRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Profil de ${profile.displayName}`}
      style={({ pressed }) => [styles.container, pressed ? styles.pressed : null]}
    >
      <Avatar profile={profile} size={48} />
      <View style={styles.identity}>
        <AppText variant="label" weight="700" lines={1}>
          {profile.displayName}
          {profile.isVerified ? '  ✓' : ''}
        </AppText>
        <AppText variant="caption" color={colors.textMuted} lines={1}>
          @{profile.username} · {formatCount(profile.stats.followers)} abonnés
        </AppText>
      </View>
      {isOwn ? null : (
        <Button
          label={isFollowing ? 'Abonné' : "S'abonner"}
          variant={isFollowing ? 'secondary' : 'primary'}
          compact
          onPress={onToggleFollow}
          accessibilityLabel={`${isFollowing ? 'Se désabonner de' : "S'abonner à"} ${profile.displayName}`}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  pressed: {
    opacity: 0.7,
  },
  identity: {
    flex: 1,
    gap: 2,
  },
});
