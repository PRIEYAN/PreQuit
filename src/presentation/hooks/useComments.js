import { useCallback, useState } from 'react';

import { useUseCases } from '../container/DependencyProvider';
import { useAsyncResource } from './useAsyncResource';

export const useComments = postId => {
  const useCases = useUseCases();
  const [comments, setComments] = useState([]);

  const loader = useCallback(async () => {
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
    async body => {
      const created = await useCases.addComment.execute(postId, body);
      if (created) setComments(current => [...current, created]);
      return created;
    },
    [useCases, postId],
  );

  return { comments, isLoading: resource.isLoading, error: resource.error, addComment, reload: resource.reload };
};

export default useComments;
