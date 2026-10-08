import {
  createNotification,
  type Notification,
  type NotificationPayload,
} from '../../domain/entities/Notification';
import { rowsOf, type ListLike } from './rows';

export const toNotificationList = (dto: ListLike<NotificationPayload>): Notification[] =>
  rowsOf(dto).map(row => createNotification(row));
