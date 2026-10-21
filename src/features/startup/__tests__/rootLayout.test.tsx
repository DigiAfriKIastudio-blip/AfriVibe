import { act, fireEvent, render } from '@testing-library/react-native';
import * as SplashScreen from 'expo-splash-screen';

import { STARTUP_TIMEOUTS } from '@/constants/startup';
import { useAppStore } from '@/store/appStore';

import RootLayout from '../../../../app/_layout';

/**
 * Test d'intégration du layout racine : le splash est masqué dès le montage,
 * le chargement est visible, l'écran d'erreur est atteignable, et un
 * démarrage trop long finit toujours par proposer une action.
 */

const realHydrate = useAppStore.getState().hydrate;

describe('RootLayout — démarrage', () => {
  beforeEach(() => {
    useAppStore.setState({ status: 'loading', error: null, toast: null });
  });

  afterEach(() => {
    jest.useRealTimers();
    useAppStore.setState({ hydrate: realHydrate });
  });

  it('masque le splash et affiche l’écran de chargement', async () => {
    const hydrate = jest.fn(() => new Promise<void>(() => undefined));
    useAppStore.setState({ hydrate, status: 'loading' });

    const view = await render(<RootLayout />);

    expect(view.getByTestId('startup-loading')).toBeTruthy();
    expect(SplashScreen.hideAsync).toHaveBeenCalled();
    expect(hydrate).toHaveBeenCalledTimes(1);
  });

  it('affiche un écran d’erreur exploitable avec un bouton de reprise', async () => {
    const hydrate = jest.fn(async () => undefined);
    useAppStore.setState({ hydrate, status: 'error', error: 'Stockage local indisponible' });

    const view = await render(<RootLayout />);

    expect(view.getByTestId('startup-error')).toBeTruthy();
    expect(view.getByText('Stockage local indisponible')).toBeTruthy();
    expect(view.getByText('Réessayer')).toBeTruthy();
  });

  it('propose une reprise quand le chargement dépasse le délai de sécurité', async () => {
    // `setImmediate`/microtâches restent réels : React continue de rendre.
    jest.useFakeTimers({ doNotFake: ['queueMicrotask', 'setImmediate', 'nextTick'] });
    const hydrate = jest.fn(async () => undefined);
    useAppStore.setState({ hydrate, status: 'loading' });

    const view = await render(<RootLayout />);
    expect(view.queryByText('Réessayer')).toBeNull();

    await act(async () => {
      jest.advanceTimersByTime(STARTUP_TIMEOUTS.startupWatchdog);
    });

    expect(view.getByText(/Le démarrage prend plus de temps que prévu/)).toBeTruthy();
    await fireEvent.press(view.getByText('Réessayer'));
    expect(hydrate).toHaveBeenCalledTimes(2);
  });

  it('rend la navigation une fois les données prêtes', async () => {
    const hydrate = jest.fn(async () => undefined);
    useAppStore.setState({ hydrate, status: 'ready' });

    const view = await render(<RootLayout />);

    expect(useAppStore.getState().status).toBe('ready');
    expect(view.queryByTestId('startup-loading')).toBeNull();
    expect(view.queryByTestId('startup-error')).toBeNull();
  });
});
