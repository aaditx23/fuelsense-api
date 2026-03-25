import { Test, TestingModule } from '@nestjs/testing';
import { BIKE_REPOSITORY } from '../../../src/modules/bikes/domain/repositories/bike.repository';
import type { BikeRepository } from '../../../src/modules/bikes/domain/repositories/bike.repository';
import { SubmitBikeUseCase } from '../../../src/modules/bikes/application/use-cases/submit-bike.use-case';

describe('SubmitBikeUseCase', () => {
  let useCase: SubmitBikeUseCase;

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
        SubmitBikeUseCase,
        {
          provide: BIKE_REPOSITORY,
          useValue: bikeRepositoryMock,
        },
      ],
    }).compile();

    useCase = module.get<SubmitBikeUseCase>(SubmitBikeUseCase);
  });

  const payload = {
    brand: 'Yamaha',
    model: 'R15',
    engineCc: 155,
    modelYear: 2023,
    fuelType: 'PETROL' as const,
    expectedMileage: 45,
    tankCapacity: 11,
    reserveCapacity: 1.5,
    image: null,
    submittedById: 5,
  };

  it('returns idempotent response when active bike already exists', async () => {
    bikeRepositoryMock.findByVariant.mockResolvedValue({
      id: 2,
      ...payload,
      isActive: true,
      adminNote: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await useCase.execute(payload);

    expect(result.message).toBe('Bike already exists');
    expect(bikeRepositoryMock.createPending).not.toHaveBeenCalled();
  });

  it('returns idempotent response when pending bike already exists', async () => {
    bikeRepositoryMock.findByVariant.mockResolvedValue({
      id: 3,
      ...payload,
      isActive: false,
      adminNote: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await useCase.execute(payload);

    expect(result.message).toBe('Bike already exists and is pending approval');
  });

  it('creates a pending bike when it is new', async () => {
    bikeRepositoryMock.findByVariant.mockResolvedValue(null);
    bikeRepositoryMock.createPending.mockResolvedValue({
      id: 4,
      ...payload,
      isActive: false,
      adminNote: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await useCase.execute(payload);

    expect(bikeRepositoryMock.createPending).toHaveBeenCalledWith(payload);
    expect(result.message).toBe('Bike submitted for approval');
  });
});
