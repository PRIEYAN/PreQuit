import { hasSaved } from '../../domain/entities/Post';

export class ToggleSaveUseCase {
  constructor(postRepository) {
    this.postRepository = postRepository;
  }

  execute(post) {
    return hasSaved(post) ? this.postRepository.unsave(post.id) : this.postRepository.save(post.id);
  }
}

export default ToggleSaveUseCase;
