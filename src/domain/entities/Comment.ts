import type { PostAuthor } from './Post';

export interface CommentCounts {
  readonly likes: number;
  readonly replies: number;
}

export interface Comment {
  readonly id: string;
  readonly postId: string;
  readonly author: PostAuthor;
  readonly body: string;
  readonly parentId: string | null;
  readonly counts: CommentCounts;
  readonly isPinned: boolean;
  readonly createdAt: string | null;
}

export type CommentPayload = Partial<Omit<Comment, 'author' | 'counts'>> & {
  readonly author?: Partial<PostAuthor>;
  readonly authorId?: string;
  readonly counts?: Partial<CommentCounts>;
};

export const createComment = (raw: CommentPayload = {}): Comment => ({
  id: raw.id ?? '',
  postId: raw.postId ?? '',
  author: {
    id: raw.author?.id ?? raw.authorId ?? '',
    handle: raw.author?.handle ?? '',
    displayName: raw.author?.displayName ?? raw.author?.handle ?? '',
    avatarUrl: raw.author?.avatarUrl ?? null,
  },
  body: raw.body ?? '',
  parentId: raw.parentId ?? null,
  counts: { likes: raw.counts?.likes ?? 0, replies: raw.counts?.replies ?? 0 },
  isPinned: Boolean(raw.isPinned),
  createdAt: raw.createdAt ?? null,
});
