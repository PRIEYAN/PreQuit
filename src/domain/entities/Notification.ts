export type NotificationKind =
  | 'follow'
  | 'follow_request'
  | 'follow_request_accepted'
  | 'post_liked'
  | 'post_commented'
  | 'comment_reply'
  | 'mention'
  | 'comment_marked_helpful'
  | 'post_shared'
  | 'new_message'
  | 'unknown';

export interface NotificationActor {
  readonly userId: string;
  readonly handle: string;
  readonly at?: string;
}

export interface NotificationSubject {
  readonly kind: string;
  readonly id: string;
  readonly preview: string | null;
}

export interface Notification {
  readonly id: string;
  readonly kind: NotificationKind;
  readonly actorCount: number;
  readonly actors: readonly NotificationActor[];
  readonly subject: NotificationSubject | null;
  readonly isRead: boolean;
  readonly createdAt: string | null;
}

export interface NotificationPayload {
  readonly id?: string;
  readonly kind?: NotificationKind;
  readonly actorCount?: number;
  readonly actors?: readonly NotificationActor[];
  readonly subject?: NotificationSubject | null;
  readonly readAt?: string | null;
  readonly createdAt?: string | null;
}

export const createNotification = (raw: NotificationPayload = {}): Notification => ({
  id: raw.id ?? '',
  kind: raw.kind ?? 'unknown',
  actorCount: raw.actorCount ?? 0,
  actors: raw.actors ?? [],
  subject: raw.subject ?? null,
  isRead: Boolean(raw.readAt),
  createdAt: raw.createdAt ?? null,
});
