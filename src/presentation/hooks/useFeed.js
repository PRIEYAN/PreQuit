import { useCallback, useRef, useState } from 'react';

import { useUseCases } from '../container/DependencyProvider';
import { useAsyncResource } from './useAsyncResource';
import { FeedSurface } from '../../domain/repositories/FeedRepository';
import { withLikeToggled, withSaveToggled } from '../../domain/entities/Post';

export const useFeed = (surface = FeedSurface.HOME, { limit = 20 } = {}) => {
  const useCases = useUseCases();
  const [items, setItems] = useState([]);
  const itemsRef = useRef([]);
  itemsRef.current = items;

  const loader = useCallback(async () => {
    const page = await useCases.loadFeed.execute(surface, { limit });
    setItems(page.items);
    return page;
  }, [useCases, surface, limit]);

  const resource = useAsyncResource(loader, { deps: [surface, limit] });

  const applyOptimistic = useCallback(async (postId, transform, commit) => {
    const previous = itemsRef.current.find(item => item.id === postId);
    if (!previous) return;

    setItems(current => current.map(item => (item.id === postId ? transform(item) : item)));

    try {
      await commit(previous);
    } catch {
      setItems(current => current.map(item => (item.id === postId ? previous : item)));
    }
  }, []);

  const toggleLike = useCallback(
    postId => applyOptimistic(postId, withLikeToggled, post => useCases.toggleLike.execute(post)),
    [applyOptimistic, useCases],
  );

  const toggleSave = useCallback(
    postId => applyOptimistic(postId, withSaveToggled, post => useCases.toggleSave.execute(post)),
    [applyOptimistic, useCases],
  );

  return {
    items,
    isLoading: resource.isLoading,
    isRefreshing: resource.isRefreshing,
    error: resource.error,
    refresh: resource.refresh,
    reload: resource.reload,
    toggleLike,
    toggleSave,
  };
};

export default useFeed;
