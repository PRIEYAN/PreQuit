import { createPost, type Post, type PostPayload } from '../../domain/entities/Post';
import type { Page } from '../../domain/repositories/common';
import { rowsOf, type ListLike } from './rows';

export interface RankedEntry {
  readonly post?: PostPayload;
  readonly reason?: Post['reason'];
}

export interface FeedPageDto {
  readonly items?: readonly RankedEntry[];
  readonly nextCursor?: string | null;
}

const entryToPost = (entry: RankedEntry): Post =>
  createPost({
    ...(entry.post ?? (entry as PostPayload)),
    reason: entry.reason ?? entry.post?.reason ?? null,
  });

export const toPost = (dto: PostPayload | null): Post => createPost(dto ?? {});

export const toFeedPage = (dto: FeedPageDto | null | undefined): Page<Post> => ({
  items: (dto?.items ?? []).map(entryToPost),
  nextCursor: dto?.nextCursor ?? null,
});

export const toPostList = (dto: ListLike<RankedEntry>): Post[] => rowsOf(dto).map(entryToPost);
