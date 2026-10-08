export interface PostAuthor {
  readonly id: string;
  readonly handle: string;
  readonly displayName: string;
  readonly avatarUrl: string | null;
}

export interface MediaVariants {
  readonly thumb?: string;
  readonly feed?: string;
  readonly full?: string;
}

export interface PostMedia {
  readonly id: string;
  readonly urls: MediaVariants;
  readonly width?: number;
  readonly height?: number;
  readonly placeholder?: string | null;
  readonly altText?: string | null;
}

export interface PostTopic {
  readonly topicId?: string;
  readonly slug: string;
  readonly label?: string;
  readonly weight?: number;
  readonly source?: string;
}

export interface PostCounts {
  readonly likes: number;
  readonly comments: number;
  readonly shares: number;
  readonly saves: number;
}

export interface PostViewerState {
  readonly hasLiked: boolean;
  readonly hasSaved: boolean;
  readonly canEdit: boolean;
  readonly canDelete: boolean;
}

export interface RankingReason {
  readonly kind: string;
  readonly label: string;
}

export type PostVisibility = 'public' | 'followers';

export interface Post {
  readonly id: string;
  readonly author: PostAuthor;
  readonly description: string;
  readonly media: readonly PostMedia[];
  readonly hashtags: readonly string[];
  readonly mentions: readonly string[];
  readonly topics: readonly PostTopic[];
  readonly visibility: PostVisibility;
  readonly status: string;
  readonly counts: PostCounts;
  readonly viewer: PostViewerState;
  readonly publishedAt: string | null;
  readonly reason: RankingReason | null;
}

export type PostPayload = Partial<Omit<Post, 'author' | 'counts' | 'viewer'>> & {
  readonly author?: Partial<PostAuthor>;
  readonly counts?: Partial<PostCounts>;
  readonly viewer?: Partial<PostViewerState>;
};

const EMPTY_COUNTS: PostCounts = { likes: 0, comments: 0, shares: 0, saves: 0 };

const EMPTY_VIEWER: PostViewerState = {
  hasLiked: false,
  hasSaved: false,
  canEdit: false,
  canDelete: false,
};

export const createPost = (raw: PostPayload = {}): Post => ({
  id: raw.id ?? '',
  author: {
    id: raw.author?.id ?? '',
    handle: raw.author?.handle ?? '',
    displayName: raw.author?.displayName ?? raw.author?.handle ?? '',
    avatarUrl: raw.author?.avatarUrl ?? null,
  },
  description: raw.description ?? '',
  media: raw.media ?? [],
  hashtags: raw.hashtags ?? [],
  mentions: raw.mentions ?? [],
  topics: raw.topics ?? [],
  visibility: raw.visibility ?? 'public',
  status: raw.status ?? 'published',
  counts: { ...EMPTY_COUNTS, ...raw.counts },
  viewer: { ...EMPTY_VIEWER, ...raw.viewer },
  publishedAt: raw.publishedAt ?? null,
  reason: raw.reason ?? null,
});

type ToggleFlag = Extract<keyof PostViewerState, 'hasLiked' | 'hasSaved'>;
type ToggleCount = Extract<keyof PostCounts, 'likes' | 'saves'>;

const toggled = (post: Post, flag: ToggleFlag, countKey: ToggleCount): Post => {
  const next = !post.viewer[flag];
  return {
    ...post,
    viewer: { ...post.viewer, [flag]: next },
    counts: {
      ...post.counts,
      [countKey]: Math.max(0, post.counts[countKey] + (next ? 1 : -1)),
    },
  };
};

export const withLikeToggled = (post: Post): Post => toggled(post, 'hasLiked', 'likes');

export const withSaveToggled = (post: Post): Post => toggled(post, 'hasSaved', 'saves');

export const hasLiked = (post: Post | undefined): boolean => Boolean(post?.viewer.hasLiked);

export const hasSaved = (post: Post | undefined): boolean => Boolean(post?.viewer.hasSaved);
