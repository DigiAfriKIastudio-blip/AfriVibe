import { StyleSheet, View, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/theme';
import type { Profile } from '@/types/entities';

interface AvatarProps {
  profile: Pick<Profile, 'displayName' | 'username' | 'avatarColor'>;
  size?: number;
  ring?: boolean;
  style?: ViewStyle;
}

function initials(profile: AvatarProps['profile']): string {
  const source = profile.displayName.trim() || profile.username;
  const parts = source.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '?';
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
  return `${first}${second}`.toUpperCase();
}

/** Avatar généré à partir des initiales (aucune image distante requise). */
export function Avatar({ profile, size = 44, ring = false, style }: AvatarProps) {
  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: profile.avatarColor,
          borderWidth: ring ? 2 : 0,
        },
        style,
      ]}
      accessibilityLabel={`Avatar de ${profile.displayName}`}
    >
      <AppText
        weight="700"
        style={{ fontSize: size * 0.38, color: colors.background }}
        variant="label"
      >
        {initials(profile)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: colors.text,
    overflow: 'hidden',
  },
});
