import appConfig from '../../../../app.json';

/**
 * Garde-fou de configuration : Expo SDK 58 active le mode « edge-to-edge »
 * par défaut et n'accepte plus la clé `android.edgeToEdgeEnabled` (rejetée par
 * `expo-doctor`). Ce test empêche sa réintroduction accidentelle.
 */
describe('app.json', () => {
  const android = appConfig.expo.android as Record<string, unknown>;

  it('n’expose plus android.edgeToEdgeEnabled (rejeté par Expo SDK 58)', () => {
    expect(Object.keys(android)).not.toContain('edgeToEdgeEnabled');
    expect(android.edgeToEdgeEnabled).toBeUndefined();
  });

  it('conserve la configuration Android utile au build', () => {
    expect(android.package).toBe('com.afrivibe.app');
    expect(android.versionCode).toBe(1);
    expect(android.permissions).toEqual(['android.permission.INTERNET']);
  });

  it('conserve le splash configuré et le routeur Expo', () => {
    const plugins = appConfig.expo.plugins as unknown[];
    expect(plugins).toContain('expo-router');

    const splash = plugins.find(
      (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-splash-screen'
    ) as [string, Record<string, unknown>] | undefined;

    expect(splash?.[1]).toMatchObject({
      image: './assets/images/splash-icon.png',
      backgroundColor: '#0B0B0F',
    });
  });
});
