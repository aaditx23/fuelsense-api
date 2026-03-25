import { Test, TestingModule } from '@nestjs/testing';
import { REFUEL_REPOSITORY } from '../../../src/modules/refuel/domain/repositories/refuel.repository';
import type { RefuelRepository } from '../../../src/modules/refuel/domain/repositories/refuel.repository';
import { GetRefuelRecordsUseCase } from '../../../src/modules/refuel/application/use-cases/get-refuel-records.use-case';

describe('GetRefuelRecordsUseCase', () => {
  let useCase: GetRefuelRecordsUseCase;

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
        GetRefuelRecordsUseCase,
        {
          provide: REFUEL_REPOSITORY,
          useValue: repositoryMock,
        },
      ],
    }).compile();

    useCase = module.get<GetRefuelRecordsUseCase>(GetRefuelRecordsUseCase);
  });

  it('returns no records message when list is empty', async () => {
    repositoryMock.getUserRefuelRecords.mockResolvedValue([]);

    const result = await useCase.execute(1);

    expect(result.message).toBe('No refuel records found');
    expect(result.listData).toEqual([]);
  });

  it('returns refuel records list', async () => {
    repositoryMock.getUserRefuelRecords.mockResolvedValue([
      {
        id: 1,
        userId: 1,
        userBikeId: 3,
        odometerReading: 1200,
        tripMeterReading: null,
        tripMeterAtReserve: null,
        odometerAtReserve: null,
        fuelLiter: 2,
        fuelPrice: null,
        createdAt: new Date(),
      },
    ]);

    const result = await useCase.execute(1);

    expect(result.message).toBe('Refuel records fetched successfully');
    expect(result.listData).toHaveLength(1);
  });
});
