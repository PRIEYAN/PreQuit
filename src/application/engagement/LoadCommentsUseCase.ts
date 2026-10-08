import type { Comment } from '../../domain/entities/Comment';
import type { PostRepository } from '../../domain/repositories/PostRepository';
import type { PageOptions } from '../../domain/repositories/common';

export class LoadCommentsUseCase {
  constructor(private readonly postRepository: PostRepository) {}

  execute(postId: string, options?: PageOptions): Promise<readonly Comment[]> {
    return this.postRepository.comments(postId, options);
  }
}

export default LoadCommentsUseCase;
