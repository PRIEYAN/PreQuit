import { createUser } from '../../domain/entities/User';

export const toUser = dto => createUser(dto);
export const toUserList = (rows = []) => rows.map(createUser);
