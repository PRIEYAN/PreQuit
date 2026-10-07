import { PostRepository } from '../../domain/repositories/PostRepository';
import { toPost } from '../mappers/PostMapper';
import { toComment, toCommentList } from '../mappers/CommentMapper';

export class HttpPostRepository extends PostRepository {
  constructor(http) {
    super();
    this.http = http;
  }

  async byId(postId) {
    return toPost(await this.http.get(`/posts/${postId}`));
  }

  like(postId) {
    return this.http.post(`/posts/${postId}/likes`);
  }

  unlike(postId) {
    return this.http.delete(`/posts/${postId}/likes`);
  }

  save(postId) {
    return this.http.post(`/posts/${postId}/saves`, {});
  }

  unsave(postId) {
    return this.http.delete(`/posts/${postId}/saves`);
  }

  async comments(postId, { limit = 20, signal } = {}) {
    const data = await this.http.get(`/posts/${postId}/comments?limit=${limit}`, { signal });
    return toCommentList(data);
  }

  async addComment(postId, body, parentId = null) {
    return toComment(await this.http.post(`/posts/${postId}/comments`, { body, parentId }));
  }
}

export default HttpPostRepository;
