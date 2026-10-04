import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PasswordService } from '../../../src/modules/auth/application/services/password.service';
import type { AuthRepository } from '../../../src/modules/auth/domain/repositories/auth.repository';
import type { AuthUserEntity } from '../../../src/modules/auth/domain/entities/auth-user.entity';
import { ChangePasswordUseCase } from '../../../src/modules/user/application/use-cases/change-password.use-case';
import { DeleteOwnAccountUseCase } from '../../../src/modules/user/application/use-cases/delete-own-account.use-case';
import { UpdateUserProfileUseCase } from '../../../src/modules/user/application/use-cases/update-user-profile.use-case';
import type { UserRepository } from '../../../src/modules/user/domain/repositories/user.repository';

const user: AuthUserEntity = {
  id: 1,
  username: 'amir',
  email: 'amir@example.com',
  role: 'USER',
  profileImage: null,
  passwordHash: 'hash',
};

describe('Own-account use cases', () => {
  const authRepository: jest.Mocked<AuthRepository> = {
    findByUsername: jest.fn(),
    findByEmail: jest.fn(),
    findByUsernameOrEmail: jest.fn(),
    findById: jest.fn(),
    createUser: jest.fn(),
    deleteUser: jest.fn(),
  };
  const userRepository: jest.Mocked<UserRepository> = {
    findProfileById: jest.fn(),
    deleteById: jest.fn(),
    updateProfile: jest.fn(),
    updatePasswordHash: jest.fn(),
    countAdmins: jest.fn(),
  };
  const passwordService = { hash: jest.fn(), verify: jest.fn() };

  const update = new UpdateUserProfileUseCase(userRepository, authRepository);
  const changePassword = new ChangePasswordUseCase(
    userRepository,
    authRepository,
    passwordService as unknown as PasswordService,
  );
  const deleteAccount = new DeleteOwnAccountUseCase(
    userRepository,
    authRepository,
    passwordService as unknown as PasswordService,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    authRepository.findById.mockResolvedValue(user);
  });

  describe('UpdateUserProfileUseCase', () => {
    it('rejects an empty body', async () => {
      await expect(update.execute(1, {})).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects a username used by someone else', async () => {
      authRepository.findByUsername.mockResolvedValue({ ...user, id: 2 });
      await expect(update.execute(1, { username: 'taken' })).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(userRepository.updateProfile).not.toHaveBeenCalled();
    });

    it('rejects an email used by someone else', async () => {
      authRepository.findByEmail.mockResolvedValue({ ...user, id: 2 });
      await expect(update.execute(1, { email: 'taken@example.com' })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('allows keeping the own username and clears the picture with null', async () => {
      authRepository.findByUsername.mockResolvedValue(user);
      userRepository.findProfileById.mockResolvedValue({
        id: 1,
        username: 'amir',
        email: user.email,
        role: 'USER',
        profileImage: null,
        bikes: [],
      });

      await update.execute(1, { username: 'amir', profileImage: null });

      expect(userRepository.updateProfile).toHaveBeenCalledWith(1, {
        username: 'amir',
        email: undefined,
        profileImage: null,
      });
    });
  });

  describe('ChangePasswordUseCase', () => {
    it('rejects a wrong current password', async () => {
      passwordService.verify.mockResolvedValue(false);
      await expect(
        changePassword.execute(1, { currentPassword: 'x', newPassword: 'NewPass1234' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(userRepository.updatePasswordHash).not.toHaveBeenCalled();
    });

    it('rejects reusing the current password', async () => {
      passwordService.verify.mockResolvedValue(true);
      await expect(
        changePassword.execute(1, { currentPassword: 'SamePass123', newPassword: 'SamePass123' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('stores the new hash', async () => {
      passwordService.verify.mockResolvedValue(true);
      passwordService.hash.mockResolvedValue('new-hash');
      await changePassword.execute(1, { currentPassword: 'OldPass123', newPassword: 'NewPass1234' });
      expect(userRepository.updatePasswordHash).toHaveBeenCalledWith(1, 'new-hash');
    });
  });

  describe('DeleteOwnAccountUseCase', () => {
    it('rejects a wrong password', async () => {
      passwordService.verify.mockResolvedValue(false);
      await expect(deleteAccount.execute(1, 'nope')).rejects.toBeInstanceOf(BadRequestException);
      expect(userRepository.deleteById).not.toHaveBeenCalled();
    });

    it('blocks deleting the last admin', async () => {
      authRepository.findById.mockResolvedValue({ ...user, role: 'ADMIN' });
      passwordService.verify.mockResolvedValue(true);
      userRepository.countAdmins.mockResolvedValue(1);
      await expect(deleteAccount.execute(1, 'pw')).rejects.toBeInstanceOf(ConflictException);
      expect(userRepository.deleteById).not.toHaveBeenCalled();
    });

    it('lets one of several admins delete the account', async () => {
      authRepository.findById.mockResolvedValue({ ...user, role: 'ADMIN' });
      passwordService.verify.mockResolvedValue(true);
      userRepository.countAdmins.mockResolvedValue(2);
      await deleteAccount.execute(1, 'pw');
      expect(userRepository.deleteById).toHaveBeenCalledWith(1);
    });

    it('deletes a regular user without counting admins', async () => {
      passwordService.verify.mockResolvedValue(true);
      await deleteAccount.execute(1, 'pw');
      expect(userRepository.countAdmins).not.toHaveBeenCalled();
      expect(userRepository.deleteById).toHaveBeenCalledWith(1);
    });

    it('404s for an unknown user', async () => {
      authRepository.findById.mockResolvedValue(null);
      await expect(deleteAccount.execute(9, 'pw')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
