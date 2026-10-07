import { AppError } from '../../domain/errors/AppError';

const shouldFallBack = error => error instanceof AppError && error.isOffline;

export const withSeedFallback = (primary, fallback, onFallback = () => {}) =>
  new Proxy(primary, {
    get(target, property, receiver) {
      const original = Reflect.get(target, property, receiver);
      if (typeof original !== 'function') return original;

      return async (...args) => {
        try {
          return await original.apply(target, args);
        } catch (error) {
          if (!shouldFallBack(error)) throw error;
          const substitute = fallback[property];
          if (typeof substitute !== 'function') throw error;
          onFallback(String(property), error);
          return substitute.apply(fallback, args);
        }
      };
    },
  });

export default withSeedFallback;
