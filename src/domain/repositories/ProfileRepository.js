import { abstractMethod } from './Repository';

export class ProfileRepository {
  myProfile() {
    return abstractMethod('ProfileRepository.myProfile');
  }

  byHandle() {
    return abstractMethod('ProfileRepository.byHandle');
  }

  postsOf() {
    return abstractMethod('ProfileRepository.postsOf');
  }

  updateProfile() {
    return abstractMethod('ProfileRepository.updateProfile');
  }
}
