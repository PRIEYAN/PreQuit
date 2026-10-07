import { PostRepository } from '../../../domain/repositories/PostRepository';
import { createPost } from '../../../domain/entities/Post';
import { createComment } from '../../../domain/entities/Comment';
import { MOCK_POSTS } from './dataset/posts';
import { commentsFor } from './dataset/comments';

const toDomainComment = (raw, postId) =>
  createComment({
    id: raw.id,
    postId,
    author: { ...raw.author, avatarUrl: null },
    body: raw.body,
    counts: { likes: raw.likes ?? 0, replies: 0 },
    createdAt: raw.time ?? null,
  });

export class SeedPostRepository extends PostRepository {
  async byId(postId) {
    const found = MOCK_POSTS.find(post => post.id === postId);
    return found ? createPost(found) : null;
  }

  async like() {}

  async unlike() {}

  async save() {}

  async unsave() {}

  async comments(postId) {
    return commentsFor(postId).map(raw => toDomainComment(raw, postId));
  }

  async addComment(postId, body) {
    return createComment({
      id: `local_${Date.now()}`,
      postId,
      author: { id: 'me', handle: 'you', displayName: 'You', avatarUrl: null },
      body,
      createdAt: 'now',
    });
  }
}

export default SeedPostRepository;
