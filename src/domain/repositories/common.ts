export interface RequestOptions {
  readonly signal?: AbortSignal;
}

export interface PageOptions extends RequestOptions {
  readonly limit?: number;
  readonly before?: string;
}

export interface Page<T> {
  readonly items: readonly T[];
  readonly nextCursor: string | null;
}
