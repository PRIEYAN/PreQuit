import { abstractMethod } from './Repository';

export class SessionRepository {
  read() {
    return abstractMethod('SessionRepository.read');
  }

  write() {
    return abstractMethod('SessionRepository.write');
  }

  clear() {
    return abstractMethod('SessionRepository.clear');
  }

  accessToken() {
    return abstractMethod('SessionRepository.accessToken');
  }

  refreshToken() {
    return abstractMethod('SessionRepository.refreshToken');
  }
}
