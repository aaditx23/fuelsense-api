import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { CronSecretGuard } from '../../../src/common/auth/cron-secret.guard';
import { RebuildBikeLeaderboardUseCase } from '../../../src/modules/leaderboard/application/use-cases/rebuild-bike-leaderboard.use-case';
import type { LeaderboardRepository } from '../../../src/modules/leaderboard/domain/repositories/leaderboard.repository';
import type { OwnerActivity } from '../../../src/modules/leaderboard/domain/services/leaderboard-calculator';

const NOW = new Date('2026-10-01T00:00:00Z');
const day = (offset: number): Date => new Date(NOW.getTime() + offset * 86400000);

const bike = (id: number, expectedMileage = 40) => ({
  id,
  brand: 'Brand',
  model: `M${id}`,
  engineCc: 150,
  modelYear: 2024,
  fuelType: 'PETROL',
  image: null,
  expectedMileage,
});

/** An owner who rode 400 km on `liters` between two reserve hits. */
const owner = (liters: number): OwnerActivity => ({
  fuel: [
    {
      userBikeId: 1,
      entryType: 'RESERVE_COMPLETE',
      odometerAtReserve: 1000,
      odometerReading: null,
      fuelLiter: liters,
      amount: null,
      createdAt: day(-60),
    },
    {
      userBikeId: 1,
      entryType: 'RESERVE_COMPLETE',
      odometerAtReserve: 1400,
      odometerReading: null,
      fuelLiter: 3,
      amount: null,
      createdAt: day(-30),
    },
  ],
  maintenance: [],
});

describe('RebuildBikeLeaderboardUseCase', () => {
  const repository = {
    getBikeCatalog: jest.fn(),
    loadBikeActivity: jest.fn(),
    replaceStats: jest.fn(),
  };
  const useCase = new RebuildBikeLeaderboardUseCase(
    repository as unknown as LeaderboardRepository,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    repository.replaceStats.mockResolvedValue(undefined);
  });

  it('stores a row per period for a bike with qualifying owners', async () => {
    repository.getBikeCatalog.mockResolvedValue([bike(1)]);
    repository.loadBikeActivity.mockResolvedValue([owner(10), owner(8)]);

    const { data } = await useCase.execute(NOW);

    const rows = repository.replaceStats.mock.calls[0][0];
    expect(rows.map((r: { period: string }) => r.period)).toEqual(['ALL', 'LAST_6M']);
    expect(rows[0]).toMatchObject({
      bikeId: 1,
      ownerCount: 2,
      avgMileage: 45,
      claimRatio: 1.125,
      updatedAt: NOW,
    });
    expect(data).toEqual({ bikes: 1, rows: 2 });
  });

  it('skips bikes nobody owns', async () => {
    repository.getBikeCatalog.mockResolvedValue([bike(1), bike(2)]);
    repository.loadBikeActivity.mockImplementation(async (id: number) =>
      id === 1 ? [] : [owner(10)],
    );

    await useCase.execute(NOW);

    const rows = repository.replaceStats.mock.calls[0][0];
    expect(new Set(rows.map((r: { bikeId: number }) => r.bikeId))).toEqual(new Set([2]));
  });

  it('skips a bike whose owners do not qualify for any figure', async () => {
    repository.getBikeCatalog.mockResolvedValue([bike(1)]);
    repository.loadBikeActivity.mockResolvedValue([{ fuel: [], maintenance: [] }]);

    const { data } = await useCase.execute(NOW);

    expect(repository.replaceStats).toHaveBeenCalledWith([]);
    expect(data).toEqual({ bikes: 1, rows: 0 });
  });

  it('keeps only the periods that have figures', async () => {
    repository.getBikeCatalog.mockResolvedValue([bike(1)]);
    const old: OwnerActivity = {
      fuel: owner(10).fuel.map((r) => ({ ...r, createdAt: day(-400) })),
      maintenance: [],
    };
    repository.loadBikeActivity.mockResolvedValue([old]);

    await useCase.execute(NOW);

    const rows = repository.replaceStats.mock.calls[0][0];
    expect(rows.map((r: { period: string }) => r.period)).toEqual(['ALL']);
  });

  it('replaces everything even when there is nothing to store', async () => {
    repository.getBikeCatalog.mockResolvedValue([]);

    await useCase.execute(NOW);

    expect(repository.replaceStats).toHaveBeenCalledWith([]);
  });
});

describe('CronSecretGuard', () => {
  const original = process.env.CRON_SECRET;
  const guard = new CronSecretGuard();

  const contextWith = (authorization?: string): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ headers: { authorization } }),
      }),
    }) as unknown as ExecutionContext;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = original;
    }
  });

  it('lets the scheduler in with the right secret', () => {
    process.env.CRON_SECRET = 's3cret';

    expect(guard.canActivate(contextWith('Bearer s3cret'))).toBe(true);
  });

  it('rejects a wrong or missing secret', () => {
    process.env.CRON_SECRET = 's3cret';

    expect(() => guard.canActivate(contextWith('Bearer nope'))).toThrow(ForbiddenException);
    expect(() => guard.canActivate(contextWith('s3cret'))).toThrow(ForbiddenException);
    expect(() => guard.canActivate(contextWith(undefined))).toThrow(ForbiddenException);
  });

  it('is closed when no secret is configured', () => {
    delete process.env.CRON_SECRET;

    expect(() => guard.canActivate(contextWith('Bearer '))).toThrow(ForbiddenException);
  });
});
