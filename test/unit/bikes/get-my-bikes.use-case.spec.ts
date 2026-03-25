import { Test, TestingModule } from '@nestjs/testing';
import { BIKE_REPOSITORY } from '../../../src/modules/bikes/domain/repositories/bike.repository';
import type { BikeRepository } from '../../../src/modules/bikes/domain/repositories/bike.repository';
import { GetMyBikesUseCase } from '../../../src/modules/bikes/application/use-cases/get-my-bikes.use-case';

describe('GetMyBikesUseCase', () => {
  let useCase: GetMyBikesUseCase;

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
        GetMyBikesUseCase,
        {
          provide: BIKE_REPOSITORY,
          useValue: bikeRepositoryMock,
        },
      ],
    }).compile();

    useCase = module.get<GetMyBikesUseCase>(GetMyBikesUseCase);
  });

  it('returns no bikes message when user has none', async () => {
    bikeRepositoryMock.findMyActiveBikes.mockResolvedValue([]);

    const result = await useCase.execute(7);

    expect(result.message).toBe('No bikes found');
    expect(result.listData).toEqual([]);
  });

  it('returns user bikes list', async () => {
    bikeRepositoryMock.findMyActiveBikes.mockResolvedValue([
      {
        id: 1,
        brand: 'Suzuki',
        model: 'Gixxer',
        engineCc: 150,
        modelYear: 2021,
        fuelType: 'PETROL',
        expectedMileage: 42,
        tankCapacity: 12,
        reserveCapacity: 1.5,
        image: null,
        isActive: true,
        submittedById: 2,
        adminNote: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const result = await useCase.execute(7);

    expect(result.message).toBe('My bikes fetched successfully');
    expect(result.listData).toHaveLength(1);
  });
});
