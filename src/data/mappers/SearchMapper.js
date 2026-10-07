import { createTopic } from '../../domain/entities/Topic';
import { createPost } from '../../domain/entities/Post';
import { createUser } from '../../domain/entities/User';

export const toSearchResults = (dto = {}) => ({
  interpretation: dto.interpretation ?? null,
  posts: (dto.posts ?? []).map(entry => createPost(entry.post ?? entry)),
  people: (dto.people ?? []).map(entry => createUser(entry.user ?? entry)),
  topics: (dto.topics ?? []).map(entry => createTopic(entry.topic ?? entry)),
});

export const toTopicList = (dto = {}) => {
  const rows = Array.isArray(dto) ? dto : (dto.items ?? dto.data ?? []);
  return rows.map(row => createTopic(row.topic ?? row));
};
