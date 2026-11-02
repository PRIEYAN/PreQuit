import type { Post } from '../../domain/entities/Post';
import type { PrivacySettings, User, UserPayload } from '../../domain/entities/User';
import type {
  ProfilePatch,
  ProfilePostsOptions,
  ProfileRepository,
} from '../../domain/repositories/ProfileRepository';
import type { RequestOptions } from '../../domain/repositories/common';
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

  async postsOf(userId: string, options: ProfilePostsOptions = {}): Promise<readonly Post[]> {
    const { limit = 20, sort = 'recent', before, signal } = options;
    const query = new URLSearchParams({ limit: String(limit), sort });
    if (before) query.set('before', before);
    const dto = await this.http.get<Parameters<typeof toPostList>[0]>(
      `/users/${userId}/posts?${query.toString()}`,
      signal ? { signal } : {},
    );
    return toPostList(dto);
  }

  updateProfile(patch: ProfilePatch): Promise<unknown> {
    return this.http.patch('/me/profile', patch);
  }

  updatePrivacy(patch: Partial<PrivacySettings>): Promise<unknown> {
    return this.http.patch('/me/settings', { privacy: patch });
  }
}

export default HttpProfileRepository;
