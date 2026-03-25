import { Test, TestingModule } from '@nestjs/testing';
import { ADMIN_BIKE_REPOSITORY } from '../../../src/modules/admin/domain/repositories/admin-bike.repository';
import type { AdminBikeRepository } from '../../../src/modules/admin/domain/repositories/admin-bike.repository';
import { GetPendingBikesUseCase } from '../../../src/modules/admin/application/use-cases/get-pending-bikes.use-case';

describe('GetPendingBikesUseCase', () => {
  let useCase: GetPendingBikesUseCase;

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
        GetPendingBikesUseCase,
        { provide: ADMIN_BIKE_REPOSITORY, useValue: repositoryMock },
      ],
    }).compile();

    useCase = module.get<GetPendingBikesUseCase>(GetPendingBikesUseCase);
  });

  it('returns no pending bikes message for empty list', async () => {
    repositoryMock.findPending.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result.message).toBe('No pending bikes found');
    expect(result.listData).toEqual([]);
  });

  it('returns pending bikes list', async () => {
    repositoryMock.findPending.mockResolvedValue([
      {
        id: 1,
        brand: 'Honda',
        model: 'CBR',
        engineCc: 150,
        modelYear: 2022,
        fuelType: 'PETROL',
        expectedMileage: 40,
        tankCapacity: 12,
        reserveCapacity: 2,
        image: null,
        isActive: false,
        submittedById: 3,
        adminNote: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const result = await useCase.execute();

    expect(result.message).toBe('Pending bikes fetched successfully');
    expect(result.listData).toHaveLength(1);
  });
});
