import type { Comment } from '../../domain/entities/Comment';
import type { Post, PostPayload } from '../../domain/entities/Post';
import type { PostRepository } from '../../domain/repositories/PostRepository';
import type { PageOptions } from '../../domain/repositories/common';
import type { HttpClient } from '../http/HttpClient';
import { toPost } from '../mappers/PostMapper';
import { toComment, toCommentList } from '../mappers/CommentMapper';

export class HttpPostRepository implements PostRepository {
  constructor(private readonly http: HttpClient) {}

  async byId(postId: string): Promise<Post | null> {
    const dto = await this.http.get<PostPayload>(`/posts/${postId}`);
    return dto ? toPost(dto) : null;
  }

  like(postId: string): Promise<unknown> {
    return this.http.post(`/posts/${postId}/likes`);
  }

  unlike(postId: string): Promise<unknown> {
    return this.http.delete(`/posts/${postId}/likes`);
  }

  save(postId: string): Promise<unknown> {
    return this.http.post(`/posts/${postId}/saves`, {});
  }

  unsave(postId: string): Promise<unknown> {
    return this.http.delete(`/posts/${postId}/saves`);
  }

  async comments(postId: string, options: PageOptions = {}): Promise<readonly Comment[]> {
    const { limit = 20, signal } = options;
    const dto = await this.http.get<Parameters<typeof toCommentList>[0]>(
      `/posts/${postId}/comments?limit=${limit}`,
      signal ? { signal } : {},
    );
    return toCommentList(dto);
  }

  async addComment(postId: string, body: string, parentId: string | null = null): Promise<Comment> {
    return toComment(await this.http.post(`/posts/${postId}/comments`, { body, parentId }));
  }
}

export default HttpPostRepository;
