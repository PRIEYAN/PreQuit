import type { Post } from '../entities/Post';
import type { Page, PageOptions } from './common';

export const FeedSurface = {
  HOME: 'home',
  EXPLORE: 'explore',
  TRENDING: 'trending',
} as const;

export type FeedSurfaceValue = (typeof FeedSurface)[keyof typeof FeedSurface];

export interface FeedRepository {
  load(surface?: FeedSurfaceValue, options?: PageOptions): Promise<Page<Post>>;
}
