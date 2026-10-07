import { NotImplementedError } from '../errors/AppError';

export const abstractMethod = name => {
  throw new NotImplementedError(name);
};
