import { createComment } from '../../domain/entities/Comment';

export const toComment = dto => createComment(dto);

export const toCommentList = (dto = {}) => {
  const rows = Array.isArray(dto) ? dto : (dto.data ?? dto.items ?? []);
  return rows.map(createComment);
};
