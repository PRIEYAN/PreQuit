export const SessionStatus = {
  SIGNED_IN: 'signedIn',
  SIGNED_OUT: 'signedOut',
};

export class RestoreSessionUseCase {
  constructor(authRepository, sessionRepository) {
    this.authRepository = authRepository;
    this.sessionRepository = sessionRepository;
  }

  async execute() {
    const stored = await this.sessionRepository.read();
    if (!stored.accessToken) return { status: SessionStatus.SIGNED_OUT, user: null };

    try {
      const user = await this.authRepository.me();
      await this.sessionRepository.write({ ...stored, user });
      return { status: SessionStatus.SIGNED_IN, user };
    } catch (error) {
      if (error?.isOffline && stored.user) {
        return { status: SessionStatus.SIGNED_IN, user: stored.user };
      }
      await this.sessionRepository.clear();
      return { status: SessionStatus.SIGNED_OUT, user: null };
    }
  }
}

export default RestoreSessionUseCase;
