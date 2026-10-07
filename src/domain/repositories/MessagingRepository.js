import { abstractMethod } from './Repository';

export class MessagingRepository {
  conversations() {
    return abstractMethod('MessagingRepository.conversations');
  }

  openConversation() {
    return abstractMethod('MessagingRepository.openConversation');
  }

  messages() {
    return abstractMethod('MessagingRepository.messages');
  }

  sendMessage() {
    return abstractMethod('MessagingRepository.sendMessage');
  }

  markRead() {
    return abstractMethod('MessagingRepository.markRead');
  }
}
