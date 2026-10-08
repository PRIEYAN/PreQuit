import { isOfflineError } from '../../domain/errors/AppError';

export type FallbackNotifier = (method: string, error: unknown) => void;

export const withSeedFallback = <T extends object>(
  primary: T,
  fallback: Partial<T>,
  onFallback: FallbackNotifier = () => {},
): T =>
  new Proxy(primary, {
    get(target, property, receiver) {
      const original = Reflect.get(target, property, receiver) as unknown;
      if (typeof original !== 'function') return original;

      return async (...args: unknown[]): Promise<unknown> => {
        try {
          return await (original as (...a: unknown[]) => unknown).apply(target, args);
        } catch (error) {
          if (!isOfflineError(error)) throw error;
          const substitute = (fallback as Record<string | symbol, unknown>)[property];
          if (typeof substitute !== 'function') throw error;
          onFallback(String(property), error);
          return (substitute as (...a: unknown[]) => unknown).apply(fallback, args);
        }
      };
    },
  });

export default withSeedFallback;
