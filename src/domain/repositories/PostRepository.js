import { abstractMethod } from './Repository';

export class PostRepository {
  byId() {
    return abstractMethod('PostRepository.byId');
  }

  like() {
    return abstractMethod('PostRepository.like');
  }

  unlike() {
    return abstractMethod('PostRepository.unlike');
  }

  save() {
    return abstractMethod('PostRepository.save');
  }

  unsave() {
    return abstractMethod('PostRepository.unsave');
  }

  comments() {
    return abstractMethod('PostRepository.comments');
  }

  addComment() {
    return abstractMethod('PostRepository.addComment');
  }
}
