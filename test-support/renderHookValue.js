import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';

export const renderHookValue = (hook, wrap = children => children) => {
  const ref = { current: null };
  const Probe = () => {
    ref.current = hook();
    return null;
  };

  let renderer;
  act(() => {
    renderer = ReactTestRenderer.create(wrap(<Probe />));
  });

  return { ref, unmount: () => act(() => renderer.unmount()) };
};

export const flush = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
};

export const actAsync = async run => {
  await act(async () => {
    await run();
  });
};

export const settleTimers = async () => {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });
};

export default renderHookValue;
