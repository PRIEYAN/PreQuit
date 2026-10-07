export const createComment = (raw = {}) => ({
  id: raw.id ?? '',
  postId: raw.postId ?? '',
  author: raw.author ?? { id: raw.authorId ?? '', handle: '', displayName: '', avatarUrl: null },
  body: raw.body ?? '',
  parentId: raw.parentId ?? null,
  counts: { likes: raw.counts?.likes ?? 0, replies: raw.counts?.replies ?? 0 },
  isPinned: Boolean(raw.isPinned),
  createdAt: raw.createdAt ?? null,
});
