import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';

import { bundledMediaKeys, getBundledVideoModule } from '@/constants/media';
import { useAppStore } from '@/store/appStore';
import { normalizeTag } from '@/utils/format';

/** Vidéo prête à être publiée (fichier déjà copié dans le stockage de l'app). */
export interface PickedVideo {
  uri: string;
  durationSec: number;
  name: string;
  isDemo: boolean;
}

function sanitizeFileName(name: string): string {
  const base = name.split('/').pop() ?? 'video.mp4';
  return base.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-60);
}

/**
 * Copie la vidéo choisie dans le répertoire documents de l'application :
 * le fichier reste lisible après un redémarrage (un URI de cache peut expirer).
 */
async function persistVideoFile(uri: string, fileName: string): Promise<string> {
  try {
    const directory = `${FileSystem.documentDirectory ?? ''}videos/`;
    const info = await FileSystem.getInfoAsync(directory);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    }
    const target = `${directory}${Date.now()}-${sanitizeFileName(fileName)}`;
    await FileSystem.copyAsync({ from: uri, to: target });
    return target;
  } catch (error) {
    console.warn('[AfriVibe] Copie de la vidéo impossible, utilisation de l’URI source :', error);
    return uri;
  }
}

interface PublishPayload {
  description: string;
  tags: string[];
}

/**
 * Ouverture de la galerie, copie du fichier et publication.
 *
 * ⚠️ Limite assumée : sans backend, la vidéo n'est PAS envoyée sur un serveur.
 * Elle est stockée dans le stockage local de l'application et n'est visible
 * que par l'utilisateur de cet appareil.
 */
export function useVideoPublisher() {
  const publish = useAppStore((state) => state.publish);
  const showToast = useAppStore((state) => state.showToast);
  const [picked, setPicked] = useState<PickedVideo | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const pickFromLibrary = async (): Promise<PickedVideo | null> => {
    setIsPicking(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showToast('Accès à la galerie refusé');
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        quality: 1,
        videoMaxDuration: 60,
        allowsEditing: false,
      });

      if (result.canceled) {
        return null;
      }

      const asset = result.assets[0];
      if (!asset) {
        showToast('Aucune vidéo sélectionnée');
        return null;
      }

      const uri = await persistVideoFile(asset.uri, asset.fileName ?? 'afrivibe.mp4');
      const value: PickedVideo = {
        uri,
        durationSec: Math.round((asset.duration ?? 0) / 1000),
        name: asset.fileName ?? 'afrivibe.mp4',
        isDemo: false,
      };
      setPicked(value);
      return value;
    } catch (error) {
      console.warn('[AfriVibe] Sélection vidéo impossible :', error);
      showToast('Impossible d’ouvrir la galerie');
      return null;
    } finally {
      setIsPicking(false);
    }
  };

  /** Utilise une vidéo de démonstration embarquée (utile sans galerie). */
  const pickDemoClip = async (): Promise<PickedVideo | null> => {
    const keys = bundledMediaKeys();
    const key = keys[Math.floor(Math.random() * Math.max(keys.length, 1))];
    if (!key) {
      showToast('Aucune vidéo de démo disponible');
      return null;
    }
    const module = getBundledVideoModule(key);
    if (module === null) {
      showToast('Aucune vidéo de démo disponible');
      return null;
    }

    try {
      const asset = Asset.fromModule(module);
      await asset.downloadAsync();
      const localUri = asset.localUri ?? asset.uri;
      const uri = await persistVideoFile(localUri, `${key}.mp4`);
      const value: PickedVideo = {
        uri,
        durationSec: 5,
        name: `${key}.mp4`,
        isDemo: true,
      };
      setPicked(value);
      return value;
    } catch (error) {
      console.warn('[AfriVibe] Vidéo de démo indisponible :', error);
      showToast('Vidéo de démo indisponible');
      return null;
    }
  };

  const clearPicked = () => setPicked(null);

  const submit = async ({ description, tags }: PublishPayload): Promise<boolean> => {
    if (!picked) {
      showToast('Choisissez d’abord une vidéo');
      return false;
    }
    if (!description.trim()) {
      showToast('Ajoutez une légende');
      return false;
    }

    setIsPublishing(true);
    try {
      const cleanedTags = Array.from(new Set(tags.map(normalizeTag).filter(Boolean)));
      const video = await publish({
        description,
        tags: cleanedTags,
        videoUri: picked.uri,
        durationSec: picked.durationSec,
      });
      if (!video) {
        return false;
      }
      setPicked(null);
      return true;
    } finally {
      setIsPublishing(false);
    }
  };

  return {
    picked,
    isPicking,
    isPublishing,
    pickFromLibrary,
    pickDemoClip,
    clearPicked,
    submit,
  };
}
