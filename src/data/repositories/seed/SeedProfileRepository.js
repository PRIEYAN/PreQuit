import { ProfileRepository } from '../../../domain/repositories/ProfileRepository';
import { createUser } from '../../../domain/entities/User';
import { createPost } from '../../../domain/entities/Post';
import { MOCK_POSTS } from './dataset/posts';

const DEMO_PROFILE = createUser({
  id: 'me',
  handle: 'mogger',
  displayName: 'prie.aur',
  bio: 'i use arch btw',
  counts: { posts: 27, followers: 2, following: 5 },
});

export class SeedProfileRepository extends ProfileRepository {
  async myProfile() {
    return DEMO_PROFILE;
  }

  async byHandle(handle) {
    return createUser({ ...DEMO_PROFILE, handle, displayName: handle });
  }

  async postsOf(_userId, { limit = 20 } = {}) {
    return MOCK_POSTS.slice(0, limit).map(createPost);
  }

  async updateProfile() {}
}

export default SeedProfileRepository;
