import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { REFUEL_REPOSITORY } from '../../../src/modules/refuel/domain/repositories/refuel.repository';
import type { RefuelRepository } from '../../../src/modules/refuel/domain/repositories/refuel.repository';
import { CreateRefuelRecordUseCase } from '../../../src/modules/refuel/application/use-cases/create-refuel-record.use-case';

describe('CreateRefuelRecordUseCase', () => {
  let useCase: CreateRefuelRecordUseCase;

  const repositoryMock: jest.Mocked<RefuelRepository> = {
    isUserBikeOwnedByUser: jest.fn(),
    countByUserBike: jest.fn(),
    hasIncompleteReserve: jest.fn(),
    findOwnedRecord: jest.fn(),
    createRefuelRecord: jest.fn(),
    completeReserveRecord: jest.fn(),
    deleteRefuelRecord: jest.fn(),
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

  it('accepts both fuelLiter and fuelPrice and stores both', async () => {
    repositoryMock.isUserBikeOwnedByUser.mockResolvedValue(true);
    repositoryMock.countByUserBike.mockResolvedValue(0);
    repositoryMock.createRefuelRecord.mockResolvedValue({
      id: 2,
      userId: 1,
      userBikeId: 10,
      odometerReading: 1200,
      tripMeterReading: null,
      tripMeterAtReserve: null,
      odometerAtReserve: null,
      fuelLiter: 2,
      fuelPrice: 300,
      entryType: 'TOPUP',
      createdAt: new Date(),
    });

    await useCase.execute(1, {
      userBikeId: 10,
      odometerReading: 1200,
      fuelLiter: 2,
      fuelPrice: 300,
    });

    expect(repositoryMock.createRefuelRecord).toHaveBeenCalledWith(
      expect.objectContaining({ fuelLiter: 2, fuelPrice: 300 }),
    );
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
      entryType: 'TOPUP',
      createdAt: new Date(),
    });

    const result = await useCase.execute(1, {
      userBikeId: 10,
      odometerReading: 1200,
      fuelLiter: 2,
    });

    expect(repositoryMock.createRefuelRecord).toHaveBeenCalledWith(
      expect.objectContaining({ entryType: 'TOPUP' }),
    );
    expect(result.message).toBe('Refuel record created successfully');
    expect(result.data?.userBikeId).toBe(10);
  });

  describe('RESERVE_INCOMPLETE marker', () => {
    const markerRecord = {
      id: 5,
      userId: 1,
      userBikeId: 10,
      odometerReading: null,
      tripMeterReading: null,
      tripMeterAtReserve: 180,
      odometerAtReserve: 12200,
      fuelLiter: null,
      fuelPrice: null,
      entryType: 'RESERVE_INCOMPLETE' as const,
      createdAt: new Date(),
    };

    it('stores a marker without fuel data', async () => {
      repositoryMock.isUserBikeOwnedByUser.mockResolvedValue(true);
      repositoryMock.hasIncompleteReserve.mockResolvedValue(false);
      repositoryMock.countByUserBike.mockResolvedValue(3);
      repositoryMock.createRefuelRecord.mockResolvedValue(markerRecord);

      const result = await useCase.execute(1, {
        userBikeId: 10,
        entryType: 'RESERVE_INCOMPLETE',
        tripMeterAtReserve: 180,
        odometerAtReserve: 12200,
      });

      expect(repositoryMock.createRefuelRecord).toHaveBeenCalledWith(
        expect.objectContaining({ entryType: 'RESERVE_INCOMPLETE' }),
      );
      expect(result.data?.entryType).toBe('RESERVE_INCOMPLETE');
    });

    it('rejects a marker carrying fuel data', async () => {
      await expect(
        useCase.execute(1, {
          userBikeId: 10,
          entryType: 'RESERVE_INCOMPLETE',
          odometerAtReserve: 12200,
          fuelLiter: 2,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a marker without any reserve reading', async () => {
      await expect(
        useCase.execute(1, {
          userBikeId: 10,
          entryType: 'RESERVE_INCOMPLETE',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a second open marker for the same bike', async () => {
      repositoryMock.isUserBikeOwnedByUser.mockResolvedValue(true);
      repositoryMock.hasIncompleteReserve.mockResolvedValue(true);

      await expect(
        useCase.execute(1, {
          userBikeId: 10,
          entryType: 'RESERVE_INCOMPLETE',
          odometerAtReserve: 12200,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('requires odometerAtReserve when the marker is the first entry', async () => {
      repositoryMock.isUserBikeOwnedByUser.mockResolvedValue(true);
      repositoryMock.hasIncompleteReserve.mockResolvedValue(false);
      repositoryMock.countByUserBike.mockResolvedValue(0);

      await expect(
        useCase.execute(1, {
          userBikeId: 10,
          entryType: 'RESERVE_INCOMPLETE',
          tripMeterAtReserve: 180,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('infers RESERVE_COMPLETE for older clients that omit entryType', async () => {
      repositoryMock.isUserBikeOwnedByUser.mockResolvedValue(true);
      repositoryMock.countByUserBike.mockResolvedValue(3);
      repositoryMock.createRefuelRecord.mockResolvedValue({
        ...markerRecord,
        odometerReading: 12300,
        fuelLiter: 4,
        entryType: 'RESERVE_COMPLETE',
      });

      await useCase.execute(1, {
        userBikeId: 10,
        odometerReading: 12300,
        odometerAtReserve: 12200,
        fuelLiter: 4,
      });

      expect(repositoryMock.createRefuelRecord).toHaveBeenCalledWith(
        expect.objectContaining({ entryType: 'RESERVE_COMPLETE' }),
      );
    });
  });
});
