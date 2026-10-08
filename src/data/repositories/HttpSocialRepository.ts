import type { User, UserPayload } from '../../domain/entities/User';
import type { SocialRepository } from '../../domain/repositories/SocialRepository';
import type { PageOptions, RequestOptions } from '../../domain/repositories/common';
import type { HttpClient } from '../http/HttpClient';
import { toUserList } from '../mappers/UserMapper';
import { rowsOf } from '../mappers/rows';

export class HttpSocialRepository implements SocialRepository {
  constructor(private readonly http: HttpClient) {}

  follow(userId: string): Promise<unknown> {
    return this.http.post(`/users/${userId}/follow`, {});
  }

  unfollow(userId: string): Promise<unknown> {
    return this.http.delete(`/users/${userId}/follow`);
  }

  async mutuals(options: RequestOptions = {}): Promise<readonly string[]> {
    const { signal } = options;
    const data = await this.http.get<readonly string[]>('/me/mutuals', signal ? { signal } : {});
    return Array.isArray(data) ? data : [];
  }

  async suggested(options: PageOptions = {}): Promise<readonly User[]> {
    const { limit = 20, signal } = options;
    const data = await this.http.get<Parameters<typeof rowsOf<UserPayload>>[0]>(
      `/users/suggested?limit=${limit}`,
      signal ? { signal } : {},
    );
    return toUserList(rowsOf(data));
  }
}

export default HttpSocialRepository;
