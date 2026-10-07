export class AddCommentUseCase {
  constructor(postRepository) {
    this.postRepository = postRepository;
  }

  execute(postId, body, parentId = null) {
    const trimmed = body.trim();
    if (!trimmed) return Promise.resolve(null);
    return this.postRepository.addComment(postId, trimmed, parentId);
  }
}

export default AddCommentUseCase;
