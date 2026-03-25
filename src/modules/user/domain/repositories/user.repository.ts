import { UserProfileEntity } from '../entities/user-profile.entity';

export const USER_REPOSITORY = 'USER_REPOSITORY';

export interface UserRepository {
  findProfileById(userId: number): Promise<UserProfileEntity | null>;
  deleteById(userId: number): Promise<void>;
}
