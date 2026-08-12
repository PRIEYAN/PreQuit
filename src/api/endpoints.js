import { get, post, patch, del } from './client';

/**
 * One function per API route, so screens never build URLs or remember
 * response envelopes. Paths mirror the server's route table exactly.
 */

export const auth = {
  register: body => post('/auth/register', body, { auth: false }),
  verifyEmail: token => post('/auth/verify-email', { token }, { auth: false }),
  resendVerification: email => post('/auth/verify-email/resend', { email }, { auth: false }),
  login: (identifier, password) => post('/auth/login', { identifier, password }, { auth: false }),
  logout: () => post('/auth/logout'),
  me: () => get('/auth/me'),
  handleAvailable: handle => get(`/auth/handle-available?handle=${encodeURIComponent(handle)}`, { auth: false }),
  forgotPassword: email => post('/auth/password/forgot', { email }, { auth: false }),
  resetPassword: (token, newPassword) => post('/auth/password/reset', { token, newPassword }, { auth: false }),
  changePassword: (currentPassword, newPassword) =>
    post('/auth/password/change', { currentPassword, newPassword }),
};

export const feed = {
  home: (limit = 20) => get(`/feed/home?limit=${limit}`),
  explore: (limit = 20) => get(`/feed/explore?limit=${limit}`),
  trending: (limit = 20) => get(`/feed/trending?limit=${limit}`),
};

export const posts = {
  create: body => post('/posts', body),
  byId: postId => get(`/posts/${postId}`),
  update: (postId, body) => patch(`/posts/${postId}`, body),
  remove: postId => del(`/posts/${postId}`),
  like: postId => post(`/posts/${postId}/likes`),
  unlike: postId => del(`/posts/${postId}/likes`),
  save: postId => post(`/posts/${postId}/saves`),
  unsave: postId => del(`/posts/${postId}/saves`),
  comments: (postId, limit = 20) => get(`/posts/${postId}/comments?limit=${limit}`),
  addComment: (postId, body, parentId) => post(`/posts/${postId}/comments`, { body, parentId }),
};

export const media = {
  uploadTickets: items => post('/media/upload-tickets', { purpose: 'post', items }),
  confirm: (mediaId, publicId) => post(`/media/${mediaId}/confirm`, { publicId }),
};

export const social = {
  follow: userId => post(`/users/${userId}/follow`),
  unfollow: userId => del(`/users/${userId}/follow`),
  followers: userId => get(`/users/${userId}/followers`),
  following: userId => get(`/users/${userId}/following`),
  mutuals: () => get('/me/mutuals'),
  followRequests: () => get('/me/follow-requests'),
  acceptRequest: requestId => post(`/me/follow-requests/${requestId}/accept`),
  rejectRequest: requestId => post(`/me/follow-requests/${requestId}/reject`),
  block: userId => post(`/users/${userId}/block`),
  unblock: userId => del(`/users/${userId}/block`),
  suggested: () => get('/users/suggested'),
  profile: handle => get(`/users/${encodeURIComponent(handle)}`),
  updateProfile: body => patch('/me/profile', body),
};

export const search = {
  query: (q, limit = 20) => get(`/search?q=${encodeURIComponent(q)}&limit=${limit}`),
  suggest: prefix => get(`/search/suggest?q=${encodeURIComponent(prefix)}`),
  trending: () => get('/search/trending'),
};

export const messaging = {
  conversations: () => get('/conversations'),
  messages: conversationId => get(`/conversations/${conversationId}/messages`),
  send: (conversationId, body) => post(`/conversations/${conversationId}/messages`, body),
};

export const notifications = {
  list: (filter = 'all') => get(`/notifications?filter=${filter}`),
  unreadCount: () => get('/notifications/unread-count'),
  markAllRead: () => post('/notifications/read-all'),
};

export default { auth, feed, posts, media, social, search, messaging, notifications };
