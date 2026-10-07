import { hasLiked } from '../../domain/entities/Post';

export class ToggleLikeUseCase {
  constructor(postRepository) {
    this.postRepository = postRepository;
  }

  execute(post) {
    return hasLiked(post) ? this.postRepository.unlike(post.id) : this.postRepository.like(post.id);
  }
}

export default ToggleLikeUseCase;
