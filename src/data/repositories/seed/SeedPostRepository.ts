import { createPost, type Post } from '../../../domain/entities/Post';
import { createComment, type Comment } from '../../../domain/entities/Comment';
import type { PostRepository } from '../../../domain/repositories/PostRepository';
import { MOCK_POSTS } from './dataset/posts';
import { commentsFor, type SeedComment } from './dataset/comments';

const toDomainComment = (raw: SeedComment, postId: string): Comment =>
  createComment({
    id: raw.id,
    postId,
    author: { ...raw.author, avatarUrl: null },
    body: raw.body,
    counts: { likes: raw.likes, replies: 0 },
    createdAt: raw.time,
  });

export class SeedPostRepository implements PostRepository {
  async byId(postId: string): Promise<Post | null> {
    const found = MOCK_POSTS.find(entry => entry.id === postId);
    return found ? createPost(found) : null;
  }

  async like(): Promise<void> {}

  async unlike(): Promise<void> {}

  async save(): Promise<void> {}

  async unsave(): Promise<void> {}

  async comments(postId: string): Promise<readonly Comment[]> {
    return commentsFor(postId).map(raw => toDomainComment(raw, postId));
  }

  async addComment(postId: string, body: string): Promise<Comment> {
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
