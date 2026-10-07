export const createUser = (raw = {}) => ({
  id: raw.id ?? '',
  handle: raw.handle ?? '',
  displayName: raw.displayName ?? raw.handle ?? '',
  bio: raw.bio ?? '',
  email: raw.email ?? null,
  avatarUrl: raw.avatarUrl ?? null,
  isPrivate: Boolean(raw.isPrivate),
  emailVerified: Boolean(raw.emailVerified),
  counts: {
    posts: raw.counts?.posts ?? 0,
    followers: raw.counts?.followers ?? 0,
    following: raw.counts?.following ?? 0,
  },
  topTopics: Array.isArray(raw.topTopics) ? raw.topTopics : [],
  viewer: raw.viewer ?? null,
});

export const initialOf = user =>
  (user?.displayName || user?.handle || '?').charAt(0).toUpperCase();
