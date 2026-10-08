import type { Post } from '../entities/Post';
import type { Topic } from '../entities/Topic';
import type { User } from '../entities/User';
import type { PageOptions } from './common';

export interface QueryInterpretation {
  readonly intent: string;
  readonly normalisedQuery: string;
  readonly keywords: readonly string[];
  readonly topics: readonly string[];
  readonly expandedTerms: readonly string[];
}

export interface SearchResults {
  readonly interpretation: QueryInterpretation | null;
  readonly posts: readonly Post[];
  readonly people: readonly User[];
  readonly topics: readonly Topic[];
}

export interface SearchRepository {
  search(query: string, options?: PageOptions): Promise<SearchResults>;
  trendingTopics(options?: PageOptions): Promise<readonly Topic[]>;
}
