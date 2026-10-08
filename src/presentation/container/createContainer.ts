import { apiConfig, DataSource, type ApiConfig } from '../../data/config/apiConfig';
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
import { withSeedFallback, type FallbackNotifier } from '../../data/repositories/withSeedFallback';

import type { AuthRepository } from '../../domain/repositories/AuthRepository';
import type { FeedRepository } from '../../domain/repositories/FeedRepository';
import type { MessagingRepository } from '../../domain/repositories/MessagingRepository';
import type { PostRepository } from '../../domain/repositories/PostRepository';
import type { ProfileRepository } from '../../domain/repositories/ProfileRepository';
import type { SearchRepository } from '../../domain/repositories/SearchRepository';
import type { SessionRepository } from '../../domain/repositories/SessionRepository';
import type { SocialRepository } from '../../domain/repositories/SocialRepository';

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

export interface Repositories {
  readonly auth: AuthRepository;
  readonly feed: FeedRepository;
  readonly post: PostRepository;
  readonly search: SearchRepository;
  readonly messaging: MessagingRepository;
  readonly profile: ProfileRepository;
  readonly social: SocialRepository;
}

export interface UseCases {
  readonly signIn: SignInUseCase;
  readonly signUp: SignUpUseCase;
  readonly signOut: SignOutUseCase;
  readonly restoreSession: RestoreSessionUseCase;
  readonly loadFeed: LoadFeedUseCase;
  readonly toggleLike: ToggleLikeUseCase;
  readonly toggleSave: ToggleSaveUseCase;
  readonly loadComments: LoadCommentsUseCase;
  readonly addComment: AddCommentUseCase;
  readonly search: SearchContentUseCase;
  readonly loadTrendingTopics: LoadTrendingTopicsUseCase;
  readonly loadConversations: LoadConversationsUseCase;
  readonly loadMessages: LoadMessagesUseCase;
  readonly sendMessage: SendMessageUseCase;
  readonly openConversation: OpenConversationUseCase;
  readonly loadMyProfile: LoadMyProfileUseCase;
  readonly loadUserPosts: LoadUserPostsUseCase;
}

export type Unsubscribe = () => void;

export interface AppContainer {
  readonly config: ApiConfig;
  readonly http: HttpClient;
  readonly session: SessionRepository;
  readonly repositories: Repositories;
  readonly useCases: UseCases;
  onSessionLost(listener: () => void): Unsubscribe;
}

export interface ContainerOptions {
  readonly config?: ApiConfig;
  readonly session?: SessionRepository;
  readonly onSessionLost?: () => void;
  readonly onFallback?: FallbackNotifier;
}

const buildRepositories = (
  config: ApiConfig,
  http: HttpClient,
  onFallback: FallbackNotifier,
): Repositories => {
  const live: Repositories = {
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

const buildUseCases = (repositories: Repositories, session: SessionRepository): UseCases => ({
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

export const createContainer = (options: ContainerOptions = {}): AppContainer => {
  const config = options.config ?? apiConfig;
  const sessionRepository = options.session ?? new AsyncStorageSessionRepository();
  const sessionLostListeners = new Set<() => void>();
  if (options.onSessionLost) sessionLostListeners.add(options.onSessionLost);

  const http = new HttpClient({
    baseUrl: config.baseUrl,
    timeoutMs: config.requestTimeoutMs,
    session: sessionRepository,
    onSessionLost: () => sessionLostListeners.forEach(listener => listener()),
  });

  const repositories = buildRepositories(config, http, options.onFallback ?? (() => {}));

  return {
    config,
    http,
    session: sessionRepository,
    repositories,
    useCases: buildUseCases(repositories, sessionRepository),
    onSessionLost(listener: () => void): Unsubscribe {
      sessionLostListeners.add(listener);
      return () => {
        sessionLostListeners.delete(listener);
      };
    },
  };
};

export default createContainer;
