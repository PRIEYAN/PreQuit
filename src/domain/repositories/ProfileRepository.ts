import type { Post } from '../entities/Post';
import type { PrivacySettings, ProfileLink, User } from '../entities/User';
import type { PageOptions, RequestOptions } from './common';

export type PostSort = 'recent' | 'oldest' | 'most_viewed' | 'least_viewed';

export const POST_SORTS: readonly PostSort[] = ['recent', 'oldest', 'most_viewed', 'least_viewed'];

export const POST_SORT_LABELS: Readonly<Record<PostSort, string>> = {
  recent: 'Newest first',
  oldest: 'Oldest first',
  most_viewed: 'Most viewed',
  least_viewed: 'Least viewed',
};

export interface ProfilePostsOptions extends PageOptions {
  readonly sort?: PostSort;
}

export interface ProfilePatch {
  readonly displayName?: string;
  readonly bio?: string;
  readonly isPrivate?: boolean;
  readonly links?: readonly ProfileLink[];
}

export interface ProfileRepository {
  myProfile(options?: RequestOptions): Promise<User>;
  byHandle(handle: string, options?: RequestOptions): Promise<User>;
  postsOf(userId: string, options?: ProfilePostsOptions): Promise<readonly Post[]>;
  updateProfile(patch: ProfilePatch): Promise<unknown>;
  updatePrivacy(patch: Partial<PrivacySettings>): Promise<unknown>;
}
