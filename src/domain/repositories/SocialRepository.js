import { abstractMethod } from './Repository';

export class SocialRepository {
  follow() {
    return abstractMethod('SocialRepository.follow');
  }

  unfollow() {
    return abstractMethod('SocialRepository.unfollow');
  }

  mutuals() {
    return abstractMethod('SocialRepository.mutuals');
  }

  suggested() {
    return abstractMethod('SocialRepository.suggested');
  }
}
