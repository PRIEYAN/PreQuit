import React from 'react';

import { DependencyProvider } from '../src/presentation/container/DependencyProvider';
import { SessionProvider } from '../src/presentation/hooks/useSession';
import { SignInUseCase } from '../src/application/auth/SignInUseCase';
import { SignUpUseCase } from '../src/application/auth/SignUpUseCase';
import { SignOutUseCase } from '../src/application/auth/SignOutUseCase';
import { RestoreSessionUseCase } from '../src/application/auth/RestoreSessionUseCase';
import { LoadFeedUseCase } from '../src/application/feed/LoadFeedUseCase';
import { ToggleLikeUseCase } from '../src/application/engagement/ToggleLikeUseCase';
import { ToggleSaveUseCase } from '../src/application/engagement/ToggleSaveUseCase';
import { LoadCommentsUseCase } from '../src/application/engagement/LoadCommentsUseCase';
import { AddCommentUseCase } from '../src/application/engagement/AddCommentUseCase';
import { SearchContentUseCase } from '../src/application/search/SearchContentUseCase';
import { LoadTrendingTopicsUseCase } from '../src/application/search/LoadTrendingTopicsUseCase';
import { LoadConversationsUseCase } from '../src/application/messaging/LoadConversationsUseCase';
import { LoadMessagesUseCase } from '../src/application/messaging/LoadMessagesUseCase';
import { SendMessageUseCase } from '../src/application/messaging/SendMessageUseCase';
import { OpenConversationUseCase } from '../src/application/messaging/OpenConversationUseCase';
import { LoadMyProfileUseCase } from '../src/application/profile/LoadMyProfileUseCase';
import { LoadUserPostsUseCase } from '../src/application/profile/LoadUserPostsUseCase';
import {
  FakeAuthRepository,
  FakeFeedRepository,
  FakeMessagingRepository,
  FakePostRepository,
  FakeProfileRepository,
  FakeSearchRepository,
  FakeSessionRepository,
} from './fakeRepositories';

export const createTestContainer = (overrides = {}) => {
  const repositories = {
    auth: new FakeAuthRepository(),
    feed: new FakeFeedRepository(),
    post: new FakePostRepository(),
    search: new FakeSearchRepository(),
    messaging: new FakeMessagingRepository(),
    profile: new FakeProfileRepository(),
    ...overrides.repositories,
  };

  const session = overrides.session ?? new FakeSessionRepository();
  const sessionLostListeners = new Set();

  return {
    repositories,
    session,
    useCases: {
      signIn: new SignInUseCase(repositories.auth, session),
      signUp: new SignUpUseCase(repositories.auth),
      signOut: new SignOutUseCase(repositories.auth, session),
      restoreSession: new RestoreSessionUseCase(repositories.auth, session),
      loadFeed: new LoadFeedUseCase(repositories.feed),
      toggleLike: new ToggleLikeUseCase(repositories.post),
      toggleSave: new ToggleSaveUseCase(repositories.post),
      loadComments: new LoadCommentsUseCase(repositories.post),
      addComment: new AddCommentUseCase(repositories.post),
      search: new SearchContentUseCase(repositories.search),
      loadTrendingTopics: new LoadTrendingTopicsUseCase(repositories.search),
      loadConversations: new LoadConversationsUseCase(repositories.messaging),
      loadMessages: new LoadMessagesUseCase(repositories.messaging),
      sendMessage: new SendMessageUseCase(repositories.messaging),
      openConversation: new OpenConversationUseCase(repositories.messaging),
      loadMyProfile: new LoadMyProfileUseCase(repositories.profile),
      loadUserPosts: new LoadUserPostsUseCase(repositories.profile),
    },
    onSessionLost(listener) {
      sessionLostListeners.add(listener);
      return () => sessionLostListeners.delete(listener);
    },
    notifySessionLost() {
      sessionLostListeners.forEach(listener => listener());
    },
  };
};

export const withContainer = container => children => (
  <DependencyProvider container={container}>{children}</DependencyProvider>
);

export const withSession = container => children => (
  <DependencyProvider container={container}>
    <SessionProvider>{children}</SessionProvider>
  </DependencyProvider>
);

export default createTestContainer;
