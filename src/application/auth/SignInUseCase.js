export class SignInUseCase {
  constructor(authRepository, sessionRepository) {
    this.authRepository = authRepository;
    this.sessionRepository = sessionRepository;
  }

  async execute(identifier, password) {
    const result = await this.authRepository.signIn(identifier.trim(), password);
    await this.sessionRepository.write(result);
    return result.user;
  }
}

export default SignInUseCase;
