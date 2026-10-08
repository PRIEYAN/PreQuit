import type { Comment } from '../../domain/entities/Comment';
import type { PostRepository } from '../../domain/repositories/PostRepository';

export class AddCommentUseCase {
  constructor(private readonly postRepository: PostRepository) {}

  execute(postId: string, body: string, parentId: string | null = null): Promise<Comment | null> {
    const trimmed = body.trim();
    if (!trimmed) return Promise.resolve(null);
    return this.postRepository.addComment(postId, trimmed, parentId);
  }
}

export default AddCommentUseCase;
