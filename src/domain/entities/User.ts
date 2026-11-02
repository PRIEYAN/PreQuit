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

export type PostAudience = 'everyone' | 'followers';
export type MessageAudience = 'everyone' | 'followers';

export interface PrivacySettings {
  readonly showActivityStatus: boolean;
  readonly whoCanMessage: MessageAudience;
  readonly whoCanViewPosts: PostAudience;
  readonly allowMessageRequests: boolean;
}

export const DEFAULT_PRIVACY: PrivacySettings = {
  showActivityStatus: true,
  whoCanMessage: 'followers',
  whoCanViewPosts: 'everyone',
  allowMessageRequests: true,
};

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
  readonly privacy: PrivacySettings;
}

export type UserPayload = Partial<Omit<User, 'counts' | 'privacy'>> & {
  readonly counts?: Partial<UserCounts>;
  // The API nests privacy under `settings`; `privacy` is accepted too so a
  // locally-built User round-trips through this payload unchanged.
  readonly settings?: { readonly privacy?: Partial<PrivacySettings> };
  readonly privacy?: Partial<PrivacySettings>;
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
  privacy: { ...DEFAULT_PRIVACY, ...raw.settings?.privacy, ...raw.privacy },
});

export const initialOf = (user: Pick<User, 'displayName' | 'handle'> | null | undefined): string =>
  (user?.displayName || user?.handle || '?').charAt(0).toUpperCase();
