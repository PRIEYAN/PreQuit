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
  // Mirrors `items` so a toggle can read the pre-toggle post synchronously.
  // Reading it out of the setItems updater instead would be unsafe: React does
  // not promise the updater has run by the next statement, so the request could
  // be skipped entirely and the tap would silently never persist.
  const itemsRef = useRef([]);
  itemsRef.current = items;

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
   * Applies the change locally first so the tap feels instant, then calls the
   * API and restores the exact previous item if it fails.
   */
  const toggle = useCallback(async (postId, field, countKey, call) => {
    const previous = itemsRef.current.find(item => item.id === postId);
    if (!previous) return;
    const next = !previous.viewer[field];

    setItems(current =>
      current.map(item =>
        item.id === postId
          ? {
              ...item,
              viewer: { ...item.viewer, [field]: next },
              counts: {
                ...item.counts,
                [countKey]: Math.max(0, item.counts[countKey] + (next ? 1 : -1)),
              },
            }
          : item,
      ),
    );

    try {
      await call(postId, previous.viewer[field]);
    } catch {
      setItems(current => current.map(item => (item.id === postId ? previous : item)));
    }
  }, []);

  const toggleLike = useCallback(
    postId => toggle(postId, 'hasLiked', 'likes', (id, wasSet) => (wasSet ? postsApi.unlike(id) : postsApi.like(id))),
    [toggle],
  );

  const toggleSave = useCallback(
    postId => toggle(postId, 'hasSaved', 'saves', (id, wasSet) => (wasSet ? postsApi.unsave(id) : postsApi.save(id))),
    [toggle],
  );

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
