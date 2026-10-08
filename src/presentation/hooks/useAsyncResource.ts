import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react';

export interface AsyncResourceOptions<T> {
  readonly initialData?: T | null;
  readonly enabled?: boolean;
  readonly deps?: DependencyList;
}

export interface AsyncResource<T> {
  readonly data: T | null;
  readonly isLoading: boolean;
  readonly isRefreshing: boolean;
  readonly error: unknown;
  reload(options?: { refresh?: boolean }): Promise<void>;
  refresh(): Promise<void>;
}

export const useAsyncResource = <T,>(
  loader: () => Promise<T>,
  options: AsyncResourceOptions<T> = {},
): AsyncResource<T> => {
  const { initialData = null, enabled = true, deps = [] } = options;

  const [data, setData] = useState<T | null>(initialData);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(
    async ({ refresh = false }: { refresh?: boolean } = {}): Promise<void> => {
      if (!enabled) {
        setIsLoading(false);
        return;
      }
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      try {
        const result = await loader();
        if (mounted.current) setData(result);
      } catch (caught) {
        if (mounted.current) setError(caught);
      } finally {
        if (mounted.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enabled, ...deps],
  );

  useEffect(() => {
    run().catch(() => undefined);
  }, [run]);

  const refresh = useCallback(() => run({ refresh: true }), [run]);

  return { data, isLoading, isRefreshing, error, reload: run, refresh };
};

export default useAsyncResource;
