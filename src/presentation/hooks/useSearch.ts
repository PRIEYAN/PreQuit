import { useCallback, useEffect, useRef, useState } from 'react';

import { useUseCases } from '../container/DependencyProvider';
import { useAsyncResource } from './useAsyncResource';
import type { Topic } from '../../domain/entities/Topic';
import type { SearchResults } from '../../domain/repositories/SearchRepository';

const DEBOUNCE_MS = 280;

const EMPTY_RESULTS: SearchResults = {
  interpretation: null,
  posts: [],
  people: [],
  topics: [],
};

export interface SearchViewModel {
  readonly query: string;
  setQuery(next: string): void;
  clear(): void;
  readonly isSearching: boolean;
  readonly isActive: boolean;
  readonly results: SearchResults;
  readonly trendingTopics: readonly Topic[];
}

export const useSearch = (): SearchViewModel => {
  const useCases = useUseCases();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS);
  const [isSearching, setIsSearching] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const trendingLoader = useCallback(
    () => useCases.loadTrendingTopics.execute(),
    [useCases],
  );
  const trending = useAsyncResource<readonly Topic[]>(trendingLoader, { initialData: [] });

  useEffect(() => {
    if (!debounced) {
      setResults(EMPTY_RESULTS);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    setIsSearching(true);

    useCases.search
      .execute(debounced)
      .then(found => {
        if (!cancelled && mounted.current) setResults(found);
      })
      .catch(() => {
        if (!cancelled && mounted.current) setResults(EMPTY_RESULTS);
      })
      .finally(() => {
        if (!cancelled && mounted.current) setIsSearching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [useCases, debounced]);

  return {
    query,
    setQuery,
    clear: useCallback(() => setQuery(''), []),
    isSearching,
    isActive: debounced.length > 0,
    results,
    trendingTopics: trending.data ?? [],
  };
};

export default useSearch;
