import { createNotification } from '../../domain/entities/Notification';

export const toNotificationList = (dto = {}) => {
  const rows = Array.isArray(dto) ? dto : (dto.data ?? dto.items ?? []);
  return rows.map(createNotification);
};
