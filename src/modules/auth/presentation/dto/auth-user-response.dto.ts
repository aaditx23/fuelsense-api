import { AuthUserEntity } from '../../domain/entities/auth-user.entity';

export class AuthUserResponseDto {
  id!: number;
  username!: string;
  email!: string;
  role!: 'USER' | 'ADMIN';
  profileImage!: string | null;

  static fromEntity(entity: AuthUserEntity): AuthUserResponseDto {
    return {
      id: entity.id,
      username: entity.username,
      email: entity.email,
      role: entity.role,
      profileImage: entity.profileImage,
    };
  }
}
