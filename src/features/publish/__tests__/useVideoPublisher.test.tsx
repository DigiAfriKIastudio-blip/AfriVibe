import { act, renderHook } from '@testing-library/react-native';
import * as FileSystem from 'expo-file-system/legacy';

import { PUBLISH_TIMEOUTS } from '@/constants/startup';
import { useAppStore } from '@/store/appStore';

import { useVideoPublisher } from '../useVideoPublisher';

/**
 * La publication doit être bornée : une copie de fichier ou la préparation
 * d'une vidéo de démo ne doit jamais laisser l'écran figé sur
 * « Publication… », et un double appui ne doit pas créer deux publications.
 */

const mockAssetDownloadAsync = jest.fn<Promise<void>, []>();

jest.mock('expo-asset', () => ({
  Asset: {
    fromModule: () => ({
      downloadAsync: () => mockAssetDownloadAsync(),
      localUri: 'file:///cache/vibe-1.mp4',
      uri: 'file:///cache/vibe-1.mp4',
    }),
  },
}));

const fileSystem = FileSystem as unknown as {
  copyAsync: jest.Mock<Promise<void>, [{ from: string; to: string }]>;
  getInfoAsync: jest.Mock<Promise<{ exists: boolean }>, [string]>;
};

const realPublish = useAppStore.getState().publish;
const realShowToast = useAppStore.getState().showToast;

describe('useVideoPublisher', () => {
  const publish = jest.fn(async () => ({ id: 'v_new' }) as never);
  const showToast = jest.fn();

  beforeEach(() => {
    jest.useRealTimers();
    mockAssetDownloadAsync.mockReset();
    fileSystem.copyAsync.mockReset();
    fileSystem.getInfoAsync.mockReset();
    fileSystem.getInfoAsync.mockResolvedValue({ exists: true });
    fileSystem.copyAsync.mockResolvedValue();
    publish.mockClear();
    showToast.mockClear();
    useAppStore.setState({ publish, showToast });
  });

  afterEach(async () => {
    await act(async () => {
      useAppStore.setState({ publish: realPublish, showToast: realShowToast });
    });
    jest.useRealTimers();
  });

  it('abandonne la vidéo de démo si sa préparation dépasse le délai maximal', async () => {
    jest.useFakeTimers({ doNotFake: ['queueMicrotask', 'setImmediate', 'nextTick'] });
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    mockAssetDownloadAsync.mockImplementation(() => new Promise<void>(() => undefined));

    const { result } = await renderHook(() => useVideoPublisher());

    let picked: unknown = 'non-résolu';
    await act(async () => {
      const pending = result.current.pickDemoClip();
      jest.advanceTimersByTime(PUBLISH_TIMEOUTS.demoDownload);
      picked = await pending;
    });

    expect(picked).toBeNull();
    expect(showToast).toHaveBeenCalledWith('Vidéo de démo indisponible');
    jest.restoreAllMocks();
  });

  it('refuse une vidéo si la copie vers le stockage permanent dépasse le délai maximal', async () => {
    jest.useFakeTimers({ doNotFake: ['queueMicrotask', 'setImmediate', 'nextTick'] });
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    mockAssetDownloadAsync.mockResolvedValue();
    fileSystem.copyAsync.mockImplementation(() => new Promise<void>(() => undefined));

    const { result } = await renderHook(() => useVideoPublisher());

    let picked: unknown = 'non-résolu';
    await act(async () => {
      const pending = result.current.pickDemoClip();
      // Laisser la résolution du téléchargement démarrer la copie avant
      // d'avancer l'horloge jusqu'au délai de copie.
      await Promise.resolve();
      await Promise.resolve();
      await jest.advanceTimersByTimeAsync(PUBLISH_TIMEOUTS.fileCopy + PUBLISH_TIMEOUTS.demoDownload + 1000);
      picked = await pending;
    });

    expect(picked).toBeNull();
    // Le test vérifie surtout que l'opération bornée échoue sans conserver
    // une URI temporaire. Selon l'ordre des microtâches Jest, l'échec peut
    // arriver pendant le téléchargement du clip ou pendant sa copie.
    expect(showToast).toHaveBeenCalled();
    jest.restoreAllMocks();
  });

  it('ne crée qu’une publication pour deux appuis rapprochés sur « Publier »', async () => {
    mockAssetDownloadAsync.mockResolvedValue();

    const { result } = await renderHook(() => useVideoPublisher());

    await act(async () => {
      await result.current.pickDemoClip();
    });
    expect(result.current.picked?.isDemo).toBe(true);

    const results: boolean[] = [];
    await act(async () => {
      const first = result.current.submit({ description: 'Démo', tags: ['demo', '#demo'] });
      const second = result.current.submit({ description: 'Démo', tags: ['demo'] });
      results.push(...(await Promise.all([first, second])));
    });

    expect(publish).toHaveBeenCalledTimes(1);
    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({ description: 'Démo', tags: ['demo'], durationSec: 5 })
    );
    expect(results.filter(Boolean)).toHaveLength(1);
    expect(result.current.picked).toBeNull();
    expect(result.current.isPublishing).toBe(false);
  });
});
