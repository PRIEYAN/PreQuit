import type { Post } from '../../domain/entities/Post';
import type { User, UserPayload } from '../../domain/entities/User';
import type {
  ProfilePatch,
  ProfileRepository,
} from '../../domain/repositories/ProfileRepository';
import type { PageOptions, RequestOptions } from '../../domain/repositories/common';
import type { HttpClient } from '../http/HttpClient';
import { toUser } from '../mappers/UserMapper';
import { toPostList } from '../mappers/PostMapper';

export class HttpProfileRepository implements ProfileRepository {
  constructor(private readonly http: HttpClient) {}

  async myProfile(options: RequestOptions = {}): Promise<User> {
    const { signal } = options;
    return toUser(await this.http.get<UserPayload>('/me/profile', signal ? { signal } : {}));
  }

  async byHandle(handle: string, options: RequestOptions = {}): Promise<User> {
    const { signal } = options;
    return toUser(
      await this.http.get<UserPayload>(
        `/users/${encodeURIComponent(handle)}`,
        signal ? { signal } : {},
      ),
    );
  }

  async postsOf(userId: string, options: PageOptions = {}): Promise<readonly Post[]> {
    const { limit = 20, signal } = options;
    const dto = await this.http.get<Parameters<typeof toPostList>[0]>(
      `/users/${userId}/posts?limit=${limit}`,
      signal ? { signal } : {},
    );
    return toPostList(dto);
  }

  updateProfile(patch: ProfilePatch): Promise<unknown> {
    return this.http.patch('/me/profile', patch);
  }
}

export default HttpProfileRepository;
