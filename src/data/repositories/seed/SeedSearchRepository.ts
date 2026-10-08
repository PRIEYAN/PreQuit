import { createPost } from '../../../domain/entities/Post';
import { createTopic, type Topic } from '../../../domain/entities/Topic';
import type {
  SearchRepository,
  SearchResults,
} from '../../../domain/repositories/SearchRepository';
import type { PageOptions } from '../../../domain/repositories/common';
import { searchPosts } from './dataset/posts';
import { suggestTopics, DEFAULT_TOPICS, type SeedTopic } from './dataset/topics';

const toDomainTopic = (raw: SeedTopic): Topic =>
  createTopic({ id: raw.id, slug: raw.slug, label: raw.label, posts: raw.posts });

export class SeedSearchRepository implements SearchRepository {
  async search(query: string, options: PageOptions = {}): Promise<SearchResults> {
    return {
      interpretation: null,
      posts: searchPosts(query, undefined, options.limit ?? 20).map(entry => createPost(entry)),
      people: [],
      topics: suggestTopics(query).map(toDomainTopic),
    };
  }

  async trendingTopics(): Promise<readonly Topic[]> {
    return DEFAULT_TOPICS.map(toDomainTopic);
  }
}

export default SeedSearchRepository;
