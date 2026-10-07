import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';

import DM from '../src/presentation/screens/friends/dm';
import { createMessage } from '../src/domain/entities/Message';
import { flush } from '../test-support/renderHookValue';
import { createTestContainer, withSession } from '../test-support/testContainer';
import { FakeSessionRepository } from '../test-support/fakeRepositories';

const mockGoBack = jest.fn();
let mockRouteParams = {};

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
    .flatMap(node => node.children)
    .filter(child => typeof child === 'string');

const thread = conversationId => [
  createMessage({ id: 'm1', conversationId, senderId: 'peer', body: 'Did you see the checklist?' }, 'me'),
  createMessage({ id: 'm2', conversationId, senderId: 'me', body: 'Went through it this morning.' }, 'me'),
];

const renderDM = async (params, container) => {
  mockRouteParams = params;
  let tree;
  await act(async () => {
    tree = ReactTestRenderer.create(withSession(container)(<DM />));
  });
  await flush();
  await act(async () => {
    jest.runOnlyPendingTimers();
  });
  return tree;
};

const signedInContainer = () => {
  const session = new FakeSessionRepository({ accessToken: 'a', refreshToken: 'r' });
  return createTestContainer({ session });
};

beforeEach(() => {
  jest.useFakeTimers();
  mockGoBack.mockClear();
});

afterEach(async () => {
  await act(async () => {
    jest.runOnlyPendingTimers();
  });
  jest.useRealTimers();
});

describe('DM screen', () => {
  it('shows the person it was handed in the header', async () => {
    const container = signedInContainer();
    const tree = await renderDM({ conversationId: '1', name: 'Nova', status: 'Online' }, container);

    const texts = textsIn(tree);
    expect(texts).toContain('Nova');
    expect(texts).toContain('Online');
  });

  it('renders the conversation history from the repository', async () => {
    const container = signedInContainer();
    container.repositories.messaging.threads['1'] = thread('1');

    const tree = await renderDM({ conversationId: '1', name: 'Nova' }, container);
    const texts = textsIn(tree);

    expect(texts).toContain('Did you see the checklist?');
    expect(texts).toContain('Went through it this morning.');
  });

  it('opens a conversation from a peer id when none was passed', async () => {
    const container = signedInContainer();
    await renderDM({ peerId: 'u_atlas', name: 'Atlas' }, container);

    expect(container.repositories.messaging.opened).toEqual(['u_atlas']);
  });

  it('appends a sent message and keeps it after the server confirms', async () => {
    const container = signedInContainer();
    container.repositories.messaging.threads['1'] = [];
    const tree = await renderDM({ conversationId: '1', name: 'Nova' }, container);

    const input = tree.root.findByType('TextInput');
    await act(async () => input.props.onChangeText('Shipping tonight'));
    await act(async () => input.props.onSubmitEditing());
    await flush();

    expect(textsIn(tree)).toContain('Shipping tonight');
    expect(container.repositories.messaging.sent[0].body).toBe('Shipping tonight');
  });

  it('marks a message as undelivered when sending fails', async () => {
    const container = signedInContainer();
    container.repositories.messaging.threads['1'] = [];
    container.repositories.messaging.failSend = true;
    const tree = await renderDM({ conversationId: '1', name: 'Nova' }, container);

    const input = tree.root.findByType('TextInput');
    await act(async () => input.props.onChangeText('will not arrive'));
    await act(async () => input.props.onSubmitEditing());
    await flush();

    expect(textsIn(tree)).toContain('Not delivered');
  });

  it('ignores an empty draft', async () => {
    const container = signedInContainer();
    container.repositories.messaging.threads['1'] = [];
    const tree = await renderDM({ conversationId: '1', name: 'Nova' }, container);

    const input = tree.root.findByType('TextInput');
    await act(async () => input.props.onChangeText('   '));
    await act(async () => input.props.onSubmitEditing());
    await flush();

    expect(container.repositories.messaging.sent).toEqual([]);
  });

  it('goes back when the header chevron is pressed', async () => {
    const container = signedInContainer();
    const tree = await renderDM({ conversationId: '1', name: 'Nova' }, container);

    const pressables = tree.root.findAllByType('View').length;
    expect(pressables).toBeGreaterThan(0);

    const backPressable = tree.root
      .findAll(node => typeof node.type === 'object' || typeof node.type === 'function')
      .find(node => node.props?.onPress && node.props?.hitSlop === 10);

    await act(async () => backPressable.props.onPress());
    expect(mockGoBack).toHaveBeenCalled();
  });
});
