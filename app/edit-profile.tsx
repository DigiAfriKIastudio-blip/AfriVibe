import { useRouter } from 'expo-router';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
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
  const [avatarUri, setAvatarUri] = useState(me?.avatarUri ?? null);
  const [isPickingPhoto, setIsPickingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const canSave = displayName.trim().length > 0 && !isSaving;

  const handlePickPhoto = async () => {
    setIsPickingPhoto(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (result.canceled || !result.assets[0]) return;
      const source = result.assets[0].uri;
      const directory = `${FileSystem.documentDirectory ?? ''}profile/`;
      const info = await FileSystem.getInfoAsync(directory);
      if (!info.exists) await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
      const destination = `${directory}avatar-${Date.now()}.jpg`;
      await FileSystem.copyAsync({ from: source, to: destination });
      setAvatarUri(destination);
    } catch (error) {
      console.warn('[AfriVibe] Photo de profil impossible à sélectionner :', error);
    } finally {
      setIsPickingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!canSave) {
      return;
    }
    setIsSaving(true);
    await updateProfile({ displayName, bio, avatarUri });
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
            <Avatar profile={{ ...me, displayName: displayName || me.displayName, avatarUri }} size={88} />
            <Button label={isPickingPhoto ? 'Ouverture de la galerie…' : 'Changer la photo'} variant="secondary" compact onPress={() => void handlePickPhoto()} disabled={isPickingPhoto} icon="image-outline" />
            <AppText variant="caption" color={colors.textFaint} align="center">
              Choisis une photo carrée dans ta galerie. Elle sera conservée sur cet appareil.
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
