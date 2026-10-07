import { ProfileRepository } from '../../domain/repositories/ProfileRepository';
import { toUser } from '../mappers/UserMapper';
import { toPostList } from '../mappers/PostMapper';

export class HttpProfileRepository extends ProfileRepository {
  constructor(http) {
    super();
    this.http = http;
  }

  async myProfile({ signal } = {}) {
    return toUser(await this.http.get('/me/profile', { signal }));
  }

  async byHandle(handle, { signal } = {}) {
    return toUser(await this.http.get(`/users/${encodeURIComponent(handle)}`, { signal }));
  }

  async postsOf(userId, { limit = 20, signal } = {}) {
    return toPostList(await this.http.get(`/users/${userId}/posts?limit=${limit}`, { signal }));
  }

  updateProfile(patch) {
    return this.http.patch('/me/profile', patch);
  }
}

export default HttpProfileRepository;
