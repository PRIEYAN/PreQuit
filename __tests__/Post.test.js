import { createPost, withLikeToggled, withSaveToggled, hasLiked, hasSaved } from '../src/domain/entities/Post';

describe('Post entity', () => {
  it('fills in a complete shape from a sparse payload', () => {
    const post = createPost({ id: 'p1' });

    expect(post.counts).toEqual({ likes: 0, comments: 0, shares: 0, saves: 0 });
    expect(post.viewer).toEqual({ hasLiked: false, hasSaved: false, canEdit: false, canDelete: false });
    expect(post.media).toEqual([]);
    expect(post.author.displayName).toBe('');
  });

  it('falls back to the handle when no display name is given', () => {
    const post = createPost({ id: 'p1', author: { id: 'a', handle: 'nova' } });
    expect(post.author.displayName).toBe('nova');
  });

  it('raises the like count when liking', () => {
    const post = createPost({ id: 'p1', counts: { likes: 4 } });
    const liked = withLikeToggled(post);

    expect(hasLiked(liked)).toBe(true);
    expect(liked.counts.likes).toBe(5);
  });

  it('lowers the like count when unliking', () => {
    const post = createPost({ id: 'p1', counts: { likes: 4 }, viewer: { hasLiked: true } });
    const unliked = withLikeToggled(post);

    expect(hasLiked(unliked)).toBe(false);
    expect(unliked.counts.likes).toBe(3);
  });

  it('never drives a count below zero', () => {
    const post = createPost({ id: 'p1', counts: { likes: 0 }, viewer: { hasLiked: true } });
    expect(withLikeToggled(post).counts.likes).toBe(0);
  });

  it('toggles saves independently of likes', () => {
    const saved = withSaveToggled(createPost({ id: 'p1', counts: { saves: 1 } }));

    expect(hasSaved(saved)).toBe(true);
    expect(saved.counts.saves).toBe(2);
    expect(hasLiked(saved)).toBe(false);
  });

  it('leaves the original post untouched', () => {
    const post = createPost({ id: 'p1', counts: { likes: 1 } });
    withLikeToggled(post);

    expect(post.counts.likes).toBe(1);
    expect(hasLiked(post)).toBe(false);
  });
});
