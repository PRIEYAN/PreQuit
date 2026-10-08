import { hasSaved, type Post } from '../../domain/entities/Post';
import type { PostRepository } from '../../domain/repositories/PostRepository';

export class ToggleSaveUseCase {
  constructor(private readonly postRepository: PostRepository) {}

  execute(post: Post): Promise<unknown> {
    return hasSaved(post) ? this.postRepository.unsave(post.id) : this.postRepository.save(post.id);
  }
}

export default ToggleSaveUseCase;
