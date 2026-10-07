import { AuthRepository } from '../../domain/repositories/AuthRepository';
import { toUser } from '../mappers/UserMapper';

const PUBLIC = { authenticated: false };

export class HttpAuthRepository extends AuthRepository {
  constructor(http) {
    super();
    this.http = http;
  }

  async signIn(identifier, password) {
    const data = await this.http.post('/auth/login', { identifier, password }, PUBLIC);
    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: toUser(data.user),
    };
  }

  async signUp(details) {
    const data = await this.http.post('/auth/register', details, PUBLIC);
    return { user: toUser(data.user), nextStep: data.nextStep ?? 'verify_email' };
  }

  signOut() {
    return this.http.post('/auth/logout');
  }

  async me() {
    return toUser(await this.http.get('/auth/me'));
  }

  async isHandleAvailable(handle) {
    const data = await this.http.get(`/auth/handle-available?handle=${encodeURIComponent(handle)}`, PUBLIC);
    return Boolean(data?.available);
  }

  requestPasswordReset(email) {
    return this.http.post('/auth/password/forgot', { email }, PUBLIC);
  }
}

export default HttpAuthRepository;
