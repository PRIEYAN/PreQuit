export class SignUpUseCase {
  constructor(authRepository) {
    this.authRepository = authRepository;
  }

  execute(details) {
    return this.authRepository.signUp(details);
  }
}

export default SignUpUseCase;
