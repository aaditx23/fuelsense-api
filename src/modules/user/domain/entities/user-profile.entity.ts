import { BikeEntity } from '../../../bikes/domain/entities/bike.entity';

export type UserProfileEntity = {
  id: number;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
  profileImage: string | null;
  bikes: BikeEntity[];
};
