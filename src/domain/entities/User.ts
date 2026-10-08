export interface UserCounts {
  readonly posts: number;
  readonly followers: number;
  readonly following: number;
}

export interface ProfileLink {
  readonly label: string;
  readonly url: string;
}

export type ViewerRelationship = 'none' | 'following' | 'requested' | 'mutual' | 'blocked';

export interface UserViewerState {
  readonly isSelf: boolean;
  readonly relationship: ViewerRelationship;
  readonly isMutual: boolean;
}

export interface TopicAffinity {
  readonly slug: string;
  readonly label: string;
  readonly weight?: number;
}

export interface User {
  readonly id: string;
  readonly handle: string;
  readonly displayName: string;
  readonly bio: string;
  readonly email: string | null;
  readonly avatarUrl: string | null;
  readonly isPrivate: boolean;
  readonly emailVerified: boolean;
  readonly counts: UserCounts;
  readonly links: readonly ProfileLink[];
  readonly topTopics: readonly TopicAffinity[];
  readonly viewer: UserViewerState | null;
}

export type UserPayload = Partial<Omit<User, 'counts'>> & {
  readonly counts?: Partial<UserCounts>;
};

const EMPTY_COUNTS: UserCounts = { posts: 0, followers: 0, following: 0 };

export const createUser = (raw: UserPayload = {}): User => ({
  id: raw.id ?? '',
  handle: raw.handle ?? '',
  displayName: raw.displayName ?? raw.handle ?? '',
  bio: raw.bio ?? '',
  email: raw.email ?? null,
  avatarUrl: raw.avatarUrl ?? null,
  isPrivate: Boolean(raw.isPrivate),
  emailVerified: Boolean(raw.emailVerified),
  counts: { ...EMPTY_COUNTS, ...raw.counts },
  links: raw.links ?? [],
  topTopics: raw.topTopics ?? [],
  viewer: raw.viewer ?? null,
});

export const initialOf = (user: Pick<User, 'displayName' | 'handle'> | null | undefined): string =>
  (user?.displayName || user?.handle || '?').charAt(0).toUpperCase();
