import React from 'react';
import ReactTestRenderer, { act, type ReactTestInstance } from 'react-test-renderer';

import DM from '../src/presentation/screens/friends/dm';
import { createMessage, type Message } from '../src/domain/entities/Message';
import { flush } from '../test-support/renderHookValue';
import {
  createTestContainer,
  withSession,
  type TestContainer,
} from '../test-support/testContainer';
import { FakeSessionRepository } from '../test-support/fakeRepositories';
import type { RootStackParamList } from '../src/presentation/navigation/routes';

const mockGoBack = jest.fn();
let mockRouteParams: RootStackParamList['DM'] = {};

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack, navigate: jest.fn() }),
  useRoute: () => ({ params: mockRouteParams }),
}));

const VIEWER = 'me';

const textsIn = (tree: ReactTestRenderer.ReactTestRenderer): string[] =>
  tree.root
    .findAllByType('Text' as unknown as React.ComponentType)
    .flatMap(node => node.children)
    .filter((child): child is string => typeof child === 'string');

const thread = (conversationId: string): Message[] => [
  createMessage(
    { id: 'm1', conversationId, senderId: 'peer', body: 'Did you see the checklist?' },
    VIEWER,
  ),
  createMessage(
    { id: 'm2', conversationId, senderId: VIEWER, body: 'Went through it this morning.' },
    VIEWER,
  ),
];

const renderDM = async (
  params: RootStackParamList['DM'],
  container: TestContainer,
): Promise<ReactTestRenderer.ReactTestRenderer> => {
  mockRouteParams = params;
  let tree: ReactTestRenderer.ReactTestRenderer | undefined;
  await act(async () => {
    tree = ReactTestRenderer.create(withSession(container)(<DM />));
  });
  await flush();
  await act(async () => {
    jest.runOnlyPendingTimers();
  });
  if (!tree) throw new Error('the DM screen did not render');
  return tree;
};

const signedInContainer = (): TestContainer =>
  createTestContainer({
    session: new FakeSessionRepository({ accessToken: 'a', refreshToken: 'r' }),
  });

const inputOf = (tree: ReactTestRenderer.ReactTestRenderer): ReactTestInstance =>
  tree.root.findByType('TextInput' as unknown as React.ComponentType);

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
    const tree = await renderDM({ conversationId: '1', name: 'Nova', status: 'Online' }, signedInContainer());

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

    const input = inputOf(tree);
    await act(async () => input.props.onChangeText('Shipping tonight'));
    await act(async () => input.props.onSubmitEditing());
    await flush();

    expect(textsIn(tree)).toContain('Shipping tonight');
    expect(container.repositories.messaging.sent[0]?.body).toBe('Shipping tonight');
  });

  it('marks a message as undelivered when sending fails', async () => {
    const container = signedInContainer();
    container.repositories.messaging.threads['1'] = [];
    container.repositories.messaging.failSend = true;
    const tree = await renderDM({ conversationId: '1', name: 'Nova' }, container);

    const input = inputOf(tree);
    await act(async () => input.props.onChangeText('will not arrive'));
    await act(async () => input.props.onSubmitEditing());
    await flush();

    expect(textsIn(tree)).toContain('Not delivered');
  });

  it('ignores an empty draft', async () => {
    const container = signedInContainer();
    container.repositories.messaging.threads['1'] = [];
    const tree = await renderDM({ conversationId: '1', name: 'Nova' }, container);

    const input = inputOf(tree);
    await act(async () => input.props.onChangeText('   '));
    await act(async () => input.props.onSubmitEditing());
    await flush();

    expect(container.repositories.messaging.sent).toEqual([]);
  });

  it('goes back when the header chevron is pressed', async () => {
    const tree = await renderDM({ conversationId: '1', name: 'Nova' }, signedInContainer());

    const backPressable = tree.root
      .findAll(node => typeof node.type !== 'string')
      .find(node => node.props?.onPress && node.props?.hitSlop === 10);

    expect(backPressable).toBeDefined();
    await act(async () => backPressable?.props.onPress());
    expect(mockGoBack).toHaveBeenCalled();
  });
});
