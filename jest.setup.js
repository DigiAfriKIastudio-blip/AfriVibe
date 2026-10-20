/**
 * Mocks partagés par tous les tests.
 *
 * Les modules natifs Expo ne peuvent pas s'exécuter sous Node : on fournit
 * des doublures minimales mais *fonctionnelles* (pas de `no-op` silencieux),
 * afin que les tests vérifient de vrais comportements applicatifs.
 */

/* ------------------------------------------------------------------ */
/* Stockage local                                                      */
/* ------------------------------------------------------------------ */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

/* ------------------------------------------------------------------ */
/* Safe area                                                           */
/* ------------------------------------------------------------------ */
jest.mock(
  'react-native-safe-area-context',
  // Le mock officiel est exporté comme module ESM (`default`).
  () => require('react-native-safe-area-context/jest/mock').default
);

/* ------------------------------------------------------------------ */
/* Expo Router                                                         */
/* ------------------------------------------------------------------ */
jest.mock('expo-router', () => {
  const React = require('react');
  const { Text } = require('react-native');

  const router = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    navigate: jest.fn(),
    dismiss: jest.fn(),
    setParams: jest.fn(),
  };

  return {
    router,
    useRouter: () => router,
    useLocalSearchParams: () => ({}),
    usePathname: () => '/',
    useFocusEffect: (callback) => {
      // Doublure de test : exécute l'effet au montage uniquement.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      React.useEffect(callback, []);
    },
    Link: ({ children }) => React.createElement(Text, null, children),
    Redirect: () => null,
    Stack: Object.assign(({ children }) => React.createElement(Text, null, children), {
      Screen: () => null,
    }),
    Tabs: Object.assign(({ children }) => React.createElement(Text, null, children), {
      Screen: () => null,
    }),
  };
});

/* ------------------------------------------------------------------ */
/* Vidéo                                                               */
/* ------------------------------------------------------------------ */
jest.mock('expo-video', () => {
  const React = require('react');
  const { View } = require('react-native');

  const player = {
    play: jest.fn(),
    pause: jest.fn(),
    replace: jest.fn(),
    release: jest.fn(),
    muted: false,
    loop: true,
    playing: false,
    status: 'readyToPlay',
    currentTime: 0,
    duration: 5,
    addListener: jest.fn(() => ({ remove: jest.fn() })),
  };

  return {
    __playerMock: player,
    VideoView: (props) => React.createElement(View, { testID: 'video-view', ...props }),
    useVideoPlayer: () => player,
    createVideoPlayer: () => player,
    isPictureInPictureSupported: () => false,
  };
});

/* ------------------------------------------------------------------ */
/* Médias et UI                                                        */
/* ------------------------------------------------------------------ */
jest.mock('expo-image', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { Image: (props) => React.createElement(View, { testID: 'expo-image', ...props }) };
});

jest.mock('expo-blur', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { BlurView: (props) => React.createElement(View, props) };
});

jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { LinearGradient: (props) => React.createElement(View, props) };
});

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const Icon = ({ name }) => React.createElement(Text, null, `icon-${name}`);
  return { Ionicons: Icon, MaterialIcons: Icon, Feather: Icon };
});

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(() => Promise.resolve({ canceled: true, assets: null })),
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true, status: 'granted' })),
  MediaType: { videos: 'videos', images: 'images' },
  MediaTypeOptions: { Videos: 'videos', All: 'all' },
}));

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///documents/',
  cacheDirectory: 'file:///cache/',
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: false })),
  makeDirectoryAsync: jest.fn(() => Promise.resolve()),
  copyAsync: jest.fn(() => Promise.resolve()),
  deleteAsync: jest.fn(() => Promise.resolve()),
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
  readAsStringAsync: jest.fn(() => Promise.resolve('')),
}));

/* ------------------------------------------------------------------ */
/* Divers                                                              */
/* ------------------------------------------------------------------ */
jest.mock('expo-font', () => ({
  isLoaded: () => true,
  loadAsync: jest.fn(() => Promise.resolve()),
  useFonts: () => [true, null],
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: jest.fn(() => Promise.resolve()),
}));
