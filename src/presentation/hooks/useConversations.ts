import { useCallback } from 'react';

import { useUseCases } from '../container/DependencyProvider';
import { useAsyncResource } from './useAsyncResource';
import { useSession } from './useSession';
import type { Conversation } from '../../domain/entities/Conversation';

export interface ConversationsViewModel {
  readonly conversations: readonly Conversation[];
  readonly isLoading: boolean;
  readonly isRefreshing: boolean;
  readonly error: unknown;
  refresh(): Promise<void>;
}

export const useConversations = (): ConversationsViewModel => {
  const useCases = useUseCases();
  const { viewerId } = useSession();

  const loader = useCallback(
    () => useCases.loadConversations.execute({ viewerId }),
    [useCases, viewerId],
  );

  const resource = useAsyncResource<readonly Conversation[]>(loader, {
    initialData: [],
    deps: [viewerId],
  });

  return {
    conversations: resource.data ?? [],
    isLoading: resource.isLoading,
    isRefreshing: resource.isRefreshing,
    error: resource.error,
    refresh: resource.refresh,
  };
};

export default useConversations;
