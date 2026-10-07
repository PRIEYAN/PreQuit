import { createPost } from '../../domain/entities/Post';

export const toPost = dto => createPost(dto);

export const toFeedPage = (dto = {}) => ({
  items: (dto.items ?? []).map(entry =>
    createPost({ ...(entry.post ?? entry), reason: entry.reason ?? entry.post?.reason ?? null }),
  ),
  nextCursor: dto.nextCursor ?? null,
});

export const toPostList = (dto = {}) => {
  const rows = Array.isArray(dto) ? dto : (dto.items ?? dto.data ?? []);
  return rows.map(row => createPost(row.post ?? row));
};
