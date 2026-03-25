import { BikeResponseDto } from '../../../bikes/presentation/dto/bike-response.dto';
import { UserProfileEntity } from '../../domain/entities/user-profile.entity';

export class UserProfileResponseDto {
  id!: number;
  username!: string;
  email!: string;
  role!: 'USER' | 'ADMIN';
  profileImage!: string | null;
  bikes!: BikeResponseDto[];

  static fromEntity(entity: UserProfileEntity): UserProfileResponseDto {
    return {
      id: entity.id,
      username: entity.username,
      email: entity.email,
      role: entity.role,
      profileImage: entity.profileImage,
      bikes: entity.bikes.map(BikeResponseDto.fromEntity),
    };
  }
}
