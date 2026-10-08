import type { Post } from '../entities/Post';
import type { ProfileLink, User } from '../entities/User';
import type { PageOptions, RequestOptions } from './common';

export interface ProfilePatch {
  readonly displayName?: string;
  readonly bio?: string;
  readonly isPrivate?: boolean;
  readonly links?: readonly ProfileLink[];
}

export interface ProfileRepository {
  myProfile(options?: RequestOptions): Promise<User>;
  byHandle(handle: string, options?: RequestOptions): Promise<User>;
  postsOf(userId: string, options?: PageOptions): Promise<readonly Post[]>;
  updateProfile(patch: ProfilePatch): Promise<unknown>;
}
