import { isOfflineError } from '../../domain/errors/AppError';
import type { User } from '../../domain/entities/User';
import type { AuthRepository } from '../../domain/repositories/AuthRepository';
import type { SessionRepository } from '../../domain/repositories/SessionRepository';

export const SessionStatus = {
  SIGNED_IN: 'signedIn',
  SIGNED_OUT: 'signedOut',
} as const;

export type SessionStatusValue = (typeof SessionStatus)[keyof typeof SessionStatus];

export interface RestoredSession {
  readonly status: SessionStatusValue;
  readonly user: User | null;
}

export class RestoreSessionUseCase {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly sessionRepository: SessionRepository,
  ) {}

  async execute(): Promise<RestoredSession> {
    const stored = await this.sessionRepository.read();
    if (!stored.accessToken) return { status: SessionStatus.SIGNED_OUT, user: null };

    try {
      const user = await this.authRepository.me();
      await this.sessionRepository.write({ ...stored, user });
      return { status: SessionStatus.SIGNED_IN, user };
    } catch (error) {
      if (isOfflineError(error) && stored.user) {
        return { status: SessionStatus.SIGNED_IN, user: stored.user };
      }
      await this.sessionRepository.clear();
      return { status: SessionStatus.SIGNED_OUT, user: null };
    }
  }
}

export default RestoreSessionUseCase;
