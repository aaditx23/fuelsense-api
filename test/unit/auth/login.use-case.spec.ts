import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AUTH_REPOSITORY } from '../../../src/modules/auth/domain/repositories/auth.repository';
import type { AuthRepository } from '../../../src/modules/auth/domain/repositories/auth.repository';
import type { AuthUserEntity } from '../../../src/modules/auth/domain/entities/auth-user.entity';
import { PasswordService } from '../../../src/modules/auth/application/services/password.service';
import { TokenService } from '../../../src/modules/auth/application/services/token.service';
import { LoginUseCase } from '../../../src/modules/auth/application/use-cases/login.use-case';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;

  const authRepositoryMock: jest.Mocked<AuthRepository> = {
    findByUsername: jest.fn(),
    findByEmail: jest.fn(),
    findByUsernameOrEmail: jest.fn(),
    findById: jest.fn(),
    createUser: jest.fn(),
    deleteUser: jest.fn(),
  };

  const passwordServiceMock = {
    hash: jest.fn(),
    verify: jest.fn(),
  };

  const tokenServiceMock = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginUseCase,
        {
          provide: AUTH_REPOSITORY,
          useValue: authRepositoryMock,
        },
        {
          provide: PasswordService,
          useValue: passwordServiceMock,
        },
        {
          provide: TokenService,
          useValue: tokenServiceMock,
        },
      ],
    }).compile();

    useCase = module.get<LoginUseCase>(LoginUseCase);
  });

  it('throws when user does not exist', async () => {
    authRepositoryMock.findByUsernameOrEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({ username: 'amir', password: 'password123' }),
    ).rejects.toThrow(UnauthorizedException);

    expect(passwordServiceMock.verify).not.toHaveBeenCalled();
  });

  it('throws when password is invalid', async () => {
    const user: AuthUserEntity = {
      id: 10,
      username: 'amir',
      email: 'amir@example.com',
      role: 'USER',
      profileImage: null,
      passwordHash: 'hashed_password',
    };

    authRepositoryMock.findByUsernameOrEmail.mockResolvedValue(user);
    passwordServiceMock.verify.mockResolvedValue(false);

    await expect(
      useCase.execute({ username: 'amir', password: 'wrong_password' }),
    ).rejects.toThrow(UnauthorizedException);

    expect(tokenServiceMock.sign).not.toHaveBeenCalled();
  });

  it('logs in user and returns token response', async () => {
    const user: AuthUserEntity = {
      id: 99,
      username: 'admin',
      email: 'admin@example.com',
      role: 'ADMIN',
      profileImage: null,
      passwordHash: 'hashed_password',
    };

    authRepositoryMock.findByUsernameOrEmail.mockResolvedValue(user);
    passwordServiceMock.verify.mockResolvedValue(true);
    tokenServiceMock.sign.mockReturnValue('admin_jwt_token');

    const result = await useCase.execute({
      username: 'admin',
      password: 'password123',
    });

    expect(passwordServiceMock.verify).toHaveBeenCalledWith(
      'password123',
      'hashed_password',
    );
    expect(tokenServiceMock.sign).toHaveBeenCalledWith({
      sub: 'admin',
      userId: 99,
      role: 'ADMIN',
      tokenType: 'admin_token',
    });

    expect(result).toEqual({
      success: true,
      message: 'Login successful',
      data: {
        id: 99,
        username: 'admin',
        email: 'admin@example.com',
        role: 'ADMIN',
        profileImage: null,
      },
      listData: null,
      token: 'admin_jwt_token',
    });
  });
});
