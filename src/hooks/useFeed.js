import { useCallback, useEffect, useRef, useState } from 'react';

import { feed as feedApi, posts as postsApi } from '../api/endpoints';

const SURFACES = {
  home: feedApi.home,
  explore: feedApi.explore,
  trending: feedApi.trending,
};

/**
 * Loads a ranked feed surface and owns its optimistic like/save state.
 *
 * The API returns items as { post, reason, score }; screens only need the post
 * plus the ranking reason, so that shape is flattened once here.
 */
export function useFeed(surface = 'home', { limit = 20 } = {}) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const load = useCallback(
    async ({ refresh = false } = {}) => {
      const fetcher = SURFACES[surface] ?? SURFACES.home;
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);
      try {
        const page = await fetcher(limit);
        if (!mounted.current) return;
        setItems(
          (page?.items ?? []).map(entry => ({
            ...entry.post,
            reason: entry.reason ?? null,
          })),
        );
      } catch (err) {
        if (!mounted.current) return;
        setError(err);
      } finally {
        if (!mounted.current) return;
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [surface, limit],
  );

  useEffect(() => {
    load();
  }, [load]);

  /**
   * Applies the like locally first so the tap feels instant, and rolls the
   * exact previous item back if the request fails.
   */
  const toggleLike = useCallback(async postId => {
    let previous = null;
    setItems(current =>
      current.map(item => {
        if (item.id !== postId) return item;
        previous = item;
        const hasLiked = !item.viewer.hasLiked;
        return {
          ...item,
          viewer: { ...item.viewer, hasLiked },
          counts: {
            ...item.counts,
            likes: Math.max(0, item.counts.likes + (hasLiked ? 1 : -1)),
          },
        };
      }),
    );
    if (!previous) return;
    try {
      if (previous.viewer.hasLiked) await postsApi.unlike(postId);
      else await postsApi.like(postId);
    } catch {
      setItems(current => current.map(item => (item.id === postId ? previous : item)));
    }
  }, []);

  const toggleSave = useCallback(async postId => {
    let previous = null;
    setItems(current =>
      current.map(item => {
        if (item.id !== postId) return item;
        previous = item;
        const hasSaved = !item.viewer.hasSaved;
        return {
          ...item,
          viewer: { ...item.viewer, hasSaved },
          counts: {
            ...item.counts,
            saves: Math.max(0, item.counts.saves + (hasSaved ? 1 : -1)),
          },
        };
      }),
    );
    if (!previous) return;
    try {
      if (previous.viewer.hasSaved) await postsApi.unsave(postId);
      else await postsApi.save(postId);
    } catch {
      setItems(current => current.map(item => (item.id === postId ? previous : item)));
    }
  }, []);

  return {
    items,
    isLoading,
    isRefreshing,
    error,
    refresh: () => load({ refresh: true }),
    reload: load,
    toggleLike,
    toggleSave,
  };
}

export default useFeed;
