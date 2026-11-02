import { useCallback, useState } from 'react';

import { useUseCases } from '../container/DependencyProvider';
import { useAsyncResource } from './useAsyncResource';
import type { PrivacySettings, User } from '../../domain/entities/User';
import type { Post } from '../../domain/entities/Post';
import type { PostSort } from '../../domain/repositories/ProfileRepository';
import { messageOf } from '../../domain/errors/AppError';

export interface ProfileViewModel {
  readonly profile: User | null;
  readonly isLoading: boolean;
  readonly isRefreshing: boolean;
  readonly error: unknown;
  /** Set while either privacy mutation is in flight. */
  readonly isSavingPrivacy: boolean;
  readonly privacyError: string | null;
  refresh(): Promise<void>;
  setAccountPrivate(isPrivate: boolean): Promise<boolean>;
  updatePrivacy(patch: Partial<PrivacySettings>): Promise<boolean>;
}

export const useMyProfile = (): ProfileViewModel => {
  const useCases = useUseCases();
  const loader = useCallback(() => useCases.loadMyProfile.execute(), [useCases]);
  const resource = useAsyncResource<User>(loader);

  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);
  const [privacyError, setPrivacyError] = useState<string | null>(null);

  // Both mutators re-read the profile instead of patching local state, so the
  // screen can never show a privacy state the server did not accept.
  const mutate = useCallback(
    async (apply: () => Promise<unknown>): Promise<boolean> => {
      setIsSavingPrivacy(true);
      setPrivacyError(null);
      try {
        await apply();
        await resource.reload({ refresh: true });
        return true;
      } catch (caught) {
        setPrivacyError(messageOf(caught, 'Could not save that change'));
        return false;
      } finally {
        setIsSavingPrivacy(false);
      }
    },
    [resource],
  );

  const setAccountPrivate = useCallback(
    (isPrivate: boolean) => mutate(() => useCases.setAccountVisibility.execute(isPrivate)),
    [mutate, useCases],
  );

  const updatePrivacy = useCallback(
    (patch: Partial<PrivacySettings>) =>
      mutate(() => useCases.updatePrivacySettings.execute(patch)),
    [mutate, useCases],
  );

  return {
    profile: resource.data,
    isLoading: resource.isLoading,
    isRefreshing: resource.isRefreshing,
    error: resource.error,
    isSavingPrivacy,
    privacyError,
    refresh: resource.refresh,
    setAccountPrivate,
    updatePrivacy,
  };
};

export interface UserPostsViewModel {
  readonly posts: readonly Post[];
  readonly sort: PostSort;
  readonly isLoading: boolean;
  readonly error: unknown;
  setSort(sort: PostSort): void;
  refresh(): Promise<void>;
}

export const useUserPosts = (userId: string | null): UserPostsViewModel => {
  const useCases = useUseCases();
  const [sort, setSort] = useState<PostSort>('recent');

  const loader = useCallback(
    () => (userId ? useCases.loadUserPosts.execute(userId, { sort }) : Promise.resolve([])),
    [useCases, userId, sort],
  );
  const resource = useAsyncResource<readonly Post[]>(loader, {
    enabled: Boolean(userId),
    initialData: [],
    deps: [userId, sort],
  });

  return {
    posts: resource.data ?? [],
    sort,
    isLoading: resource.isLoading,
    error: resource.error,
    setSort,
    refresh: resource.refresh,
  };
};

export interface UserProfileViewModel {
  readonly profile: User | null;
  readonly isLoading: boolean;
  readonly error: unknown;
  refresh(): Promise<void>;
}

export const useUserProfile = (handle: string | null): UserProfileViewModel => {
  const useCases = useUseCases();
  const loader = useCallback(
    () =>
      handle
        ? useCases.loadUserProfile.execute(handle)
        : Promise.reject(new Error('No handle supplied')),
    [useCases, handle],
  );
  const resource = useAsyncResource<User>(loader, {
    enabled: Boolean(handle),
    deps: [handle],
  });

  return {
    profile: resource.data,
    isLoading: resource.isLoading,
    error: resource.error,
    refresh: resource.refresh,
  };
};

export default useMyProfile;
