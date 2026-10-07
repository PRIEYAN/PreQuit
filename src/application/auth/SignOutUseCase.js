export class SignOutUseCase {
  constructor(authRepository, sessionRepository) {
    this.authRepository = authRepository;
    this.sessionRepository = sessionRepository;
  }

  async execute() {
    try {
      await this.authRepository.signOut();
    } catch {
      return this.sessionRepository.clear();
    }
    return this.sessionRepository.clear();
  }
}

export default SignOutUseCase;
