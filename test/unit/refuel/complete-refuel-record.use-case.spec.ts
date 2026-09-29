import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { REFUEL_REPOSITORY } from '../../../src/modules/refuel/domain/repositories/refuel.repository';
import type { RefuelRepository } from '../../../src/modules/refuel/domain/repositories/refuel.repository';
import { CompleteRefuelRecordUseCase } from '../../../src/modules/refuel/application/use-cases/complete-refuel-record.use-case';
import { DeleteRefuelRecordUseCase } from '../../../src/modules/refuel/application/use-cases/delete-refuel-record.use-case';

const record = (entryType: 'RESERVE_INCOMPLETE' | 'RESERVE_COMPLETE' | 'TOPUP') => ({
  id: 5,
  userId: 1,
  userBikeId: 10,
  odometerReading: null,
  tripMeterReading: null,
  tripMeterAtReserve: 180,
  odometerAtReserve: 12200,
  fuelLiter: null,
  fuelPrice: null,
  entryType,
  createdAt: new Date(),
});

describe('Complete/Delete refuel record use cases', () => {
  let complete: CompleteRefuelRecordUseCase;
  let remove: DeleteRefuelRecordUseCase;

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
        CompleteRefuelRecordUseCase,
        DeleteRefuelRecordUseCase,
        { provide: REFUEL_REPOSITORY, useValue: repositoryMock },
      ],
    }).compile();

    complete = module.get(CompleteRefuelRecordUseCase);
    remove = module.get(DeleteRefuelRecordUseCase);
  });

  it('completes an incomplete reserve entry', async () => {
    repositoryMock.findOwnedRecord.mockResolvedValue(record('RESERVE_INCOMPLETE'));
    repositoryMock.completeReserveRecord.mockResolvedValue({
      ...record('RESERVE_COMPLETE'),
      odometerReading: 12300,
      fuelLiter: 4,
    });

    const result = await complete.execute(1, 5, {
      odometerReading: 12300,
      fuelLiter: 4,
    });

    expect(repositoryMock.completeReserveRecord).toHaveBeenCalledWith(5, {
      odometerReading: 12300,
      tripMeterReading: undefined,
      fuelLiter: 4,
      fuelPrice: undefined,
    });
    expect(result.data?.entryType).toBe('RESERVE_COMPLETE');
  });

  it('rejects completion without exactly one of fuelLiter/fuelPrice', async () => {
    await expect(
      complete.execute(1, 5, { odometerReading: 12300 }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      complete.execute(1, 5, { odometerReading: 12300, fuelLiter: 2, fuelPrice: 300 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects completion without a meter reading', async () => {
    await expect(complete.execute(1, 5, { fuelLiter: 2 })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('returns not found for a record the user does not own', async () => {
    repositoryMock.findOwnedRecord.mockResolvedValue(null);

    await expect(
      complete.execute(1, 5, { odometerReading: 12300, fuelLiter: 2 }),
    ).rejects.toThrow(NotFoundException);
  });

  it('refuses to complete an entry that is not incomplete', async () => {
    repositoryMock.findOwnedRecord.mockResolvedValue(record('TOPUP'));

    await expect(
      complete.execute(1, 5, { odometerReading: 12300, fuelLiter: 2 }),
    ).rejects.toThrow(ConflictException);
  });

  it('deletes an owned record', async () => {
    repositoryMock.findOwnedRecord.mockResolvedValue(record('TOPUP'));

    const result = await remove.execute(1, 5);

    expect(repositoryMock.deleteRefuelRecord).toHaveBeenCalledWith(5);
    expect(result.success).toBe(true);
  });

  it('returns not found when deleting a record the user does not own', async () => {
    repositoryMock.findOwnedRecord.mockResolvedValue(null);

    await expect(remove.execute(1, 5)).rejects.toThrow(NotFoundException);
    expect(repositoryMock.deleteRefuelRecord).not.toHaveBeenCalled();
  });
});
