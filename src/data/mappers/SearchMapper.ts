import { createPost, type PostPayload } from '../../domain/entities/Post';
import { createTopic, type Topic, type TopicPayload } from '../../domain/entities/Topic';
import { createUser, type UserPayload } from '../../domain/entities/User';
import type { QueryInterpretation, SearchResults } from '../../domain/repositories/SearchRepository';
import { rowsOf, type ListLike } from './rows';

export interface TopicEntry {
  readonly topic?: TopicPayload;
}

export interface SearchDto {
  readonly interpretation?: QueryInterpretation | null;
  readonly posts?: readonly { post?: PostPayload }[];
  readonly people?: readonly { user?: UserPayload }[];
  readonly topics?: readonly TopicEntry[];
}

export const toSearchResults = (dto: SearchDto | null | undefined): SearchResults => ({
  interpretation: dto?.interpretation ?? null,
  posts: (dto?.posts ?? []).map(entry => createPost(entry.post ?? (entry as PostPayload))),
  people: (dto?.people ?? []).map(entry => createUser(entry.user ?? (entry as UserPayload))),
  topics: (dto?.topics ?? []).map(entry => createTopic(entry.topic ?? (entry as TopicPayload))),
});

export const toTopicList = (dto: ListLike<TopicEntry>): Topic[] =>
  rowsOf(dto).map(row => createTopic(row.topic ?? (row as TopicPayload)));
