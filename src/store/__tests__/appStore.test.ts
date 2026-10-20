import AsyncStorage from '@react-native-async-storage/async-storage';

import { __resetDatabaseForTests, resetDatabase } from '@/data/local/database';
import { useAppStore } from '../appStore';

/**
 * Vérifie que les actions de l'UI passent bien par la couche de données et
 * mettent l'état à jour de façon cohérente.
 */

describe('appStore', () => {
  beforeEach(async () => {
    __resetDatabaseForTests();
    await AsyncStorage.clear();
    await resetDatabase();
    useAppStore.setState({
      status: 'loading',
      error: null,
      toast: null,
      profiles: {},
      videos: {},
      feedOrder: [],
      feedCursor: null,
      comments: {},
      notifications: [],
    });
    await useAppStore.getState().hydrate();
  });

  it('hydrate l’état depuis la source locale', () => {
    const state = useAppStore.getState();
    expect(state.status).toBe('ready');
    expect(state.currentProfileId).toBe('p_amina');
    expect(state.feedOrder.length).toBeGreaterThan(0);
    expect(Object.keys(state.profiles).length).toBeGreaterThan(0);
    expect(state.notifications.length).toBeGreaterThan(0);
  });

  it('met à jour le compteur de j’aime dans le fil et dans les interactions', async () => {
    const before = useAppStore.getState().videos['v_2'];
    expect(before).toBeDefined();

    await useAppStore.getState().toggleLike('v_2');
    let state = useAppStore.getState();
    expect(state.interactions.likedVideoIds).toContain('v_2');
    expect(state.videos['v_2']?.stats.likes).toBe((before?.stats.likes ?? 0) + 1);

    await useAppStore.getState().toggleLike('v_2');
    state = useAppStore.getState();
    expect(state.interactions.likedVideoIds).not.toContain('v_2');
    expect(state.videos['v_2']?.stats.likes).toBe(before?.stats.likes);
  });

  it('suit et désuit un créateur', async () => {
    const followersBefore = useAppStore.getState().profiles['p_fatou']?.stats.followers ?? 0;

    await useAppStore.getState().toggleFollow('p_fatou');
    let state = useAppStore.getState();
    expect(state.interactions.followingIds).toContain('p_fatou');
    expect(state.profiles['p_fatou']?.stats.followers).toBe(followersBefore + 1);

    await useAppStore.getState().toggleFollow('p_fatou');
    state = useAppStore.getState();
    expect(state.interactions.followingIds).not.toContain('p_fatou');
    expect(state.profiles['p_fatou']?.stats.followers).toBe(followersBefore);
  });

  it('charge, ajoute et supprime des commentaires', async () => {
    await useAppStore.getState().loadComments('v_2');
    const initial = useAppStore.getState().comments['v_2'] ?? [];
    expect(initial.length).toBeGreaterThan(0);

    await useAppStore.getState().addComment('v_2', 'Nouveau commentaire');
    let comments = useAppStore.getState().comments['v_2'] ?? [];
    expect(comments[0]?.text).toBe('Nouveau commentaire');
    expect(comments[0]?.authorId).toBe('p_amina');

    const created = comments[0];
    expect(created).toBeDefined();
    await useAppStore.getState().deleteComment('v_2', created!.id);
    comments = useAppStore.getState().comments['v_2'] ?? [];
    expect(comments.find((item) => item.id === created!.id)).toBeUndefined();
  });

  it('publie une vidéo et l’ajoute en tête du fil', async () => {
    const created = await useAppStore.getState().publish({
      description: 'Test de publication',
      tags: ['test'],
      videoUri: 'file:///documents/videos/test.mp4',
      durationSec: 8,
    });

    expect(created).not.toBeNull();
    const state = useAppStore.getState();
    expect(state.feedOrder[0]).toBe(created?.id);
    expect(state.videos[created!.id]?.description).toBe('Test de publication');
    expect(state.toast).toContain('Publication');
  });

  it('met à jour le profil courant', async () => {
    await useAppStore.getState().updateProfile({ displayName: 'Amina D.', bio: 'Nouvelle bio' });
    const me = useAppStore.getState().profiles['p_amina'];
    expect(me?.displayName).toBe('Amina D.');
    expect(me?.bio).toBe('Nouvelle bio');
  });

  it('marque les notifications comme lues', async () => {
    await useAppStore.getState().markNotificationsRead();
    const state = useAppStore.getState();
    expect(state.notifications.every((notification) => notification.read)).toBe(true);
  });

  it('expose les sélecteurs dérivés', async () => {
    await useAppStore.getState().toggleSave('v_6');
    const state = useAppStore.getState();
    const saved = Object.keys(state.videos).filter((id) =>
      state.interactions.savedVideoIds.includes(id)
    );
    expect(saved.length).toBe(state.interactions.savedVideoIds.length);
  });
});
