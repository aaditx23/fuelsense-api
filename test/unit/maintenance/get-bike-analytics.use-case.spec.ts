import { Test, TestingModule } from '@nestjs/testing';
import { GetBikeAnalyticsUseCase } from '../../../src/modules/maintenance/application/use-cases/get-bike-analytics.use-case';
import { MAINTENANCE_REPOSITORY } from '../../../src/modules/maintenance/domain/repositories/maintenance.repository';
import type { MaintenanceRepository } from '../../../src/modules/maintenance/domain/repositories/maintenance.repository';

describe('GetBikeAnalyticsUseCase', () => {
  let useCase: GetBikeAnalyticsUseCase;

  const repositoryMock: jest.Mocked<MaintenanceRepository> = {
    isUserBikeOwnedByUser: jest.fn(),
    createMaintenanceRecord: jest.fn(),
    getUserMaintenanceLogs: jest.fn(),
    getBikeModelMaintenanceLogs: jest.fn(),
    getBikeModelUserBikes: jest.fn(),
    getBikeModelFuelRecords: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetBikeAnalyticsUseCase,
        {
          provide: MAINTENANCE_REPOSITORY,
          useValue: repositoryMock,
        },
      ],
    }).compile();

    useCase = module.get<GetBikeAnalyticsUseCase>(GetBikeAnalyticsUseCase);
  });

  it('correctly aggregates metrics for a bike model', async () => {
    // 1. Mock fuel records for mileage
    repositoryMock.getBikeModelFuelRecords.mockResolvedValue([
      { id: 1, userBikeId: 10, tripMeterReading: 120, fuelLiter: 4 },
      { id: 2, userBikeId: 10, tripMeterReading: 150, fuelLiter: 5 },
      { id: 3, userBikeId: 11, tripMeterReading: null, fuelLiter: 3 }, // missing distance
      { id: 4, userBikeId: 11, tripMeterReading: 80, fuelLiter: 0 },   // zero fuel
      { id: 5, userBikeId: 11, tripMeterReading: 180, fuelLiter: 6 },
    ]);

    // Expected mileage: (120 + 150 + 180) / (4 + 5 + 6) = 450 / 15 = 30.0

    // 2. Mock user bikes with varying age
    const now = new Date();
    const bike10CreatedAt = new Date();
    bike10CreatedAt.setMonth(now.getMonth() - 2); // 2 months old

    const bike11CreatedAt = new Date();
    bike11CreatedAt.setMonth(now.getMonth() - 6); // 6 months old

    repositoryMock.getBikeModelUserBikes.mockResolvedValue([
      { id: 10, userId: 1, createdAt: bike10CreatedAt },
      { id: 11, userId: 2, createdAt: bike11CreatedAt },
    ]);

    // 3. Mock maintenance logs
    repositoryMock.getBikeModelMaintenanceLogs.mockResolvedValue([
      // Bike 10 (2 months old): Total cost = 1200
      {
        id: 101,
        userId: 1,
        userBikeId: 10,
        odometerReading: 1000,
        category: 'ENGINE_OIL',
        description: 'First oil change',
        partsCost: 500,
        laborCost: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 102,
        userId: 1,
        userBikeId: 10,
        odometerReading: 3500,
        category: 'ENGINE_OIL',
        description: 'Second oil change',
        partsCost: 500,
        laborCost: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Bike 11 (6 months old): Total cost = 3000, 1 unscheduled repair (category OTHER)
      {
        id: 103,
        userId: 2,
        userBikeId: 11,
        odometerReading: 8000,
        category: 'BRAKE_PADS',
        description: 'Brake pads replacement',
        partsCost: 800,
        laborCost: 200,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 104,
        userId: 2,
        userBikeId: 11,
        odometerReading: 9500,
        category: 'OTHER',
        description: 'Electrical fix (Unscheduled)',
        partsCost: 1800,
        laborCost: 200,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Cost calculations:
    // Bike 10 (age 2 months): cost = 1200, monthly = 1200 / 2 = 600
    // Bike 11 (age 6 months): cost = 3000, monthly = 3000 / 6 = 500
    // Average monthly cost: (600 + 500) / 2 = 550

    // Reliability calculations:
    // Bike 10: OTHER count = 0 -> Score = 5.0
    // Bike 11: OTHER count = 1, age = 6 months (0.5 years). Yearly frequency = 1 / 0.5 = 2.
    //          Deduction = 0.5 * 2 = 1.0. Score = 5.0 - 1.0 = 4.0
    // Average reliability: (5.0 + 4.0) / 2 = 4.5

    // Consumable lifespan:
    // ENGINE_OIL has logs at 1000 and 3500 for Bike 10. Interval = 2500.
    // BRAKE_PADS has only 1 log -> excluded.
    // OTHER has only 1 log -> excluded.
    // Expected: ENGINE_OIL = 2500

    const result = await useCase.execute(42);

    expect(result.success).toBe(true);
    expect(result.data?.realMileage).toBe(30.0);
    expect(result.data?.averageMonthlyCost).toBe(550.0);
    expect(result.data?.reliabilityScore).toBe(4.5);
    expect(result.data?.consumablesLifespan).toEqual({
      ENGINE_OIL: 2500,
    });
  });

  it('returns default metrics when no history is present', async () => {
    repositoryMock.getBikeModelFuelRecords.mockResolvedValue([]);
    repositoryMock.getBikeModelUserBikes.mockResolvedValue([]);
    repositoryMock.getBikeModelMaintenanceLogs.mockResolvedValue([]);

    const result = await useCase.execute(42);

    expect(result.success).toBe(true);
    expect(result.data?.realMileage).toBe(0.0);
    expect(result.data?.averageMonthlyCost).toBe(0.0);
    expect(result.data?.reliabilityScore).toBe(5.0);
    expect(result.data?.consumablesLifespan).toEqual({});
  });
});
