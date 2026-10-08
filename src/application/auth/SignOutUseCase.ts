import type { AuthRepository } from '../../domain/repositories/AuthRepository';
import type { SessionRepository } from '../../domain/repositories/SessionRepository';

export class SignOutUseCase {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly sessionRepository: SessionRepository,
  ) {}

  async execute(): Promise<void> {
    try {
      await this.authRepository.signOut();
    } catch {
      await this.sessionRepository.clear();
      return;
    }
    await this.sessionRepository.clear();
  }
}

export default SignOutUseCase;
