import type { User } from '../entities/User';
import type { PageOptions, RequestOptions } from './common';

export interface SocialRepository {
  follow(userId: string): Promise<unknown>;
  unfollow(userId: string): Promise<unknown>;
  mutuals(options?: RequestOptions): Promise<readonly string[]>;
  suggested(options?: PageOptions): Promise<readonly User[]>;
}
