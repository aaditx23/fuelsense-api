import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AUTH_REPOSITORY } from '../../../src/modules/auth/domain/repositories/auth.repository';
import type { AuthRepository } from '../../../src/modules/auth/domain/repositories/auth.repository';
import type { AuthUserEntity } from '../../../src/modules/auth/domain/entities/auth-user.entity';
import { PasswordService } from '../../../src/modules/auth/application/services/password.service';
import { TokenService } from '../../../src/modules/auth/application/services/token.service';
import { RegisterUseCase } from '../../../src/modules/auth/application/use-cases/register.use-case';

describe('RegisterUseCase', () => {
  let useCase: RegisterUseCase;

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
        RegisterUseCase,
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

    useCase = module.get<RegisterUseCase>(RegisterUseCase);
  });

  it('throws when username already exists', async () => {
    authRepositoryMock.findByUsername.mockResolvedValue({
      id: 1,
      username: 'amir',
      email: 'amir@example.com',
      role: 'USER',
      profileImage: null,
      passwordHash: 'hash',
    });

    await expect(
      useCase.execute({
        username: 'amir',
        email: 'another@example.com',
        password: 'password123',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(authRepositoryMock.findByEmail).not.toHaveBeenCalled();
  });

  it('throws when email already exists', async () => {
    authRepositoryMock.findByUsername.mockResolvedValue(null);
    authRepositoryMock.findByEmail.mockResolvedValue({
      id: 2,
      username: 'another',
      email: 'amir@example.com',
      role: 'USER',
      profileImage: null,
      passwordHash: 'hash',
    });

    await expect(
      useCase.execute({
        username: 'amir',
        email: 'amir@example.com',
        password: 'password123',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(passwordServiceMock.hash).not.toHaveBeenCalled();
  });

  it('registers user and returns token response', async () => {
    const createdUser: AuthUserEntity = {
      id: 10,
      username: 'amir',
      email: 'amir@example.com',
      role: 'USER',
      profileImage: null,
      passwordHash: 'hashed_password',
    };

    authRepositoryMock.findByUsername.mockResolvedValue(null);
    authRepositoryMock.findByEmail.mockResolvedValue(null);
    passwordServiceMock.hash.mockResolvedValue('hashed_password');
    authRepositoryMock.createUser.mockResolvedValue(createdUser);
    tokenServiceMock.sign.mockReturnValue('jwt_token');

    const result = await useCase.execute({
      username: 'amir',
      email: 'amir@example.com',
      password: 'password123',
    });

    expect(passwordServiceMock.hash).toHaveBeenCalledWith('password123');
    expect(authRepositoryMock.createUser).toHaveBeenCalledWith({
      username: 'amir',
      email: 'amir@example.com',
      passwordHash: 'hashed_password',
      role: undefined,
      profileImage: undefined,
    });
    expect(tokenServiceMock.sign).toHaveBeenCalledWith({
      sub: 'amir',
      userId: 10,
      role: 'USER',
      tokenType: 'user_token',
    });

    expect(result).toEqual({
      success: true,
      message: 'User registered successfully',
      data: {
        id: 10,
        username: 'amir',
        email: 'amir@example.com',
        role: 'USER',
        profileImage: null,
      },
      listData: null,
      token: 'jwt_token',
    });
  });
});
