import { createPost, type Post, type PostPayload } from '../src/domain/entities/Post';
import { createUser, type User } from '../src/domain/entities/User';
import { createComment, type Comment } from '../src/domain/entities/Comment';
import { createMessage, type Message } from '../src/domain/entities/Message';
import type { Conversation } from '../src/domain/entities/Conversation';
import type { Topic } from '../src/domain/entities/Topic';
import type {
  AuthRepository,
  AuthSession,
  RegistrationResult,
} from '../src/domain/repositories/AuthRepository';
import type {
  FeedRepository,
  FeedSurfaceValue,
} from '../src/domain/repositories/FeedRepository';
import type { PostRepository } from '../src/domain/repositories/PostRepository';
import type {
  SearchRepository,
  SearchResults,
} from '../src/domain/repositories/SearchRepository';
import type {
  MessagingRepository,
  OutgoingMessage,
} from '../src/domain/repositories/MessagingRepository';
import type { ProfileRepository } from '../src/domain/repositories/ProfileRepository';
import type {
  SessionRepository,
  SessionWrite,
  StoredSession,
} from '../src/domain/repositories/SessionRepository';
import type { SocialRepository } from '../src/domain/repositories/SocialRepository';
import type { Page, PageOptions } from '../src/domain/repositories/common';

export const samplePost = (id: string, over: PostPayload = {}): Post =>
  createPost({
    id,
    author: { id: 'a1', handle: 'nova', displayName: 'Nova', avatarUrl: null },
    description: 'hello',
    counts: { likes: 2, comments: 0, shares: 0, saves: 1 },
    viewer: { hasLiked: false, hasSaved: false },
    reason: { kind: 'fresh', label: 'Recently posted' },
    ...over,
  });

export class FakeFeedRepository implements FeedRepository {
  readonly calls: { surface?: FeedSurfaceValue; options?: PageOptions }[] = [];
  failure: Error | null = null;

  constructor(private readonly items: readonly Post[] = [samplePost('p1')]) {}

  async load(surface?: FeedSurfaceValue, options?: PageOptions): Promise<Page<Post>> {
    this.calls.push({ surface, options });
    if (this.failure) throw this.failure;
    return { items: this.items, nextCursor: null };
  }
}

export class FakePostRepository implements PostRepository {
  readonly liked: string[] = [];
  readonly unliked: string[] = [];
  readonly saved: string[] = [];
  readonly unsaved: string[] = [];
  readonly commentsByPost: Record<string, readonly Comment[]> = {};
  readonly failOn = new Set<string>();

  async byId(postId: string): Promise<Post> {
    return samplePost(postId);
  }

  async like(postId: string): Promise<void> {
    if (this.failOn.has('like')) throw new Error('like failed');
    this.liked.push(postId);
  }

  async unlike(postId: string): Promise<void> {
    if (this.failOn.has('unlike')) throw new Error('unlike failed');
    this.unliked.push(postId);
  }

  async save(postId: string): Promise<void> {
    if (this.failOn.has('save')) throw new Error('save failed');
    this.saved.push(postId);
  }

  async unsave(postId: string): Promise<void> {
    this.unsaved.push(postId);
  }

  async comments(postId: string): Promise<readonly Comment[]> {
    return this.commentsByPost[postId] ?? [];
  }

  async addComment(postId: string, body: string): Promise<Comment> {
    const created = createComment({
      id: `c_${body}`,
      postId,
      author: { id: 'me', handle: 'you', displayName: 'You', avatarUrl: null },
      body,
    });
    this.commentsByPost[postId] = [...(this.commentsByPost[postId] ?? []), created];
    return created;
  }
}

export class FakeSearchRepository implements SearchRepository {
  readonly queries: string[] = [];
  results: SearchResults = { interpretation: null, posts: [], people: [], topics: [] };
  trending: readonly Topic[] = [];

  async search(query: string): Promise<SearchResults> {
    this.queries.push(query);
    return this.results;
  }

  async trendingTopics(): Promise<readonly Topic[]> {
    return this.trending;
  }
}

export class FakeMessagingRepository implements MessagingRepository {
  readonly sent: (OutgoingMessage & { conversationId: string })[] = [];
  readonly threads: Record<string, readonly Message[]> = {};
  conversationList: readonly Conversation[] = [];
  readonly opened: string[] = [];
  failSend = false;

  async conversations(): Promise<readonly Conversation[]> {
    return this.conversationList;
  }

  async openConversation(peerId: string): Promise<string> {
    this.opened.push(peerId);
    return `conv_${peerId}`;
  }

  async messages(conversationId: string): Promise<readonly Message[]> {
    return this.threads[conversationId] ?? [];
  }

  async sendMessage(conversationId: string, message: OutgoingMessage): Promise<Message> {
    if (this.failSend) throw new Error('send failed');
    this.sent.push({ conversationId, ...message });
    return createMessage(
      {
        id: `srv_${message.clientNonce}`,
        conversationId,
        senderId: 'me',
        body: message.body,
      },
      'me',
    );
  }

  async markRead(): Promise<void> {}
}

export class FakeProfileRepository implements ProfileRepository {
  constructor(
    private readonly profile: User = createUser({
      id: 'me',
      handle: 'you',
      displayName: 'You',
    }),
  ) {}

  async myProfile(): Promise<User> {
    return this.profile;
  }

  async byHandle(handle: string): Promise<User> {
    return createUser({ id: handle, handle, displayName: handle });
  }

  async postsOf(): Promise<readonly Post[]> {
    return [];
  }

  async updateProfile(): Promise<void> {}
}

export class FakeAuthRepository implements AuthRepository {
  user: User = createUser({ id: 'me', handle: 'you', displayName: 'You' });
  signInError: Error | null = null;
  meError: Error | null = null;

  async signIn(): Promise<AuthSession> {
    if (this.signInError) throw this.signInError;
    return { accessToken: 'a', refreshToken: 'r', user: this.user };
  }

  async signUp(): Promise<RegistrationResult> {
    return { user: this.user, nextStep: 'verify_email' };
  }

  async signOut(): Promise<void> {}

  async me(): Promise<User> {
    if (this.meError) throw this.meError;
    return this.user;
  }

  async isHandleAvailable(): Promise<boolean> {
    return true;
  }

  async requestPasswordReset(): Promise<void> {}
}

export class FakeSessionRepository implements SessionRepository {
  private state: StoredSession;

  constructor(initial: Partial<StoredSession> = {}) {
    this.state = { accessToken: null, refreshToken: null, user: null, ...initial };
  }

  accessToken(): string | null {
    return this.state.accessToken;
  }

  refreshToken(): string | null {
    return this.state.refreshToken;
  }

  async read(): Promise<StoredSession> {
    return this.state;
  }

  async write(next: SessionWrite): Promise<void> {
    this.state = { ...this.state, ...next };
  }

  async clear(): Promise<void> {
    this.state = { accessToken: null, refreshToken: null, user: null };
  }
}

export class FakeSocialRepositoryStub implements SocialRepository {
  readonly followed: string[] = [];
  readonly unfollowed: string[] = [];

  async follow(userId: string): Promise<void> {
    this.followed.push(userId);
  }

  async unfollow(userId: string): Promise<void> {
    this.unfollowed.push(userId);
  }

  async mutuals(): Promise<readonly string[]> {
    return [];
  }

  async suggested(): Promise<readonly User[]> {
    return [];
  }
}
