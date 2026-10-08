import { hasLiked, type Post } from '../../domain/entities/Post';
import type { PostRepository } from '../../domain/repositories/PostRepository';

export class ToggleLikeUseCase {
  constructor(private readonly postRepository: PostRepository) {}

  execute(post: Post): Promise<unknown> {
    return hasLiked(post) ? this.postRepository.unlike(post.id) : this.postRepository.like(post.id);
  }
}

export default ToggleLikeUseCase;
