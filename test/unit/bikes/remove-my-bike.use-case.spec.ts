import { Test, TestingModule } from '@nestjs/testing';
import { BIKE_REPOSITORY } from '../../../src/modules/bikes/domain/repositories/bike.repository';
import type { BikeRepository } from '../../../src/modules/bikes/domain/repositories/bike.repository';
import { RemoveMyBikeUseCase } from '../../../src/modules/bikes/application/use-cases/remove-my-bike.use-case';

describe('RemoveMyBikeUseCase', () => {
  let useCase: RemoveMyBikeUseCase;

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
        RemoveMyBikeUseCase,
        {
          provide: BIKE_REPOSITORY,
          useValue: bikeRepositoryMock,
        },
      ],
    }).compile();

    useCase = module.get<RemoveMyBikeUseCase>(RemoveMyBikeUseCase);
  });

  it('returns success when bike was removed', async () => {
    bikeRepositoryMock.removeBikeSelection.mockResolvedValue(true);

    const result = await useCase.execute(1, 3);

    expect(result.message).toBe('Bike removed successfully');
  });

  it('returns idempotent success when bike was already removed', async () => {
    bikeRepositoryMock.removeBikeSelection.mockResolvedValue(false);

    const result = await useCase.execute(1, 3);

    expect(result.message).toBe('Bike already removed');
  });
});
