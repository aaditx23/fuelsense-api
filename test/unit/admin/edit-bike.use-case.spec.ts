import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ADMIN_BIKE_REPOSITORY } from '../../../src/modules/admin/domain/repositories/admin-bike.repository';
import type { AdminBikeRepository } from '../../../src/modules/admin/domain/repositories/admin-bike.repository';
import { EditBikeUseCase } from '../../../src/modules/admin/application/use-cases/edit-bike.use-case';

describe('EditBikeUseCase', () => {
  let useCase: EditBikeUseCase;

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
        EditBikeUseCase,
        { provide: ADMIN_BIKE_REPOSITORY, useValue: repositoryMock },
      ],
    }).compile();

    useCase = module.get<EditBikeUseCase>(EditBikeUseCase);
  });

  it('throws when bike does not exist', async () => {
    repositoryMock.findById.mockResolvedValue(null);

    await expect(useCase.execute(1, { model: 'R15M' })).rejects.toThrow(NotFoundException);
  });

  it('updates bike and returns response', async () => {
    repositoryMock.findById.mockResolvedValue({
      id: 1,
      brand: 'Yamaha',
      model: 'R15',
      engineCc: 155,
      modelYear: 2023,
      fuelType: 'PETROL',
      expectedMileage: 45,
      tankCapacity: 11,
      reserveCapacity: 1.2,
      image: null,
      isActive: false,
      submittedById: 1,
      adminNote: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    repositoryMock.updateBike.mockResolvedValue({
      id: 1,
      brand: 'Yamaha',
      model: 'R15M',
      engineCc: 155,
      modelYear: 2023,
      fuelType: 'PETROL',
      expectedMileage: 45,
      tankCapacity: 11,
      reserveCapacity: 1.2,
      image: null,
      isActive: false,
      submittedById: 1,
      adminNote: 'updated',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await useCase.execute(1, { model: 'R15M', adminNote: 'updated' });

    expect(repositoryMock.updateBike).toHaveBeenCalledWith(1, {
      model: 'R15M',
      adminNote: 'updated',
    });
    expect(result.message).toBe('Bike updated successfully');
  });
});
