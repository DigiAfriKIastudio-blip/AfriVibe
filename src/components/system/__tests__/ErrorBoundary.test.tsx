import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { ErrorBoundary, ErrorFallback } from '../ErrorBoundary';

/**
 * Sans garde-fou, une exception de rendu démonte tout l'arbre React : écran
 * blanc/logo figé, sans recours. On vérifie ici qu'un écran de reprise
 * s'affiche et que « Réessayer » remonte bien l'interface.
 *
 * Note : depuis react-native-testing-library v14, `render` et `fireEvent`
 * sont asynchrones.
 */

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('affiche un écran de reprise au lieu d’un écran vide', async () => {
    const onError = jest.fn();

    function Bomb(): React.ReactElement {
      throw new Error('Boom de rendu');
    }

    const view = await render(
      <ErrorBoundary onError={onError}>
        <Bomb />
      </ErrorBoundary>
    );

    expect(view.getByTestId('app-error-fallback')).toBeTruthy();
    expect(view.getByText('Boom de rendu')).toBeTruthy();
    expect(view.getByText('Réessayer')).toBeTruthy();
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('remonte le sous-arbre après « Réessayer »', async () => {
    let shouldThrow = true;

    function Unstable(): React.ReactElement {
      if (shouldThrow) {
        throw new Error('Boom transitoire');
      }
      return <Text>Contenu rétabli</Text>;
    }

    const view = await render(
      <ErrorBoundary>
        <Unstable />
      </ErrorBoundary>
    );

    expect(view.getByText('Boom transitoire')).toBeTruthy();

    shouldThrow = false;
    await fireEvent.press(view.getByText('Réessayer'));

    expect(view.getByText('Contenu rétabli')).toBeTruthy();
  });

  it('expose un écran de secours réutilisable', async () => {
    const onRetry = jest.fn();
    const view = await render(
      <ErrorFallback title="Écran indisponible" message="Détail technique" onRetry={onRetry} />
    );

    await fireEvent.press(view.getByText('Réessayer'));

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(view.getByText('Écran indisponible')).toBeTruthy();
  });
});
