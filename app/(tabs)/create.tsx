import { useRouter } from 'expo-router';
import { useBottomTabBarHeight } from 'expo-router/js-tabs';
import { useMemo, useState } from 'react';
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

import { VideoPreview } from '@/components/create/VideoPreview';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { colors, radii, spacing } from '@/constants/theme';
import { useVideoPublisher } from '@/features/publish/useVideoPublisher';
import { extractTags, normalizeTag } from '@/utils/format';

const MAX_DESCRIPTION = 300;

/** Écran de création d'une publication. */
export default function CreateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const { picked, isPicking, isPublishing, pickFromLibrary, pickDemoClip, clearPicked, submit } =
    useVideoPublisher();

  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');

  const tags = useMemo(() => {
    const typed = tagInput
      .split(/[,\s]+/)
      .map(normalizeTag)
      .filter(Boolean);
    return Array.from(new Set([...extractTags(description), ...typed]));
  }, [description, tagInput]);

  const canPublish = Boolean(picked) && description.trim().length > 0 && !isPublishing;

  const handlePublish = async () => {
    const success = await submit({ description, tags });
    if (success) {
      setDescription('');
      setTagInput('');
      router.replace('/');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.md, paddingBottom: tabBarHeight + spacing.xxl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <AppText variant="title">Créer</AppText>
          {picked ? (
            <Pressable
              onPress={clearPicked}
              accessibilityRole="button"
              accessibilityLabel="Retirer la vidéo sélectionnée"
              hitSlop={8}
            >
              <Icon name="close-circle-outline" size={24} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>

        {picked ? (
          <View style={styles.previewWrapper}>
            <VideoPreview uri={picked.uri} height={330} />
            <View style={styles.previewBadge}>
              <Icon name="checkmark-circle" size={14} color={colors.success} />
              <AppText variant="caption" weight="600">
                {picked.isDemo ? 'Vidéo de démo' : picked.name}
              </AppText>
            </View>
          </View>
        ) : (
          <View style={styles.pickerZone}>
            <Icon name="videocam-outline" size={40} color={colors.textMuted} />
            <AppText variant="subtitle" align="center">
              Choisissez une vidéo
            </AppText>
            <AppText variant="body" color={colors.textMuted} align="center">
              Depuis la galerie de votre téléphone, ou utilisez une vidéo de démonstration
              embarquée.
            </AppText>
            <View style={styles.pickerActions}>
              <Button
                label="Galerie"
                icon="images-outline"
                onPress={() => void pickFromLibrary()}
                loading={isPicking}
                disabled={isPublishing}
                compact
                style={styles.pickerButton}
              />
              <Button
                label="Vidéo de démo"
                icon="sparkles-outline"
                variant="secondary"
                onPress={() => void pickDemoClip()}
                disabled={isPicking || isPublishing}
                compact
                style={styles.pickerButton}
              />
            </View>
          </View>
        )}

        <View style={styles.field}>
          <AppText variant="label" weight="700">
            Légende
          </AppText>
          <TextInput
            value={description}
            onChangeText={(value) => setDescription(value.slice(0, MAX_DESCRIPTION))}
            placeholder="Décrivez votre vidéo, ajoutez des #hashtags…"
            placeholderTextColor={colors.textFaint}
            style={[styles.input, styles.textArea]}
            multiline
            maxLength={MAX_DESCRIPTION}
            accessibilityLabel="Légende de la vidéo"
          />
          <AppText variant="caption" color={colors.textFaint} align="right">
            {description.length}/{MAX_DESCRIPTION}
          </AppText>
        </View>

        <View style={styles.field}>
          <AppText variant="label" weight="700">
            Hashtags
          </AppText>
          <TextInput
            value={tagInput}
            onChangeText={setTagInput}
            placeholder="afrobeats, dakar, danse"
            placeholderTextColor={colors.textFaint}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Hashtags"
          />
          {tags.length > 0 ? (
            <View style={styles.tagsRow}>
              {tags.map((tag) => (
                <View key={tag} style={styles.tagChip}>
                  <AppText variant="caption" weight="600" color={colors.text}>
                    #{tag}
                  </AppText>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.notice}>
          <Icon name="information-circle-outline" size={16} color={colors.textMuted} />
          <AppText variant="caption" color={colors.textMuted} style={styles.noticeText}>
            Sans backend, la vidéo est enregistrée dans le stockage de cet appareil : elle
            apparaît dans votre fil et votre profil, mais n’est pas publiée sur Internet.
          </AppText>
        </View>

        <Button
          label={isPublishing ? 'Publication…' : 'Publier'}
          icon="arrow-up-circle-outline"
          onPress={() => void handlePublish()}
          disabled={!canPublish}
          loading={isPublishing}
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
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerZone: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  pickerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  pickerButton: {
    flexShrink: 1,
  },
  previewWrapper: {
    gap: spacing.sm,
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.pill,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
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
    minHeight: 96,
    textAlignVertical: 'top',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tagChip: {
    backgroundColor: 'rgba(255,107,53,0.16)',
    borderRadius: radii.pill,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
  },
  notice: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  noticeText: {
    flex: 1,
    lineHeight: 16,
  },
});
