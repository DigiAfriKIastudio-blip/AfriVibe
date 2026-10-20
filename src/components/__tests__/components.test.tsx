import { fireEvent, render } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { CommentItem } from '@/components/comments/CommentItem';
import { FeedList } from '@/components/feed/FeedList';
import { AppText } from '@/components/ui/AppText';
import { IconButton } from '@/components/ui/IconButton';
import { useAppStore } from '@/store/appStore';
import type { Comment, Profile, Video } from '@/types/entities';

const author: Profile = {
  id: 'p_test',
  username: 'testeur',
  displayName: 'Testeur AfriVibe',
  bio: '',
  avatarColor: '#FF6B35',
  isVerified: false,
  stats: { followers: 10, following: 2, likes: 0 },
  createdAt: '2026-01-01T00:00:00.000Z',
};

const video: Video = {
  id: 'v_test',
  authorId: author.id,
  description: 'Une vidéo de test',
  video: null,
  poster: null,
  durationSec: 5,
  soundName: 'Son de test',
  tags: ['test'],
  stats: { likes: 12, comments: 3, shares: 1, saves: 0, views: 100 },
  createdAt: '2026-01-01T00:00:00.000Z',
  isLocalUpload: false,
};

const comment: Comment = {
  id: 'c_test',
  videoId: video.id,
  authorId: author.id,
  text: 'Commentaire de test',
  likes: 4,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const wrap = (node: ReactElement) => render(<SafeAreaProvider>{node}</SafeAreaProvider>);

describe('IconButton', () => {
  it('affiche un compteur formaté et réagit au clic', async () => {
    const onPress = jest.fn();
    const screen = await render(
      <IconButton name="heart" count={12840} onPress={onPress} accessibilityLabel="J'aime" />
    );

    expect(screen.getByText('12.8 k')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("J'aime"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('AppText', () => {
  it('rend le contenu fourni', async () => {
    const screen = await render(<AppText>Bonjour AfriVibe</AppText>);
    expect(screen.getByText('Bonjour AfriVibe')).toBeTruthy();
  });
});

describe('CommentItem', () => {
  it('affiche l’auteur et permet de liker', async () => {
    const onToggleLike = jest.fn();
    const screen = await render(
      <CommentItem
        comment={comment}
        author={author}
        liked={false}
        isOwn={false}
        onToggleLike={onToggleLike}
        onDelete={jest.fn()}
      />
    );

    expect(screen.getByText(/@testeur/)).toBeTruthy();
    expect(screen.getByText('Commentaire de test')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Aimer le commentaire'));
    expect(onToggleLike).toHaveBeenCalled();
  });

  it('propose la suppression uniquement sur ses propres commentaires', async () => {
    const screen = await render(
      <CommentItem
        comment={comment}
        author={author}
        liked={false}
        isOwn={false}
        onToggleLike={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    expect(screen.queryByLabelText('Supprimer mon commentaire')).toBeNull();
    await screen.unmount();

    const ownScreen = await render(
      <CommentItem
        comment={comment}
        author={author}
        liked
        isOwn
        onToggleLike={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    expect(ownScreen.getByLabelText('Supprimer mon commentaire')).toBeTruthy();
  });
});

describe('FeedList', () => {
  it('affiche un état vide quand aucune vidéo n’est disponible', async () => {
    const screen = await wrap(
      <FeedList
        videoIds={[]}
        height={600}
        emptyTitle="Aucune vidéo"
        emptyDescription="Publiez la première."
        onPressAuthor={jest.fn()}
      />
    );
    expect(screen.getByText('Aucune vidéo')).toBeTruthy();
  });

  it('affiche une vidéo du fil avec ses actions', async () => {
    useAppStore.setState((state) => ({
      ...state,
      status: 'ready',
      currentProfileId: 'p_test',
      profiles: { [author.id]: author },
      videos: { [video.id]: video },
      feedOrder: [video.id],
      interactions: {
        likedVideoIds: [],
        savedVideoIds: [],
        followingIds: [],
        likedCommentIds: [],
      },
    }));

    const screen = await wrap(
      <FeedList
        videoIds={[video.id]}
        height={600}
        emptyTitle="Aucune vidéo"
        emptyDescription="Publiez la première."
        onPressAuthor={jest.fn()}
      />
    );

    expect(screen.getByTestId('feed-list')).toBeTruthy();
    expect(screen.getByTestId(`feed-video-${video.id}`)).toBeTruthy();
    expect(screen.getByText(/@testeur/)).toBeTruthy();
    expect(screen.getByLabelText('Ouvrir les commentaires')).toBeTruthy();
    expect(screen.getByLabelText("J'aime cette vidéo")).toBeTruthy();
  });
});
