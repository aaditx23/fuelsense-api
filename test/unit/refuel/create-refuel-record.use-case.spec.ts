import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { REFUEL_REPOSITORY } from '../../../src/modules/refuel/domain/repositories/refuel.repository';
import type { RefuelRepository } from '../../../src/modules/refuel/domain/repositories/refuel.repository';
import { CreateRefuelRecordUseCase } from '../../../src/modules/refuel/application/use-cases/create-refuel-record.use-case';

describe('CreateRefuelRecordUseCase', () => {
  let useCase: CreateRefuelRecordUseCase;

  const repositoryMock: jest.Mocked<RefuelRepository> = {
    isUserBikeOwnedByUser: jest.fn(),
    countByUserBike: jest.fn(),
    createRefuelRecord: jest.fn(),
    getUserRefuelRecords: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateRefuelRecordUseCase,
        {
          provide: REFUEL_REPOSITORY,
          useValue: repositoryMock,
        },
      ],
    }).compile();

    useCase = module.get<CreateRefuelRecordUseCase>(CreateRefuelRecordUseCase);
  });

  it('rejects when fuelLiter and fuelPrice are both missing', async () => {
    await expect(
      useCase.execute(1, {
        userBikeId: 10,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects when fuelLiter and fuelPrice are both provided', async () => {
    await expect(
      useCase.execute(1, {
        userBikeId: 10,
        fuelLiter: 2,
        fuelPrice: 300,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects when user does not own the selected userBike', async () => {
    repositoryMock.isUserBikeOwnedByUser.mockResolvedValue(false);

    await expect(
      useCase.execute(1, {
        userBikeId: 10,
        fuelLiter: 2,
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('requires odometerReading for first refuel', async () => {
    repositoryMock.isUserBikeOwnedByUser.mockResolvedValue(true);
    repositoryMock.countByUserBike.mockResolvedValue(0);

    await expect(
      useCase.execute(1, {
        userBikeId: 10,
        fuelLiter: 2,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('requires odometerReading or tripMeterReading for non-first refuel', async () => {
    repositoryMock.isUserBikeOwnedByUser.mockResolvedValue(true);
    repositoryMock.countByUserBike.mockResolvedValue(2);

    await expect(
      useCase.execute(1, {
        userBikeId: 10,
        fuelPrice: 300,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('creates refuel record successfully when input is valid', async () => {
    repositoryMock.isUserBikeOwnedByUser.mockResolvedValue(true);
    repositoryMock.countByUserBike.mockResolvedValue(0);
    repositoryMock.createRefuelRecord.mockResolvedValue({
      id: 1,
      userId: 1,
      userBikeId: 10,
      odometerReading: 1200,
      tripMeterReading: null,
      tripMeterAtReserve: null,
      odometerAtReserve: null,
      fuelLiter: 2,
      fuelPrice: null,
      createdAt: new Date(),
    });

    const result = await useCase.execute(1, {
      userBikeId: 10,
      odometerReading: 1200,
      fuelLiter: 2,
    });

    expect(repositoryMock.createRefuelRecord).toHaveBeenCalled();
    expect(result.message).toBe('Refuel record created successfully');
    expect(result.data?.userBikeId).toBe(10);
  });
});
