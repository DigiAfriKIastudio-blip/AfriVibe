import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet, View } from 'react-native';

import { colors, radii } from '@/constants/theme';

interface VideoPreviewProps {
  uri: string;
  height?: number;
}

/** Aperçu en boucle de la vidéo sélectionnée avant publication. */
export function VideoPreview({ uri, height = 320 }: VideoPreviewProps) {
  const player = useVideoPlayer({ uri }, (instance) => {
    instance.loop = true;
    instance.muted = true;
  });

  return (
    <View style={[styles.container, { height }]}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
        surfaceType="textureView"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
});
