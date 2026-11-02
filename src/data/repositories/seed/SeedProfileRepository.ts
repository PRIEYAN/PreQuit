import { createPost, type Post } from '../../../domain/entities/Post';
import { createUser, type User } from '../../../domain/entities/User';
import type {
  PostSort,
  ProfilePostsOptions,
  ProfileRepository,
} from '../../../domain/repositories/ProfileRepository';
import { MOCK_POSTS } from './dataset/posts';

const DEMO_PROFILE: User = createUser({
  id: 'me',
  handle: 'mogger',
  displayName: 'prie.aur',
  bio: 'i use arch btw',
  counts: { posts: 27, followers: 2, following: 5 },
});

const publishedMs = (post: Post): number =>
  post.publishedAt ? new Date(post.publishedAt).getTime() : 0;

const SEED_SORTS: Readonly<Record<PostSort, (a: Post, b: Post) => number>> = {
  recent: (a, b) => publishedMs(b) - publishedMs(a),
  oldest: (a, b) => publishedMs(a) - publishedMs(b),
  most_viewed: (a, b) => b.counts.views - a.counts.views,
  least_viewed: (a, b) => a.counts.views - b.counts.views,
};

export class SeedProfileRepository implements ProfileRepository {
  async myProfile(): Promise<User> {
    return DEMO_PROFILE;
  }

  async byHandle(handle: string): Promise<User> {
    return createUser({ ...DEMO_PROFILE, handle, displayName: handle });
  }

  async postsOf(_userId: string, options: ProfilePostsOptions = {}): Promise<readonly Post[]> {
    const posts = MOCK_POSTS.map(entry => createPost(entry));
    return [...posts].sort(SEED_SORTS[options.sort ?? 'recent']).slice(0, options.limit ?? 20);
  }

  async updateProfile(): Promise<void> {}

  async updatePrivacy(): Promise<void> {}
}

export default SeedProfileRepository;
