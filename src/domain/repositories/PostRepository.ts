import type { Comment } from '../entities/Comment';
import type { Post } from '../entities/Post';
import type { PageOptions } from './common';

export interface PostRepository {
  byId(postId: string): Promise<Post | null>;
  like(postId: string): Promise<unknown>;
  unlike(postId: string): Promise<unknown>;
  save(postId: string): Promise<unknown>;
  unsave(postId: string): Promise<unknown>;
  comments(postId: string, options?: PageOptions): Promise<readonly Comment[]>;
  addComment(postId: string, body: string, parentId?: string | null): Promise<Comment>;
}
