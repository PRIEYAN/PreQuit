export class LoadCommentsUseCase {
  constructor(postRepository) {
    this.postRepository = postRepository;
  }

  execute(postId, options) {
    return this.postRepository.comments(postId, options);
  }
}

export default LoadCommentsUseCase;
