export const createNotification = (raw = {}) => ({
  id: raw.id ?? '',
  kind: raw.kind ?? 'unknown',
  actorCount: raw.actorCount ?? 0,
  actors: Array.isArray(raw.actors) ? raw.actors : [],
  subject: raw.subject ?? null,
  isRead: Boolean(raw.readAt),
  createdAt: raw.createdAt ?? null,
});
