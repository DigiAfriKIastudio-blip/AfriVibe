import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { colors, radii, spacing } from '@/constants/theme';
import { useAppStore } from '@/store/appStore';

/** Édition du profil local (nom affiché et bio). */
export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const me = useAppStore((state) => state.profiles[state.currentProfileId]);
  const updateProfile = useAppStore((state) => state.updateProfile);

  const [displayName, setDisplayName] = useState(me?.displayName ?? '');
  const [bio, setBio] = useState(me?.bio ?? '');
  const [isSaving, setIsSaving] = useState(false);

  const canSave = displayName.trim().length > 0 && !isSaving;

  const handleSave = async () => {
    if (!canSave) {
      return;
    }
    setIsSaving(true);
    await updateProfile({ displayName, bio });
    setIsSaving(false);
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Annuler"
          hitSlop={10}
        >
          <Icon name="close" size={22} color={colors.text} />
        </Pressable>
        <AppText variant="subtitle" weight="700">
          Modifier le profil
        </AppText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {me ? (
          <View style={styles.avatarRow}>
            <Avatar profile={{ ...me, displayName: displayName || me.displayName }} size={80} />
            <AppText variant="caption" color={colors.textFaint} align="center">
              L’avatar est généré à partir de vos initiales.
            </AppText>
          </View>
        ) : null}

        <View style={styles.field}>
          <AppText variant="label" weight="700">
            Nom affiché
          </AppText>
          <TextInput
            value={displayName}
            onChangeText={(value) => setDisplayName(value.slice(0, 40))}
            placeholder="Votre nom"
            placeholderTextColor={colors.textFaint}
            style={styles.input}
            maxLength={40}
            accessibilityLabel="Nom affiché"
          />
          <AppText variant="caption" color={colors.textFaint} align="right">
            {displayName.length}/40
          </AppText>
        </View>

        <View style={styles.field}>
          <AppText variant="label" weight="700">
            Bio
          </AppText>
          <TextInput
            value={bio}
            onChangeText={(value) => setBio(value.slice(0, 160))}
            placeholder="Quelques mots sur vous…"
            placeholderTextColor={colors.textFaint}
            style={[styles.input, styles.textArea]}
            multiline
            maxLength={160}
            accessibilityLabel="Biographie"
          />
          <AppText variant="caption" color={colors.textFaint} align="right">
            {bio.length}/160
          </AppText>
        </View>

        <Button
          label="Enregistrer"
          onPress={() => void handleSave()}
          disabled={!canSave}
          loading={isSaving}
        />
      </ScrollView>
    </KeyboardAvoidingView>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerSpacer: {
    width: 22,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  avatarRow: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  field: {
    gap: spacing.xs,
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: 15,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
});
