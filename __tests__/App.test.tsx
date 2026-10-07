import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

test('mounts the app shell without throwing', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
