import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { colors, radii, spacing } from '@/constants/theme';
import { useAppStore } from '@/store/appStore';

interface CommentComposerProps {
  videoId: string;
  placeholder?: string;
}

const MAX_LENGTH = 500;

/** Saisie d'un commentaire ; envoie réellement et vide le champ. */
export function CommentComposer({ videoId, placeholder = 'Ajouter un commentaire…' }: CommentComposerProps) {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const insets = useSafeAreaInsets();
  const addComment = useAppStore((state) => state.addComment);
  const currentProfileId = useAppStore((state) => state.currentProfileId);
  const me = useAppStore((state) => state.profiles[state.currentProfileId]);

  const canSend = text.trim().length > 0 && !isSending;

  const handleSend = async () => {
    if (!canSend) {
      return;
    }
    setIsSending(true);
    const value = text;
    setText('');
    await addComment(videoId, value);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSending(false);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <Avatar
          profile={me ?? { displayName: 'Moi', username: 'moi', avatarColor: colors.surfaceMuted }}
          size={36}
        />
        <View style={styles.inputWrapper}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={placeholder}
            placeholderTextColor={colors.textFaint}
            style={styles.input}
            multiline
            maxLength={MAX_LENGTH}
            accessibilityLabel="Champ de commentaire"
            onSubmitEditing={() => void handleSend()}
            blurOnSubmit={false}
          />
          {text.length > 0 ? (
            <AppText variant="caption" color={colors.textFaint} style={styles.counter}>
              {text.length}/{MAX_LENGTH}
            </AppText>
          ) : null}
        </View>
        <Pressable
          onPress={() => void handleSend()}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel="Envoyer le commentaire"
          style={({ pressed }) => [
            styles.sendButton,
            canSend ? styles.sendActive : styles.sendDisabled,
            pressed && canSend ? styles.pressed : null,
          ]}
        >
          <Icon
            name="arrow-up"
            size={18}
            color={canSend ? colors.background : colors.textFaint}
          />
        </Pressable>
      </View>
      <AppText variant="caption" color={colors.textFaint} align="center" style={styles.hint}>
        {currentProfileId ? 'Vos commentaires sont enregistrés sur cet appareil.' : ''}
      </AppText>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 40,
    justifyContent: 'center',
  },
  input: {
    color: colors.text,
    fontSize: 15,
    maxHeight: 110,
    paddingTop: 0,
    paddingBottom: 0,
  },
  counter: {
    position: 'absolute',
    right: spacing.sm,
    bottom: 2,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendActive: {
    backgroundColor: colors.primary,
  },
  sendDisabled: {
    backgroundColor: colors.surfaceMuted,
  },
  pressed: {
    opacity: 0.7,
  },
  hint: {
    paddingBottom: spacing.xs,
    backgroundColor: colors.surface,
  },
});
