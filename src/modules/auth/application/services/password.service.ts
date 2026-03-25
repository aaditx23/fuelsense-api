import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class PasswordService {
  constructor(private readonly configService: ConfigService) {}

  async hash(password: string): Promise<string> {
    const rawRounds = this.configService.get<string>('BCRYPT_SALT_ROUNDS');
    if (!rawRounds) {
      throw new Error('BCRYPT_SALT_ROUNDS is required');
    }

    const rounds = Number(rawRounds);
    if (!Number.isFinite(rounds) || rounds < 4) {
      throw new Error('BCRYPT_SALT_ROUNDS must be a number >= 4');
    }

    const saltRounds = Math.floor(rounds);
    return bcrypt.hash(password, saltRounds);
  }

  async verify(plainPassword: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, passwordHash);
  }
}
