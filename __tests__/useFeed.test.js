import { useFeed } from '../src/presentation/hooks/useFeed';
import { FeedSurface } from '../src/domain/repositories/FeedRepository';
import { renderHookValue, flush, actAsync } from '../test-support/renderHookValue';
import { createTestContainer, withContainer } from '../test-support/testContainer';
import { FakeFeedRepository, samplePost } from '../test-support/fakeRepositories';

const setup = (hook, container = createTestContainer()) => ({
  container,
  ...renderHookValue(hook, withContainer(container)),
});

describe('useFeed', () => {
  it('exposes the posts the repository returned, ranking reason included', async () => {
    const { ref } = setup(() => useFeed(FeedSurface.HOME));
    await flush();

    expect(ref.current.items).toHaveLength(1);
    expect(ref.current.items[0].id).toBe('p1');
    expect(ref.current.items[0].reason.label).toBe('Recently posted');
  });

  it('loads the surface the caller asked for', async () => {
    const { ref, container } = setup(() => useFeed(FeedSurface.TRENDING));
    await flush();

    expect(container.repositories.feed.calls[0].surface).toBe(FeedSurface.TRENDING);
    expect(ref.current.isLoading).toBe(false);
  });

  it('applies a like immediately and persists it', async () => {
    const { ref, container } = setup(() => useFeed());
    await flush();
    await actAsync(() => ref.current.toggleLike('p1'));

    expect(ref.current.items[0].viewer.hasLiked).toBe(true);
    expect(ref.current.items[0].counts.likes).toBe(3);
    expect(container.repositories.post.liked).toEqual(['p1']);
  });

  it('unlikes a post the viewer had already liked', async () => {
    const liked = samplePost('p1', {
      viewer: { hasLiked: true, hasSaved: false },
      counts: { likes: 5, comments: 0, shares: 0, saves: 0 },
    });
    const container = createTestContainer({ repositories: { feed: new FakeFeedRepository([liked]) } });
    const { ref } = setup(() => useFeed(), container);
    await flush();
    await actAsync(() => ref.current.toggleLike('p1'));

    expect(ref.current.items[0].viewer.hasLiked).toBe(false);
    expect(ref.current.items[0].counts.likes).toBe(4);
    expect(container.repositories.post.unliked).toEqual(['p1']);
  });

  it('rolls the post back when persisting the like fails', async () => {
    const container = createTestContainer();
    container.repositories.post.failOn.add('like');
    const { ref } = setup(() => useFeed(), container);
    await flush();
    await actAsync(() => ref.current.toggleLike('p1'));

    expect(ref.current.items[0].viewer.hasLiked).toBe(false);
    expect(ref.current.items[0].counts.likes).toBe(2);
  });

  it('toggles a save through the save use case', async () => {
    const { ref, container } = setup(() => useFeed());
    await flush();
    await actAsync(() => ref.current.toggleSave('p1'));

    expect(ref.current.items[0].viewer.hasSaved).toBe(true);
    expect(container.repositories.post.saved).toEqual(['p1']);
  });

  it('ignores a toggle for a post that is not loaded', async () => {
    const { ref, container } = setup(() => useFeed());
    await flush();
    await actAsync(() => ref.current.toggleLike('missing'));

    expect(container.repositories.post.liked).toEqual([]);
  });

  it('surfaces a load failure instead of throwing', async () => {
    const container = createTestContainer();
    container.repositories.feed.failure = new Error('boom');
    const { ref } = setup(() => useFeed(), container);
    await flush();

    expect(ref.current.error).toBeTruthy();
    expect(ref.current.items).toEqual([]);
  });
});
