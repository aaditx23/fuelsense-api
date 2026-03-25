import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BIKE_REPOSITORY } from '../../../src/modules/bikes/domain/repositories/bike.repository';
import type { BikeRepository } from '../../../src/modules/bikes/domain/repositories/bike.repository';
import { SelectBikeUseCase } from '../../../src/modules/bikes/application/use-cases/select-bike.use-case';

describe('SelectBikeUseCase', () => {
  let useCase: SelectBikeUseCase;

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
        SelectBikeUseCase,
        {
          provide: BIKE_REPOSITORY,
          useValue: bikeRepositoryMock,
        },
      ],
    }).compile();

    useCase = module.get<SelectBikeUseCase>(SelectBikeUseCase);
  });

  it('throws when bike does not exist', async () => {
    bikeRepositoryMock.findById.mockResolvedValue(null);

    await expect(useCase.execute(1, 99)).rejects.toThrow(NotFoundException);
  });

  it('returns idempotent response when bike already selected', async () => {
    bikeRepositoryMock.findById.mockResolvedValue({
      id: 5,
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
    bikeRepositoryMock.hasUserBikeSelection.mockResolvedValue(true);

    const result = await useCase.execute(1, 5);

    expect(result.message).toBe('Bike already selected');
    expect(bikeRepositoryMock.selectBike).not.toHaveBeenCalled();
  });

  it('selects bike for user when not yet selected', async () => {
    bikeRepositoryMock.findById.mockResolvedValue({
      id: 5,
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
    bikeRepositoryMock.hasUserBikeSelection.mockResolvedValue(false);

    const result = await useCase.execute(1, 5);

    expect(bikeRepositoryMock.selectBike).toHaveBeenCalledWith(1, 5);
    expect(result.message).toBe('Bike selected successfully');
  });
});
