import { createUser, type User, type UserPayload } from '../../domain/entities/User';

export const toUser = (dto: UserPayload | null): User => createUser(dto ?? {});

export const toUserList = (rows: readonly UserPayload[] = []): User[] => rows.map(row => createUser(row));
