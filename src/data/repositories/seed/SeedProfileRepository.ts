import { createPost, type Post } from '../../../domain/entities/Post';
import { createUser, type User } from '../../../domain/entities/User';
import type { ProfileRepository } from '../../../domain/repositories/ProfileRepository';
import type { PageOptions } from '../../../domain/repositories/common';
import { MOCK_POSTS } from './dataset/posts';

const DEMO_PROFILE: User = createUser({
  id: 'me',
  handle: 'mogger',
  displayName: 'prie.aur',
  bio: 'i use arch btw',
  counts: { posts: 27, followers: 2, following: 5 },
});

export class SeedProfileRepository implements ProfileRepository {
  async myProfile(): Promise<User> {
    return DEMO_PROFILE;
  }

  async byHandle(handle: string): Promise<User> {
    return createUser({ ...DEMO_PROFILE, handle, displayName: handle });
  }

  async postsOf(_userId: string, options: PageOptions = {}): Promise<readonly Post[]> {
    return MOCK_POSTS.slice(0, options.limit ?? 20).map(entry => createPost(entry));
  }

  async updateProfile(): Promise<void> {}
}

export default SeedProfileRepository;
