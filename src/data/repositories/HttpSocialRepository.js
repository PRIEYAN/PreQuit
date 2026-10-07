import { SocialRepository } from '../../domain/repositories/SocialRepository';
import { toUserList } from '../mappers/UserMapper';

export class HttpSocialRepository extends SocialRepository {
  constructor(http) {
    super();
    this.http = http;
  }

  follow(userId) {
    return this.http.post(`/users/${userId}/follow`, {});
  }

  unfollow(userId) {
    return this.http.delete(`/users/${userId}/follow`);
  }

  async mutuals({ signal } = {}) {
    const data = await this.http.get('/me/mutuals', { signal });
    return Array.isArray(data) ? data : [];
  }

  async suggested({ limit = 20, signal } = {}) {
    const data = await this.http.get(`/users/suggested?limit=${limit}`, { signal });
    return toUserList(Array.isArray(data) ? data : (data?.items ?? []));
  }
}

export default HttpSocialRepository;
