import AsyncStorage from '@react-native-async-storage/async-storage';

import { __resetDatabaseForTests, flushDatabase, loadDatabase, resetDatabase } from '../database';
import { localDataSource } from '../localDataSource';

/**
 * Ces tests exercent la vraie implémentation locale (AsyncStorage est une
 * doublure en mémoire fournie par le paquet officiel).
 */

describe('localDataSource', () => {
  beforeEach(async () => {
    __resetDatabaseForTests();
    await AsyncStorage.clear();
    await resetDatabase();
  });

  describe('fil', () => {
    it('pagine les vidéos par ordre antéchronologique', async () => {
      const firstPage = await localDataSource.videos.listFeed({ limit: 2 });
      expect(firstPage.items).toHaveLength(2);
      expect(firstPage.nextCursor).toBe('2');

      const secondPage = await localDataSource.videos.listFeed({ cursor: '2', limit: 2 });
      expect(secondPage.items).toHaveLength(2);
      expect(secondPage.items[0]?.id).not.toBe(firstPage.items[0]?.id);
    });

    it('retourne null comme curseur sur la dernière page', async () => {
      const page = await localDataSource.videos.listFeed({ limit: 100 });
      expect(page.nextCursor).toBeNull();
      expect(page.items.length).toBeGreaterThan(0);
    });
  });

  describe('j’aime et favoris', () => {
    it('incrémente puis décrémente le compteur de j’aime', async () => {
      const before = await localDataSource.videos.getById('v_1');
      expect(before).not.toBeNull();

      const liked = await localDataSource.interactions.toggleLike('v_1');
      expect(liked.liked).toBe(true);
      expect(liked.video.stats.likes).toBe((before?.stats.likes ?? 0) + 1);

      const unliked = await localDataSource.interactions.toggleLike('v_1');
      expect(unliked.liked).toBe(false);
      expect(unliked.video.stats.likes).toBe(before?.stats.likes);
    });

    it('persiste les favoris après rechargement', async () => {
      await localDataSource.interactions.toggleSave('v_4');
      await flushDatabase();

      __resetDatabaseForTests();
      const reloaded = await loadDatabase();
      expect(reloaded.interactions.savedVideoIds).toContain('v_4');
    });

    it('refuse une vidéo inconnue', async () => {
      await expect(localDataSource.interactions.toggleLike('v_inexistant')).rejects.toThrow(
        'Vidéo introuvable'
      );
    });
  });

  describe('abonnements', () => {
    it('met à jour les deux compteurs', async () => {
      const meBefore = await localDataSource.profiles.getById('p_amina');
      const targetBefore = await localDataSource.profiles.getById('p_sanaa');

      const result = await localDataSource.interactions.toggleFollow('p_sanaa');
      expect(result.following).toBe(true);
      expect(result.profile.stats.followers).toBe((targetBefore?.stats.followers ?? 0) + 1);

      const meAfter = await localDataSource.profiles.getById('p_amina');
      expect(meAfter?.stats.following).toBe((meBefore?.stats.following ?? 0) + 1);
    });

    it('interdit de s’abonner à soi-même', async () => {
      await expect(localDataSource.interactions.toggleFollow('p_amina')).rejects.toThrow(
        'votre propre profil'
      );
    });
  });

  describe('commentaires', () => {
    it('ajoute un commentaire et met à jour le compteur', async () => {
      const videoBefore = await localDataSource.videos.getById('v_2');
      const created = await localDataSource.comments.add('v_2', 'p_amina', '  Super vidéo  ');

      expect(created.text).toBe('Super vidéo');
      const list = await localDataSource.comments.listByVideo('v_2');
      expect(list[0]?.id).toBe(created.id);

      const videoAfter = await localDataSource.videos.getById('v_2');
      expect(videoAfter?.stats.comments).toBe((videoBefore?.stats.comments ?? 0) + 1);
    });

    it('refuse un commentaire vide', async () => {
      await expect(localDataSource.comments.add('v_2', 'p_amina', '   ')).rejects.toThrow(
        'commentaire est vide'
      );
    });

    it('autorise la suppression de son propre commentaire', async () => {
      const created = await localDataSource.comments.add('v_2', 'p_amina', 'À supprimer');
      await localDataSource.comments.remove(created.id);
      const list = await localDataSource.comments.listByVideo('v_2');
      expect(list.find((item) => item.id === created.id)).toBeUndefined();
    });

    it('interdit la suppression du commentaire d’un autre', async () => {
      const list = await localDataSource.comments.listByVideo('v_4');
      const foreign = list.find((item) => item.authorId !== 'p_amina');
      expect(foreign).toBeDefined();

      await expect(localDataSource.comments.remove(foreign!.id)).rejects.toThrow(
        'vos propres commentaires'
      );
    });

    it('aime un commentaire une seule fois', async () => {
      const result = await localDataSource.comments.toggleLike('c_3');
      expect(result.liked).toBe(true);
      expect(result.comment.likes).toBeGreaterThan(0);

      const unliked = await localDataSource.comments.toggleLike('c_3');
      expect(unliked.liked).toBe(false);
    });
  });

  describe('publication', () => {
    it('crée une vidéo locale visible dans le profil', async () => {
      const created = await localDataSource.videos.create('p_amina', {
        description: 'Ma nouvelle vidéo',
        tags: ['MBour', 'dakar'],
        videoUri: 'file:///documents/videos/test.mp4',
        durationSec: 12,
      });

      expect(created.isLocalUpload).toBe(true);
      expect(created.tags).toEqual(['mbour', 'dakar']);
      expect(created.video).toEqual({ kind: 'file', uri: 'file:///documents/videos/test.mp4' });

      const mine = await localDataSource.videos.listByAuthor('p_amina');
      expect(mine[0]?.id).toBe(created.id);
    });
  });

  describe('recherche', () => {
    it('trouve des vidéos par hashtag', async () => {
      const result = await localDataSource.videos.search('amapiano');
      expect(result.videos.map((video) => video.id)).toContain('v_3');
    });

    it('trouve des profils par nom d’utilisateur', async () => {
      const result = await localDataSource.videos.search('sanaa');
      expect(result.profiles.map((profile) => profile.username)).toContain('sanaa.casa');
    });

    it('agrège les hashtags même sans requête', async () => {
      const result = await localDataSource.videos.search('');
      expect(result.tags.length).toBeGreaterThan(0);
      expect(result.videos.length).toBeGreaterThan(0);
    });
  });

  describe('notifications', () => {
    it('marque toutes les notifications comme lues', async () => {
      const before = await localDataSource.notifications.list();
      expect(before.some((notification) => !notification.read)).toBe(true);

      const after = await localDataSource.notifications.markAllRead();
      expect(after.every((notification) => notification.read)).toBe(true);

      const unread = (await localDataSource.notifications.list()).filter((item) => !item.read);
      expect(unread).toHaveLength(0);
    });
  });
});
