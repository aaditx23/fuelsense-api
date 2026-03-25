import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { AuthUserEntity } from '../../domain/entities/auth-user.entity';
import { AuthRepository } from '../../domain/repositories/auth.repository';

@Injectable()
export class PrismaAuthRepository implements AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUsername(username: string): Promise<AuthUserEntity | null> {
    const user = await this.prisma.user.findUnique({ where: { username } });
    return user ? this.toEntity(user) : null;
  }

  async findByEmail(email: string): Promise<AuthUserEntity | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return user ? this.toEntity(user) : null;
  }

  async findByUsernameOrEmail(input: string): Promise<AuthUserEntity | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: input }, { email: input }],
      },
    });

    return user ? this.toEntity(user) : null;
  }

  async findById(id: number): Promise<AuthUserEntity | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? this.toEntity(user) : null;
  }

  async createUser(input: {
    username: string;
    email: string;
    passwordHash: string;
    role?: 'USER' | 'ADMIN';
    profileImage?: string | null;
  }): Promise<AuthUserEntity> {
    const user = await this.prisma.user.create({
      data: {
        username: input.username,
        email: input.email,
        passwordHash: input.passwordHash,
        role: (input.role ?? 'USER') as UserRole,
        profileImage: input.profileImage ?? null,
      },
    });

    return this.toEntity(user);
  }

  async deleteUser(id: number): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }

  private toEntity(user: {
    id: number;
    username: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    profileImage: string | null;
  }): AuthUserEntity {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role,
      profileImage: user.profileImage,
    };
  }
}
