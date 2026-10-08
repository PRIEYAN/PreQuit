import { useCallback } from 'react';

import { useUseCases } from '../container/DependencyProvider';
import { useAsyncResource } from './useAsyncResource';
import type { User } from '../../domain/entities/User';

export interface ProfileViewModel {
  readonly profile: User | null;
  readonly isLoading: boolean;
  readonly isRefreshing: boolean;
  readonly error: unknown;
  refresh(): Promise<void>;
}

export const useMyProfile = (): ProfileViewModel => {
  const useCases = useUseCases();
  const loader = useCallback(() => useCases.loadMyProfile.execute(), [useCases]);
  const resource = useAsyncResource<User>(loader);

  return {
    profile: resource.data,
    isLoading: resource.isLoading,
    isRefreshing: resource.isRefreshing,
    error: resource.error,
    refresh: resource.refresh,
  };
};

export default useMyProfile;
