import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ADMIN_BIKE_REPOSITORY } from '../../../src/modules/admin/domain/repositories/admin-bike.repository';
import type { AdminBikeRepository } from '../../../src/modules/admin/domain/repositories/admin-bike.repository';
import { DeleteBikeUseCase } from '../../../src/modules/admin/application/use-cases/delete-bike.use-case';

describe('DeleteBikeUseCase', () => {
  let useCase: DeleteBikeUseCase;

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
        DeleteBikeUseCase,
        { provide: ADMIN_BIKE_REPOSITORY, useValue: repositoryMock },
      ],
    }).compile();

    useCase = module.get<DeleteBikeUseCase>(DeleteBikeUseCase);
  });

  it('throws when bike does not exist', async () => {
    repositoryMock.findById.mockResolvedValue(null);

    await expect(useCase.execute(4)).rejects.toThrow(NotFoundException);
  });

  it('deletes bike when it exists', async () => {
    repositoryMock.findById.mockResolvedValue({
      id: 4,
      brand: 'Honda',
      model: 'Hornet',
      engineCc: 160,
      modelYear: 2020,
      fuelType: 'PETROL',
      expectedMileage: 40,
      tankCapacity: 12,
      reserveCapacity: 1.5,
      image: null,
      isActive: true,
      submittedById: 1,
      adminNote: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await useCase.execute(4);

    expect(repositoryMock.deleteBike).toHaveBeenCalledWith(4);
    expect(result.message).toBe('Bike deleted successfully');
  });
});
