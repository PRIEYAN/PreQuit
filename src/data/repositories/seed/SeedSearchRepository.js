import { SearchRepository } from '../../../domain/repositories/SearchRepository';
import { createPost } from '../../../domain/entities/Post';
import { createTopic } from '../../../domain/entities/Topic';
import { searchPosts } from './dataset/posts';
import { suggestTopics, DEFAULT_TOPICS } from './dataset/topics';

const toDomainTopic = raw => createTopic({ id: raw.id, slug: raw.slug, label: raw.label, postCount: raw.posts });

export class SeedSearchRepository extends SearchRepository {
  async search(query, { limit = 20 } = {}) {
    return {
      interpretation: null,
      posts: searchPosts(query, undefined, limit).map(createPost),
      people: [],
      topics: suggestTopics(query).map(toDomainTopic),
    };
  }

  async trendingTopics() {
    return DEFAULT_TOPICS.map(toDomainTopic);
  }
}

export default SeedSearchRepository;
