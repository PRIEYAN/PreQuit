import { useCallback } from 'react';

import { useUseCases } from '../container/DependencyProvider';
import { useAsyncResource } from './useAsyncResource';
import { useSession } from './useSession';

export const useConversations = () => {
  const useCases = useUseCases();
  const { viewerId } = useSession();

  const loader = useCallback(
    () => useCases.loadConversations.execute({ viewerId }),
    [useCases, viewerId],
  );

  const resource = useAsyncResource(loader, { initialData: [], deps: [viewerId] });

  return {
    conversations: resource.data ?? [],
    isLoading: resource.isLoading,
    isRefreshing: resource.isRefreshing,
    error: resource.error,
    refresh: resource.refresh,
  };
};

export default useConversations;
