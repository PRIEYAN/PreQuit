import { SocialRepository } from '../../../domain/repositories/SocialRepository';

export class SeedSocialRepository extends SocialRepository {
  async follow() {}

  async unfollow() {}

  async mutuals() {
    return [];
  }

  async suggested() {
    return [];
  }
}

export default SeedSocialRepository;
