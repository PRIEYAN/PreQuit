/**
 * @format
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { useFeed } from '../src/hooks/useFeed';
import { feed as feedApi, posts as postsApi } from '../src/api/endpoints';

jest.mock('../src/api/endpoints', () => ({
  feed: { home: jest.fn(), explore: jest.fn(), trending: jest.fn() },
  posts: { like: jest.fn(), unlike: jest.fn(), save: jest.fn(), unsave: jest.fn() },
}));

/**
 * Minimal hook harness on react-test-renderer, which this project already uses.
 * Renders the hook in a null-returning component and exposes its latest return
 * value, so the assertions read the same way renderHook's `result.current` would.
 */
function renderHookValue(hook) {
  const ref = { current: null };
  const Probe = () => {
    ref.current = hook();
    return null;
  };
  let renderer;
  act(() => {
    renderer = ReactTestRenderer.create(<Probe />);
  });
  return { ref, unmount: () => act(() => renderer.unmount()) };
}

/** Lets queued promise callbacks and the resulting re-render flush. */
const flush = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
};

const item = (id, over = {}) => ({
  post: {
    id,
    author: { id: 'a1', handle: 'nova', displayName: 'Nova', avatarUrl: null },
    description: 'hello',
    media: [],
    topics: [],
    counts: { likes: 2, comments: 0, shares: 0, saves: 1 },
    viewer: { hasLiked: false, hasSaved: false, canEdit: false, canDelete: false },
    ...over,
  },
  reason: { kind: 'fresh', label: 'Recently posted' },
});

beforeEach(() => {
  jest.clearAllMocks();
  feedApi.home.mockResolvedValue({ items: [item('p1')] });
});

describe('useFeed', () => {
  it('flattens the API shape and keeps the ranking reason', async () => {
    const { ref: result } = renderHookValue(() => useFeed('home'));
    await flush();
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].id).toBe('p1');
    expect(result.current.items[0].reason.label).toBe('Recently posted');
  });

  it('loads the surface the caller asked for', async () => {
    feedApi.trending.mockResolvedValue({ items: [] });
    renderHookValue(() => useFeed('trending'));
    await flush();
    expect(feedApi.trending).toHaveBeenCalled();
    expect(feedApi.home).not.toHaveBeenCalled();
  });

  it('surfaces a load failure instead of showing an empty feed', async () => {
    feedApi.home.mockRejectedValue(new Error('boom'));
    const { ref: result } = renderHookValue(() => useFeed('home'));
    await flush();
    expect(result.current.error).toBeTruthy();
    expect(result.current.items).toHaveLength(0);
  });

  it('applies a like immediately, before the request resolves', async () => {
    let resolveLike;
    postsApi.like.mockReturnValue(new Promise(res => { resolveLike = res; }));
    const { ref: result } = renderHookValue(() => useFeed('home'));
    await flush();

    act(() => { result.current.toggleLike('p1'); });
    expect(result.current.items[0].viewer.hasLiked).toBe(true);
    expect(result.current.items[0].counts.likes).toBe(3);

    await act(async () => { resolveLike(); });
    expect(result.current.items[0].viewer.hasLiked).toBe(true);
  });

  it('rolls a like back when the request fails', async () => {
    postsApi.like.mockRejectedValue(new Error('offline'));
    const { ref: result } = renderHookValue(() => useFeed('home'));
    await flush();

    await act(async () => { await result.current.toggleLike('p1'); });
    expect(result.current.items[0].viewer.hasLiked).toBe(false);
    expect(result.current.items[0].counts.likes).toBe(2);
  });

  it('unlikes an already-liked post', async () => {
    feedApi.home.mockResolvedValue({
      items: [item('p1', { viewer: { hasLiked: true, hasSaved: false, canEdit: false, canDelete: false } })],
    });
    postsApi.unlike.mockResolvedValue(null);
    const { ref: result } = renderHookValue(() => useFeed('home'));
    await flush();

    await act(async () => { await result.current.toggleLike('p1'); });
    expect(postsApi.unlike).toHaveBeenCalledWith('p1');
    expect(result.current.items[0].counts.likes).toBe(1);
  });

  it('rolls a save back when the request fails', async () => {
    postsApi.save.mockRejectedValue(new Error('offline'));
    const { ref: result } = renderHookValue(() => useFeed('home'));
    await flush();

    await act(async () => { await result.current.toggleSave('p1'); });
    expect(result.current.items[0].viewer.hasSaved).toBe(false);
    expect(result.current.items[0].counts.saves).toBe(1);
  });

  it('never drives a count below zero', async () => {
    feedApi.home.mockResolvedValue({
      items: [
        item('p1', {
          counts: { likes: 0, comments: 0, shares: 0, saves: 0 },
          viewer: { hasLiked: true, hasSaved: false, canEdit: false, canDelete: false },
        }),
      ],
    });
    postsApi.unlike.mockResolvedValue(null);
    const { ref: result } = renderHookValue(() => useFeed('home'));
    await flush();

    await act(async () => { await result.current.toggleLike('p1'); });
    expect(result.current.items[0].counts.likes).toBe(0);
  });
});
