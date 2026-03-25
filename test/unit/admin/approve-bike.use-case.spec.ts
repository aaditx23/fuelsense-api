import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ADMIN_BIKE_REPOSITORY } from '../../../src/modules/admin/domain/repositories/admin-bike.repository';
import type { AdminBikeRepository } from '../../../src/modules/admin/domain/repositories/admin-bike.repository';
import { ApproveBikeUseCase } from '../../../src/modules/admin/application/use-cases/approve-bike.use-case';

describe('ApproveBikeUseCase', () => {
  let useCase: ApproveBikeUseCase;

  const repositoryMock: jest.Mocked<AdminBikeRepository> = {
    findPending: jest.fn(),
    findById: jest.fn(),
    findActiveByVariantExcludingId: jest.fn(),
    updateBike: jest.fn(),
    activateBike: jest.fn(),
    deleteBike: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApproveBikeUseCase,
        { provide: ADMIN_BIKE_REPOSITORY, useValue: repositoryMock },
      ],
    }).compile();

    useCase = module.get<ApproveBikeUseCase>(ApproveBikeUseCase);
  });

  const pendingBike = {
    id: 7,
    brand: 'Suzuki',
    model: 'Gixxer',
    engineCc: 150,
    modelYear: 2020,
    fuelType: 'PETROL' as const,
    expectedMileage: 42,
    tankCapacity: 12,
    reserveCapacity: 1.5,
    image: null,
    isActive: false,
    submittedById: 2,
    adminNote: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('throws when bike does not exist', async () => {
    repositoryMock.findById.mockResolvedValue(null);

    await expect(useCase.execute(7)).rejects.toThrow(NotFoundException);
  });

  it('throws when bike already active', async () => {
    repositoryMock.findById.mockResolvedValue({ ...pendingBike, isActive: true });

    await expect(useCase.execute(7)).rejects.toThrow(BadRequestException);
  });

  it('throws when duplicate active variant exists', async () => {
    repositoryMock.findById.mockResolvedValue(pendingBike);
    repositoryMock.findActiveByVariantExcludingId.mockResolvedValue({
      ...pendingBike,
      id: 999,
      isActive: true,
    });

    await expect(useCase.execute(7)).rejects.toThrow(ConflictException);
  });

  it('approves bike successfully when no duplicate exists', async () => {
    repositoryMock.findById.mockResolvedValue(pendingBike);
    repositoryMock.findActiveByVariantExcludingId.mockResolvedValue(null);
    repositoryMock.activateBike.mockResolvedValue({ ...pendingBike, isActive: true });

    const result = await useCase.execute(7);

    expect(repositoryMock.activateBike).toHaveBeenCalledWith(7);
    expect(result.message).toBe('Bike approved successfully');
    expect(result.data?.isActive).toBe(true);
  });
});
