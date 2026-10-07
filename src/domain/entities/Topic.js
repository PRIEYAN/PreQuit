export const createTopic = (raw = {}) => ({
  id: raw.id ?? raw.topicId ?? raw.slug ?? '',
  slug: raw.slug ?? '',
  label: raw.label ?? raw.slug ?? '',
  postCount: raw.postCount ?? 0,
});
