/**
 * @format
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';

import DM from '../src/screens/friends/dm';
import { threadFor } from '../src/screens/friends/dm/mockThreads';

const mockGoBack = jest.fn();
let mockRouteParams = {};

// The screen reads insets directly; outside a SafeAreaProvider that throws.
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack, navigate: jest.fn() }),
  useRoute: () => ({ params: mockRouteParams }),
}));

const textsIn = tree =>
  tree.root
    .findAllByType('Text')
    .flatMap(n => n.children)
    .filter(c => typeof c === 'string');

const renderDM = params => {
  mockRouteParams = params;
  let tree;
  act(() => {
    tree = ReactTestRenderer.create(<DM />);
  });
  return tree;
};

describe('DM screen', () => {
  it('shows the person it was handed in the header', () => {
    const texts = textsIn(renderDM({ chatId: '1', name: 'Nova', status: 'Online' }));
    expect(texts).toContain('Nova');
    expect(texts).toContain('Online');
  });

  it('renders that person’s previous messages', () => {
    const texts = textsIn(renderDM({ chatId: '1', name: 'Nova' }));
    expect(texts).toContain('See you at the launch 🚀');
    expect(texts).toContain('Analytics keys and the store screenshots.');
  });

  it('keeps threads separate per chat', () => {
    const texts = textsIn(renderDM({ chatId: '2', name: 'Kairo' }));
    expect(texts).toContain('Sent the mockups over');
    // Nova's history must not leak into Kairo's thread.
    expect(texts).not.toContain('See you at the launch 🚀');
  });

  it('opens an empty thread for an unknown chat instead of crashing', () => {
    expect(threadFor('nope')).toEqual([]);
    const texts = textsIn(renderDM({ chatId: 'nope', name: 'Stranger' }));
    expect(texts).toContain('Stranger');
  });

  it('falls back to a default title when opened with no params', () => {
    const texts = textsIn(renderDM(undefined));
    expect(texts).toContain('Chat');
  });
});
