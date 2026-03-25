import { Test, TestingModule } from '@nestjs/testing';
import { BIKE_REPOSITORY } from '../../../src/modules/bikes/domain/repositories/bike.repository';
import type { BikeRepository } from '../../../src/modules/bikes/domain/repositories/bike.repository';
import { GetActiveBikesUseCase } from '../../../src/modules/bikes/application/use-cases/get-active-bikes.use-case';

describe('GetActiveBikesUseCase', () => {
  let useCase: GetActiveBikesUseCase;

  const bikeRepositoryMock: jest.Mocked<BikeRepository> = {
    findActive: jest.fn(),
    findMyActiveBikes: jest.fn(),
    findByVariant: jest.fn(),
    findById: jest.fn(),
    createPending: jest.fn(),
    hasUserBikeSelection: jest.fn(),
    selectBike: jest.fn(),
    removeBikeSelection: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetActiveBikesUseCase,
        {
          provide: BIKE_REPOSITORY,
          useValue: bikeRepositoryMock,
        },
      ],
    }).compile();

    useCase = module.get<GetActiveBikesUseCase>(GetActiveBikesUseCase);
  });

  it('returns no bikes message when repository result is empty', async () => {
    bikeRepositoryMock.findActive.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result.success).toBe(true);
    expect(result.message).toBe('No bikes found');
    expect(result.listData).toEqual([]);
  });

  it('returns active bikes list', async () => {
    bikeRepositoryMock.findActive.mockResolvedValue([
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
        isActive: true,
        submittedById: null,
        adminNote: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const result = await useCase.execute();

    expect(result.success).toBe(true);
    expect(result.message).toBe('Bikes fetched successfully');
    expect(result.listData).toHaveLength(1);
  });
});
