import { FeedRepository } from '../src/domain/repositories/FeedRepository';
import { PostRepository } from '../src/domain/repositories/PostRepository';
import { SearchRepository } from '../src/domain/repositories/SearchRepository';
import { MessagingRepository } from '../src/domain/repositories/MessagingRepository';
import { ProfileRepository } from '../src/domain/repositories/ProfileRepository';
import { AuthRepository } from '../src/domain/repositories/AuthRepository';
import { SessionRepository } from '../src/domain/repositories/SessionRepository';
import { createPost } from '../src/domain/entities/Post';
import { createUser } from '../src/domain/entities/User';
import { createComment } from '../src/domain/entities/Comment';
import { createMessage } from '../src/domain/entities/Message';

export const samplePost = (id, over = {}) =>
  createPost({
    id,
    author: { id: 'a1', handle: 'nova', displayName: 'Nova', avatarUrl: null },
    description: 'hello',
    counts: { likes: 2, comments: 0, shares: 0, saves: 1 },
    viewer: { hasLiked: false, hasSaved: false },
    reason: { kind: 'fresh', label: 'Recently posted' },
    ...over,
  });

export class FakeFeedRepository extends FeedRepository {
  constructor(items = [samplePost('p1')]) {
    super();
    this.items = items;
    this.calls = [];
    this.failure = null;
  }

  async load(surface, options) {
    this.calls.push({ surface, options });
    if (this.failure) throw this.failure;
    return { items: this.items, nextCursor: null };
  }
}

export class FakePostRepository extends PostRepository {
  constructor() {
    super();
    this.liked = [];
    this.unliked = [];
    this.saved = [];
    this.unsaved = [];
    this.commentsByPost = {};
    this.failOn = new Set();
  }

  async byId(postId) {
    return samplePost(postId);
  }

  async like(postId) {
    if (this.failOn.has('like')) throw new Error('like failed');
    this.liked.push(postId);
  }

  async unlike(postId) {
    if (this.failOn.has('unlike')) throw new Error('unlike failed');
    this.unliked.push(postId);
  }

  async save(postId) {
    if (this.failOn.has('save')) throw new Error('save failed');
    this.saved.push(postId);
  }

  async unsave(postId) {
    this.unsaved.push(postId);
  }

  async comments(postId) {
    return this.commentsByPost[postId] ?? [];
  }

  async addComment(postId, body) {
    const created = createComment({
      id: `c_${body}`,
      postId,
      author: { id: 'me', handle: 'you', displayName: 'You' },
      body,
    });
    this.commentsByPost[postId] = [...(this.commentsByPost[postId] ?? []), created];
    return created;
  }
}

export class FakeSearchRepository extends SearchRepository {
  constructor() {
    super();
    this.queries = [];
    this.results = { interpretation: null, posts: [], people: [], topics: [] };
    this.trending = [];
  }

  async search(query) {
    this.queries.push(query);
    return this.results;
  }

  async trendingTopics() {
    return this.trending;
  }
}

export class FakeMessagingRepository extends MessagingRepository {
  constructor() {
    super();
    this.sent = [];
    this.threads = {};
    this.conversationList = [];
    this.opened = [];
    this.failSend = false;
  }

  async conversations() {
    return this.conversationList;
  }

  async openConversation(peerId) {
    this.opened.push(peerId);
    return `conv_${peerId}`;
  }

  async messages(conversationId) {
    return this.threads[conversationId] ?? [];
  }

  async sendMessage(conversationId, payload) {
    if (this.failSend) throw new Error('send failed');
    this.sent.push({ conversationId, ...payload });
    return createMessage(
      { id: `srv_${payload.clientNonce}`, conversationId, senderId: 'me', body: payload.body },
      'me',
    );
  }

  async markRead() {}
}

export class FakeProfileRepository extends ProfileRepository {
  constructor(profile = createUser({ id: 'me', handle: 'you', displayName: 'You' })) {
    super();
    this.profile = profile;
  }

  async myProfile() {
    return this.profile;
  }

  async byHandle(handle) {
    return createUser({ id: handle, handle, displayName: handle });
  }

  async postsOf() {
    return [];
  }

  async updateProfile() {}
}

export class FakeAuthRepository extends AuthRepository {
  constructor() {
    super();
    this.user = createUser({ id: 'me', handle: 'you', displayName: 'You' });
    this.signInError = null;
    this.meError = null;
  }

  async signIn() {
    if (this.signInError) throw this.signInError;
    return { accessToken: 'a', refreshToken: 'r', user: this.user };
  }

  async signUp() {
    return { user: this.user, nextStep: 'verify_email' };
  }

  async signOut() {}

  async me() {
    if (this.meError) throw this.meError;
    return this.user;
  }

  async isHandleAvailable() {
    return true;
  }

  async requestPasswordReset() {}
}

export class FakeSessionRepository extends SessionRepository {
  constructor(initial = {}) {
    super();
    this.state = { accessToken: null, refreshToken: null, user: null, ...initial };
  }

  accessToken() {
    return this.state.accessToken;
  }

  refreshToken() {
    return this.state.refreshToken;
  }

  async read() {
    return this.state;
  }

  async write(next) {
    this.state = { ...this.state, ...next };
  }

  async clear() {
    this.state = { accessToken: null, refreshToken: null, user: null };
  }
}
