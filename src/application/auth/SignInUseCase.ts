import type { User } from '../../domain/entities/User';
import type { AuthRepository } from '../../domain/repositories/AuthRepository';
import type { SessionRepository } from '../../domain/repositories/SessionRepository';

export class SignInUseCase {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly sessionRepository: SessionRepository,
  ) {}

  async execute(identifier: string, password: string): Promise<User> {
    const session = await this.authRepository.signIn(identifier.trim(), password);
    await this.sessionRepository.write(session);
    return session.user;
  }
}

export default SignInUseCase;
