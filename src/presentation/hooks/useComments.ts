import { useCallback, useState } from 'react';

import { useUseCases } from '../container/DependencyProvider';
import { useAsyncResource } from './useAsyncResource';
import type { Comment } from '../../domain/entities/Comment';

export interface CommentsViewModel {
  readonly comments: readonly Comment[];
  readonly isLoading: boolean;
  readonly error: unknown;
  addComment(body: string): Promise<Comment | null>;
  reload(): Promise<void>;
}

export const useComments = (postId: string | null): CommentsViewModel => {
  const useCases = useUseCases();
  const [comments, setComments] = useState<readonly Comment[]>([]);

  const loader = useCallback(async (): Promise<readonly Comment[]> => {
    if (!postId) {
      setComments([]);
      return [];
    }
    const loaded = await useCases.loadComments.execute(postId);
    setComments(loaded);
    return loaded;
  }, [useCases, postId]);

  const resource = useAsyncResource(loader, { enabled: Boolean(postId), deps: [postId] });

  const addComment = useCallback(
    async (body: string): Promise<Comment | null> => {
      if (!postId) return null;
      const created = await useCases.addComment.execute(postId, body);
      if (created) setComments(current => [...current, created]);
      return created;
    },
    [useCases, postId],
  );

  return {
    comments,
    isLoading: resource.isLoading,
    error: resource.error,
    addComment,
    reload: resource.reload,
  };
};

export default useComments;
