import type {
  AuthRepository,
  RegistrationDetails,
  RegistrationResult,
} from '../../domain/repositories/AuthRepository';

export class SignUpUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  execute(details: RegistrationDetails): Promise<RegistrationResult> {
    return this.authRepository.signUp(details);
  }
}

export default SignUpUseCase;
