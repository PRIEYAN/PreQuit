import { apiConfig, DataSource } from '../../data/config/apiConfig';
import { HttpClient } from '../../data/http/HttpClient';
import { AsyncStorageSessionRepository } from '../../data/storage/AsyncStorageSessionRepository';
import { HttpAuthRepository } from '../../data/repositories/HttpAuthRepository';
import { HttpFeedRepository } from '../../data/repositories/HttpFeedRepository';
import { HttpPostRepository } from '../../data/repositories/HttpPostRepository';
import { HttpSearchRepository } from '../../data/repositories/HttpSearchRepository';
import { HttpMessagingRepository } from '../../data/repositories/HttpMessagingRepository';
import { HttpProfileRepository } from '../../data/repositories/HttpProfileRepository';
import { HttpSocialRepository } from '../../data/repositories/HttpSocialRepository';
import { SeedFeedRepository } from '../../data/repositories/seed/SeedFeedRepository';
import { SeedPostRepository } from '../../data/repositories/seed/SeedPostRepository';
import { SeedSearchRepository } from '../../data/repositories/seed/SeedSearchRepository';
import { SeedMessagingRepository } from '../../data/repositories/seed/SeedMessagingRepository';
import { SeedProfileRepository } from '../../data/repositories/seed/SeedProfileRepository';
import { SeedSocialRepository } from '../../data/repositories/seed/SeedSocialRepository';
import { withSeedFallback } from '../../data/repositories/withSeedFallback';

import { SignInUseCase } from '../../application/auth/SignInUseCase';
import { SignUpUseCase } from '../../application/auth/SignUpUseCase';
import { SignOutUseCase } from '../../application/auth/SignOutUseCase';
import { RestoreSessionUseCase } from '../../application/auth/RestoreSessionUseCase';
import { LoadFeedUseCase } from '../../application/feed/LoadFeedUseCase';
import { ToggleLikeUseCase } from '../../application/engagement/ToggleLikeUseCase';
import { ToggleSaveUseCase } from '../../application/engagement/ToggleSaveUseCase';
import { LoadCommentsUseCase } from '../../application/engagement/LoadCommentsUseCase';
import { AddCommentUseCase } from '../../application/engagement/AddCommentUseCase';
import { SearchContentUseCase } from '../../application/search/SearchContentUseCase';
import { LoadTrendingTopicsUseCase } from '../../application/search/LoadTrendingTopicsUseCase';
import { LoadConversationsUseCase } from '../../application/messaging/LoadConversationsUseCase';
import { LoadMessagesUseCase } from '../../application/messaging/LoadMessagesUseCase';
import { SendMessageUseCase } from '../../application/messaging/SendMessageUseCase';
import { OpenConversationUseCase } from '../../application/messaging/OpenConversationUseCase';
import { LoadMyProfileUseCase } from '../../application/profile/LoadMyProfileUseCase';
import { LoadUserPostsUseCase } from '../../application/profile/LoadUserPostsUseCase';

const buildRepositories = (config, http, onFallback) => {
  const live = {
    auth: new HttpAuthRepository(http),
    feed: new HttpFeedRepository(http),
    post: new HttpPostRepository(http),
    search: new HttpSearchRepository(http),
    messaging: new HttpMessagingRepository(http),
    profile: new HttpProfileRepository(http),
    social: new HttpSocialRepository(http),
  };

  const seed = {
    feed: new SeedFeedRepository(),
    post: new SeedPostRepository(),
    search: new SeedSearchRepository(),
    messaging: new SeedMessagingRepository(),
    profile: new SeedProfileRepository(),
    social: new SeedSocialRepository(),
  };

  if (config.dataSource === DataSource.SEED) return { ...live, ...seed };
  if (config.dataSource === DataSource.API) return live;

  return {
    auth: live.auth,
    feed: withSeedFallback(live.feed, seed.feed, onFallback),
    post: withSeedFallback(live.post, seed.post, onFallback),
    search: withSeedFallback(live.search, seed.search, onFallback),
    messaging: withSeedFallback(live.messaging, seed.messaging, onFallback),
    profile: withSeedFallback(live.profile, seed.profile, onFallback),
    social: withSeedFallback(live.social, seed.social, onFallback),
  };
};

const buildUseCases = (repositories, session) => ({
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
});

export const createContainer = ({ config = apiConfig, session, onSessionLost, onFallback } = {}) => {
  const sessionRepository = session ?? new AsyncStorageSessionRepository();
  const sessionLostListeners = new Set();
  if (onSessionLost) sessionLostListeners.add(onSessionLost);

  const http = new HttpClient({
    baseUrl: config.baseUrl,
    timeoutMs: config.requestTimeoutMs,
    session: sessionRepository,
    onSessionLost: () => sessionLostListeners.forEach(listener => listener()),
  });

  const repositories = buildRepositories(config, http, onFallback ?? (() => {}));

  return {
    config,
    http,
    session: sessionRepository,
    repositories,
    useCases: buildUseCases(repositories, sessionRepository),
    onSessionLost(listener) {
      sessionLostListeners.add(listener);
      return () => sessionLostListeners.delete(listener);
    },
  };
};

export default createContainer;
