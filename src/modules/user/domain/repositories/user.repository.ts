import { UserProfileEntity } from '../entities/user-profile.entity';

export const USER_REPOSITORY = 'USER_REPOSITORY';

export interface UserRepository {
  findProfileById(userId: number): Promise<UserProfileEntity | null>;
  deleteById(userId: number): Promise<void>;
  /** Only keys that are not `undefined` are written; `profileImage: null` clears it. */
  updateProfile(
    userId: number,
    data: { username?: string; email?: string; profileImage?: string | null },
  ): Promise<void>;
  updatePasswordHash(userId: number, passwordHash: string): Promise<void>;
  countAdmins(): Promise<number>;
}
