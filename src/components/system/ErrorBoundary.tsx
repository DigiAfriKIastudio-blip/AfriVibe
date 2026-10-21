import { Component, Fragment, type ErrorInfo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { colors, spacing } from '@/constants/theme';

/**
 * Garde-fou de rendu.
 *
 * Sans `ErrorBoundary`, la moindre exception pendant le rendu d'un écran
 * démonte tout l'arbre React : l'application reste alors figée sur le splash
 * (ou sur un écran vide), sans aucun moyen de réessayer. Ici, l'erreur est
 * capturée, journalisée, et l'utilisateur obtient un écran explicite avec un
 * bouton de reprise — ses données locales restant intactes.
 */

export interface ErrorFallbackProps {
  title?: string;
  description?: string;
  /** Message technique (erreur d'origine). */
  message?: string;
  retryLabel?: string;
  onRetry?: () => void;
  testID?: string;
}

export function ErrorFallback({
  title = 'Une erreur est survenue',
  description = 'Vos données locales (commentaires, favoris, abonnements, publications) ont été conservées.',
  message,
  retryLabel = 'Réessayer',
  onRetry,
  testID = 'app-error-fallback',
}: ErrorFallbackProps) {
  return (
    <View style={styles.container} testID={testID}>
      <Icon name="alert-circle-outline" size={40} color={colors.textMuted} />
      <AppText variant="title" align="center">
        {title}
      </AppText>
      <AppText variant="body" color={colors.textMuted} align="center">
        {description}
      </AppText>
      {message ? (
        <AppText variant="caption" color={colors.textFaint} align="center">
          {message}
        </AppText>
      ) : null}
      {onRetry ? <Button label={retryLabel} onPress={onRetry} /> : null}
    </View>
  );
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  /** Appelé après capture (journalisation, masquage du splash…). */
  onError?: (error: Error) => void;
  title?: string;
  description?: string;
  retryLabel?: string;
  testID?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
  /** Incrémenté à chaque reprise : force le remontage du sous-arbre. */
  attempt: number;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null, attempt: 0 };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[AfriVibe] Erreur de rendu interceptée :', error, info.componentStack);
    this.props.onError?.(error);
  }

  handleRetry = (): void => {
    this.setState((state) => ({ error: null, attempt: state.attempt + 1 }));
  };

  render(): ReactNode {
    const { error, attempt } = this.state;
    const { children, title, description, retryLabel, testID } = this.props;

    if (error) {
      return (
        <ErrorFallback
          title={title}
          description={description}
          message={error.message}
          retryLabel={retryLabel}
          onRetry={this.handleRetry}
          testID={testID}
        />
      );
    }

    return <Fragment key={attempt}>{children}</Fragment>;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
});
