import { createComment, type Comment, type CommentPayload } from '../../domain/entities/Comment';
import { rowsOf, type ListLike } from './rows';

export const toComment = (dto: CommentPayload | null): Comment => createComment(dto ?? {});

export const toCommentList = (dto: ListLike<CommentPayload>): Comment[] =>
  rowsOf(dto).map(row => createComment(row));
