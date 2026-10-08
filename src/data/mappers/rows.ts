export interface ListEnvelope<T> {
  readonly data?: readonly T[];
  readonly items?: readonly T[];
}

export type ListLike<T> = readonly T[] | ListEnvelope<T> | null | undefined;

const isArrayLike = <T,>(value: ListLike<T>): value is readonly T[] => Array.isArray(value);

export const rowsOf = <T,>(dto: ListLike<T>): readonly T[] => {
  if (!dto) return [];
  if (isArrayLike(dto)) return dto;
  return dto.data ?? dto.items ?? [];
};
