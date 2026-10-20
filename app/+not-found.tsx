import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { colors } from '@/constants/theme';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <EmptyState
        icon="compass-outline"
        title="Page introuvable"
        description="Cet écran n’existe pas ou a été déplacé."
        actionLabel="Retour au fil"
        onAction={() => router.replace('/')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
