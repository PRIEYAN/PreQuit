import { useCallback, useRef, useState } from 'react';

import { useUseCases } from '../container/DependencyProvider';
import { useAsyncResource } from './useAsyncResource';
import {
  FeedSurface,
  type FeedSurfaceValue,
} from '../../domain/repositories/FeedRepository';
import { withLikeToggled, withSaveToggled, type Post } from '../../domain/entities/Post';
import type { Page } from '../../domain/repositories/common';

export interface FeedViewModel {
  readonly items: readonly Post[];
  readonly isLoading: boolean;
  readonly isRefreshing: boolean;
  readonly error: unknown;
  refresh(): Promise<void>;
  reload(): Promise<void>;
  toggleLike(postId: string): Promise<void>;
  toggleSave(postId: string): Promise<void>;
}

export const useFeed = (
  surface: FeedSurfaceValue = FeedSurface.HOME,
  options: { limit?: number } = {},
): FeedViewModel => {
  const { limit = 20 } = options;
  const useCases = useUseCases();
  const [items, setItems] = useState<readonly Post[]>([]);
  const itemsRef = useRef<readonly Post[]>([]);
  itemsRef.current = items;

  const loader = useCallback(async (): Promise<Page<Post>> => {
    const page = await useCases.loadFeed.execute(surface, { limit });
    setItems(page.items);
    return page;
  }, [useCases, surface, limit]);

  const resource = useAsyncResource(loader, { deps: [surface, limit] });

  const applyOptimistic = useCallback(
    async (
      postId: string,
      transform: (post: Post) => Post,
      commit: (post: Post) => Promise<unknown>,
    ): Promise<void> => {
      const previous = itemsRef.current.find(item => item.id === postId);
      if (!previous) return;

      setItems(current => current.map(item => (item.id === postId ? transform(item) : item)));

      try {
        await commit(previous);
      } catch {
        setItems(current => current.map(item => (item.id === postId ? previous : item)));
      }
    },
    [],
  );

  const toggleLike = useCallback(
    (postId: string) =>
      applyOptimistic(postId, withLikeToggled, post => useCases.toggleLike.execute(post)),
    [applyOptimistic, useCases],
  );

  const toggleSave = useCallback(
    (postId: string) =>
      applyOptimistic(postId, withSaveToggled, post => useCases.toggleSave.execute(post)),
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
