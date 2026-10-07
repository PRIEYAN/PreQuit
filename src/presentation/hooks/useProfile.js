import { useCallback } from 'react';

import { useUseCases } from '../container/DependencyProvider';
import { useAsyncResource } from './useAsyncResource';

export const useMyProfile = () => {
  const useCases = useUseCases();
  const loader = useCallback(() => useCases.loadMyProfile.execute(), [useCases]);
  const resource = useAsyncResource(loader);

  return {
    profile: resource.data,
    isLoading: resource.isLoading,
    isRefreshing: resource.isRefreshing,
    error: resource.error,
    refresh: resource.refresh,
  };
};

export default useMyProfile;
