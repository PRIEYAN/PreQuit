import { useCallback, useEffect, useRef, useState } from 'react';

export const useAsyncResource = (loader, { initialData = null, enabled = true, deps = [] } = {}) => {
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(
    async ({ refresh = false } = {}) => {
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
    run();
  }, [run]);

  return {
    data,
    setData,
    isLoading,
    isRefreshing,
    error,
    reload: run,
    refresh: useCallback(() => run({ refresh: true }), [run]),
  };
};

export default useAsyncResource;
