/**
 * Stand-in feed data while the app is not wired to the API. The shape matches
 * the server's post projection exactly, so reconnecting means dropping this
 * module and reading the same fields off the real response.
 */
const post = ({ id, handle, displayName, description, likes, comments, saves, topic, reason, hasLiked = false, hasSaved = false }) => ({
  id,
  author: { id: `u_${handle}`, handle, displayName, avatarUrl: null },
  description,
  media: [],
  hashtags: [],
  mentions: [],
  topics: topic ? [{ slug: topic, label: topic, weight: 1, source: 'author' }] : [],
  visibility: 'public',
  status: 'published',
  counts: { likes, comments, shares: 0, saves },
  viewer: { hasLiked, hasSaved, canEdit: false, canDelete: false },
  enrichmentStatus: 'ready',
  publishedAt: new Date().toISOString(),
  reason: reason ? { kind: 'quality', label: reason } : null,
});

export const MOCK_POSTS = [
  post({
    id: 'm1',
    handle: 'atlas',
    displayName: 'Atlas',
    description: 'Finally sent the overhang project after six sessions. Beta was all in the footwork.',
    likes: 128,
    comments: 14,
    saves: 9,
    topic: 'climbing',
    reason: 'From an account you engage with',
  }),
  post({
    id: 'm2',
    handle: 'rio',
    displayName: 'Rio',
    description: 'Ninety percent hydration, twelve hour cold retard, and the crumb is finally open.',
    likes: 76,
    comments: 8,
    saves: 21,
    topic: 'sourdough',
    reason: 'Matches your interests',
    hasSaved: true,
  }),
  post({
    id: 'm3',
    handle: 'nova',
    displayName: 'Nova',
    description: 'Shot this on a 35mm prime at golden hour — the light does all the work.',
    likes: 312,
    comments: 27,
    saves: 44,
    topic: 'photography',
    reason: 'Popular with people like you',
    hasLiked: true,
  }),
  post({
    id: 'm4',
    handle: 'sage',
    displayName: 'Sage',
    description: 'Compost is just patience with a smell. Six months in and it is beautiful soil.',
    likes: 54,
    comments: 6,
    saves: 3,
    topic: 'gardening',
    reason: 'Recently posted',
  }),
  post({
    id: 'm5',
    handle: 'mira',
    displayName: 'Mira',
    description: 'Celadon over a dark stoneware body — the glaze breaks over the throwing lines.',
    likes: 91,
    comments: 11,
    saves: 17,
    topic: 'ceramics',
    reason: 'Similar to posts you liked',
  }),
];

export default MOCK_POSTS;
