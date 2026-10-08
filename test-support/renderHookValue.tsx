import React, { type ReactElement, type ReactNode } from 'react';
import ReactTestRenderer, { act, type ReactTestRenderer as Renderer } from 'react-test-renderer';

export type Wrapper = (children: ReactElement) => ReactElement;

export interface HookHandle<T> {
  readonly ref: { current: T };
  unmount(): void;
}

const identity: Wrapper = children => children;

export const renderHookValue = <T,>(hook: () => T, wrap: Wrapper = identity): HookHandle<T> => {
  const ref = { current: undefined as unknown as T };

  const Probe = (): ReactNode => {
    ref.current = hook();
    return null;
  };

  let renderer: Renderer | undefined;
  act(() => {
    renderer = ReactTestRenderer.create(wrap(<Probe />));
  });

  return {
    ref,
    unmount: () =>
      act(() => {
        renderer?.unmount();
      }),
  };
};

export const flush = async (): Promise<void> => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
};

export const actAsync = async (run: () => unknown): Promise<void> => {
  await act(async () => {
    await run();
  });
};

export default renderHookValue;
