const emptyCounts = () => ({ likes: 0, comments: 0, shares: 0, saves: 0 });
const emptyViewer = () => ({ hasLiked: false, hasSaved: false, canEdit: false, canDelete: false });

export const createPost = (raw = {}) => ({
  id: raw.id ?? '',
  author: {
    id: raw.author?.id ?? '',
    handle: raw.author?.handle ?? '',
    displayName: raw.author?.displayName ?? raw.author?.handle ?? '',
    avatarUrl: raw.author?.avatarUrl ?? null,
  },
  description: raw.description ?? '',
  media: Array.isArray(raw.media) ? raw.media : [],
  hashtags: Array.isArray(raw.hashtags) ? raw.hashtags : [],
  mentions: Array.isArray(raw.mentions) ? raw.mentions : [],
  topics: Array.isArray(raw.topics) ? raw.topics : [],
  visibility: raw.visibility ?? 'public',
  status: raw.status ?? 'published',
  counts: { ...emptyCounts(), ...(raw.counts ?? {}) },
  viewer: { ...emptyViewer(), ...(raw.viewer ?? {}) },
  publishedAt: raw.publishedAt ?? null,
  reason: raw.reason ?? null,
});

const toggled = (post, flag, countKey) => {
  const next = !post.viewer[flag];
  return {
    ...post,
    viewer: { ...post.viewer, [flag]: next },
    counts: {
      ...post.counts,
      [countKey]: Math.max(0, (post.counts[countKey] ?? 0) + (next ? 1 : -1)),
    },
  };
};

export const withLikeToggled = post => toggled(post, 'hasLiked', 'likes');
export const withSaveToggled = post => toggled(post, 'hasSaved', 'saves');
export const hasLiked = post => Boolean(post?.viewer?.hasLiked);
export const hasSaved = post => Boolean(post?.viewer?.hasSaved);
