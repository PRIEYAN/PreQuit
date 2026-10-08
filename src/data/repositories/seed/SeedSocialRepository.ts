import type { User } from '../../../domain/entities/User';
import type { SocialRepository } from '../../../domain/repositories/SocialRepository';

export class SeedSocialRepository implements SocialRepository {
  async follow(): Promise<void> {}

  async unfollow(): Promise<void> {}

  async mutuals(): Promise<readonly string[]> {
    return [];
  }

  async suggested(): Promise<readonly User[]> {
    return [];
  }
}

export default SeedSocialRepository;
