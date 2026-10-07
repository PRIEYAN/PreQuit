import { abstractMethod } from './Repository';

export class AuthRepository {
  signIn() {
    return abstractMethod('AuthRepository.signIn');
  }

  signUp() {
    return abstractMethod('AuthRepository.signUp');
  }

  signOut() {
    return abstractMethod('AuthRepository.signOut');
  }

  me() {
    return abstractMethod('AuthRepository.me');
  }

  isHandleAvailable() {
    return abstractMethod('AuthRepository.isHandleAvailable');
  }

  requestPasswordReset() {
    return abstractMethod('AuthRepository.requestPasswordReset');
  }
}
