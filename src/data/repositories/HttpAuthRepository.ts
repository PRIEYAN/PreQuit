import type {
  AuthRepository,
  AuthSession,
  RegistrationDetails,
  RegistrationResult,
} from '../../domain/repositories/AuthRepository';
import type { HttpClient } from '../http/HttpClient';
import { toUser } from '../mappers/UserMapper';
import type { UserPayload } from '../../domain/entities/User';

const PUBLIC = { authenticated: false } as const;

interface LoginDto {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly user: UserPayload;
}

interface RegisterDto {
  readonly user: UserPayload;
  readonly nextStep?: string;
}

export class HttpAuthRepository implements AuthRepository {
  constructor(private readonly http: HttpClient) {}

  async signIn(identifier: string, password: string): Promise<AuthSession> {
    const data = await this.http.post<LoginDto>('/auth/login', { identifier, password }, PUBLIC);
    if (!data) throw new Error('The sign-in response was empty.');
    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: toUser(data.user),
    };
  }

  async signUp(details: RegistrationDetails): Promise<RegistrationResult> {
    const data = await this.http.post<RegisterDto>('/auth/register', details, PUBLIC);
    if (!data) throw new Error('The registration response was empty.');
    return { user: toUser(data.user), nextStep: data.nextStep ?? 'verify_email' };
  }

  signOut(): Promise<unknown> {
    return this.http.post('/auth/logout');
  }

  async me(): Promise<ReturnType<typeof toUser>> {
    return toUser(await this.http.get<UserPayload>('/auth/me'));
  }

  async isHandleAvailable(handle: string): Promise<boolean> {
    const data = await this.http.get<{ available?: boolean }>(
      `/auth/handle-available?handle=${encodeURIComponent(handle)}`,
      PUBLIC,
    );
    return Boolean(data?.available);
  }

  requestPasswordReset(email: string): Promise<unknown> {
    return this.http.post('/auth/password/forgot', { email }, PUBLIC);
  }
}

export default HttpAuthRepository;
