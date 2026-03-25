import { AuthUserEntity } from '../entities/auth-user.entity';

export const AUTH_REPOSITORY = 'AUTH_REPOSITORY';

export interface AuthRepository {
  findByUsername(username: string): Promise<AuthUserEntity | null>;
  findByEmail(email: string): Promise<AuthUserEntity | null>;
  findByUsernameOrEmail(input: string): Promise<AuthUserEntity | null>;
  findById(id: number): Promise<AuthUserEntity | null>;
  createUser(input: {
    username: string;
    email: string;
    passwordHash: string;
    role?: 'USER' | 'ADMIN';
    profileImage?: string | null;
  }): Promise<AuthUserEntity>;
  deleteUser(id: number): Promise<void>;
}
