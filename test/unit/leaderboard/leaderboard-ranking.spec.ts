import type {
  LeaderboardBikeSummary,
  LeaderboardStatWithBike,
} from '../../../src/modules/leaderboard/domain/repositories/leaderboard.repository';
import {
  engineClassOf,
  higherIsBetter,
  matchesFilter,
  rankBikes,
} from '../../../src/modules/leaderboard/domain/services/leaderboard-ranking';
import { GetBikeLeaderboardPositionUseCase } from '../../../src/modules/leaderboard/application/use-cases/get-bike-leaderboard-position.use-case';
import { GetBikeLeaderboardUseCase } from '../../../src/modules/leaderboard/application/use-cases/get-bike-leaderboard.use-case';
import type { LeaderboardRepository } from '../../../src/modules/leaderboard/domain/repositories/leaderboard.repository';
import type { RebuildBikeLeaderboardUseCase } from '../../../src/modules/leaderboard/application/use-cases/rebuild-bike-leaderboard.use-case';

const bike = (
  id: number,
  overrides: Partial<LeaderboardBikeSummary> = {},
): LeaderboardBikeSummary => ({
  id,
  brand: 'Yamaha',
  model: `M${id}`,
  engineCc: 150,
  modelYear: 2024,
  fuelType: 'PETROL',
  image: null,
  expectedMileage: 40,
  ...overrides,
});

const row = (
  id: number,
  figures: Partial<LeaderboardStatWithBike> = {},
  bikeOverrides: Partial<LeaderboardBikeSummary> = {},
): LeaderboardStatWithBike => ({
  bikeId: id,
  period: 'ALL',
  ownerCount: 6,
  runningOwnerCount: 6,
  maintenanceOwnerCount: 6,
  avgMileage: 40,
  claimRatio: 1,
  runningCostPerKm: 3,
  maintenanceCostPer1000Km: 500,
  updatedAt: new Date('2026-10-01'),
  bike: bike(id, bikeOverrides),
  ...figures,
});

describe('engine classes', () => {
  it('buckets by displacement', () => {
    expect(engineClassOf(100)).toBe('UP_TO_110');
    expect(engineClassOf(110)).toBe('UP_TO_110');
    expect(engineClassOf(111)).toBe('CC_111_150');
    expect(engineClassOf(150)).toBe('CC_111_150');
    expect(engineClassOf(155)).toBe('CC_151_200');
    expect(engineClassOf(200)).toBe('CC_151_200');
    expect(engineClassOf(250)).toBe('OVER_200');
  });
});

describe('rankBikes', () => {
  it('ranks higher claim ratios first', () => {
    const entries = rankBikes(
      [row(1, { claimRatio: 0.8 }), row(2, { claimRatio: 1.1 }), row(3, { claimRatio: 0.9 })],
      'claim',
    );

    expect(entries.map((e) => [e.rank, e.bike.id])).toEqual([
      [1, 2],
      [2, 3],
      [3, 1],
    ]);
  });

  it('ranks lower costs first', () => {
    expect(higherIsBetter('running-cost')).toBe(false);

    const entries = rankBikes(
      [row(1, { runningCostPerKm: 4 }), row(2, { runningCostPerKm: 2.5 })],
      'running-cost',
    );

    expect(entries.map((e) => e.bike.id)).toEqual([2, 1]);
  });

  it('lets equal values share a place and the next place follow them', () => {
    const entries = rankBikes(
      [
        row(1, { avgMileage: 50 }),
        row(2, { avgMileage: 50 }),
        row(3, { avgMileage: 40 }),
      ],
      'mileage',
    );

    expect(entries.map((e) => e.rank)).toEqual([1, 1, 3]);
  });

  it('breaks ties toward the model with more owners', () => {
    const entries = rankBikes(
      [
        row(1, { avgMileage: 50, ownerCount: 6 }),
        row(2, { avgMileage: 50, ownerCount: 9 }),
      ],
      'mileage',
    );

    expect(entries.map((e) => e.bike.id)).toEqual([2, 1]);
  });

  it('lists models with too few owners unranked, after the ranked ones', () => {
    const entries = rankBikes(
      [
        row(1, { avgMileage: 99, ownerCount: 2 }),
        row(2, { avgMileage: 30, ownerCount: 6 }),
        row(3, { avgMileage: 80, ownerCount: 4 }),
      ],
      'mileage',
    );

    expect(entries.map((e) => [e.bike.id, e.rank, e.ranked])).toEqual([
      [2, 1, true],
      [3, null, false],
      [1, null, false],
    ]);
  });

  it('five owners are enough, four are not', () => {
    const entries = rankBikes(
      [row(1, { ownerCount: 5 }), row(2, { ownerCount: 4 })],
      'mileage',
    );

    expect(entries.find((e) => e.bike.id === 1)?.ranked).toBe(true);
    expect(entries.find((e) => e.bike.id === 2)?.ranked).toBe(false);
  });

  it('judges each cost metric by its own owner count', () => {
    const entries = rankBikes(
      [row(1, { ownerCount: 9, maintenanceOwnerCount: 2 })],
      'maintenance-cost',
    );

    expect(entries[0]).toMatchObject({ ranked: false, ownerCount: 2 });
  });

  it('leaves out models with no figure for the metric', () => {
    const entries = rankBikes(
      [row(1, { runningCostPerKm: null }), row(2)],
      'running-cost',
    );

    expect(entries.map((e) => e.bike.id)).toEqual([2]);
  });

  it('applies the filters', () => {
    const rows = [
      row(1, {}, { engineCc: 100 }),
      row(2, {}, { engineCc: 160, brand: 'Honda' }),
      row(3, {}, { engineCc: 160, fuelType: 'OCTANE' }),
      row(4, {}, { engineCc: 160, modelYear: 2020 }),
    ];

    expect(rankBikes(rows, 'mileage', { engineClass: 'CC_151_200' }).map((e) => e.bike.id))
      .toEqual([2, 3, 4]);
    expect(rankBikes(rows, 'mileage', { brand: 'honda' }).map((e) => e.bike.id)).toEqual([2]);
    expect(rankBikes(rows, 'mileage', { fuelType: 'OCTANE' }).map((e) => e.bike.id)).toEqual([3]);
    expect(rankBikes(rows, 'mileage', { year: 2020 }).map((e) => e.bike.id)).toEqual([4]);
  });

  it('ranks within the filter, not against filtered-out models', () => {
    const entries = rankBikes(
      [row(1, { avgMileage: 90 }, { engineCc: 100 }), row(2, { avgMileage: 40 })],
      'mileage',
      { engineClass: 'CC_111_150' },
    );

    expect(entries).toHaveLength(1);
    expect(entries[0].rank).toBe(1);
  });

  it('returns nothing for no rows', () => {
    expect(rankBikes([], 'mileage')).toEqual([]);
  });
});

describe('matchesFilter', () => {
  it('matches everything with an empty filter', () => {
    expect(matchesFilter(bike(1), {})).toBe(true);
  });
});

describe('leaderboard use cases', () => {
  const repository = { findStats: jest.fn(), countStats: jest.fn() };
  const rebuild = { execute: jest.fn() };
  const leaderboard = new GetBikeLeaderboardUseCase(
    repository as unknown as LeaderboardRepository,
    rebuild as unknown as RebuildBikeLeaderboardUseCase,
  );
  const position = new GetBikeLeaderboardPositionUseCase(
    repository as unknown as LeaderboardRepository,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    repository.countStats.mockResolvedValue(3);
  });

  it('pages the entries and reports totals', async () => {
    repository.findStats.mockResolvedValue(
      Array.from({ length: 5 }, (_, i) => row(i + 1, { avgMileage: 50 - i })),
    );

    const { data } = await leaderboard.execute({ metric: 'mileage', limit: 2, offset: 1 });

    expect(data!.entries.map((e) => e.bike.id)).toEqual([2, 3]);
    expect(data).toMatchObject({ total: 5, totalRanked: 5, minOwners: 5, period: 'all' });
  });

  it('caps the page size', async () => {
    repository.findStats.mockResolvedValue(
      Array.from({ length: 80 }, (_, i) => row(i + 1, { avgMileage: 100 - i })),
    );

    const { data } = await leaderboard.execute({ metric: 'mileage', limit: 500 });

    expect(data!.entries).toHaveLength(50);
  });

  it('reads the six-month period when asked', async () => {
    repository.findStats.mockResolvedValue([]);

    await leaderboard.execute({ metric: 'mileage', period: '6m' });

    expect(repository.findStats).toHaveBeenCalledWith('LAST_6M');
  });

  it('builds the table on first use when it is empty, then not again soon', async () => {
    repository.countStats.mockResolvedValue(0);
    repository.findStats.mockResolvedValue([]);
    rebuild.execute.mockResolvedValue(undefined);

    await leaderboard.execute({ metric: 'mileage' });
    await leaderboard.execute({ metric: 'mileage' });

    expect(rebuild.execute).toHaveBeenCalledTimes(1);
  });

  it('does not rebuild when rows exist', async () => {
    repository.findStats.mockResolvedValue([]);

    await new GetBikeLeaderboardUseCase(
      repository as unknown as LeaderboardRepository,
      rebuild as unknown as RebuildBikeLeaderboardUseCase,
    ).execute({ metric: 'mileage' });

    expect(rebuild.execute).not.toHaveBeenCalled();
  });

  it('gives a model its place and the number ranked', async () => {
    repository.findStats.mockResolvedValue([
      row(1, { claimRatio: 0.9 }),
      row(2, { claimRatio: 1.2 }),
      row(3, { claimRatio: 1.0 }),
    ]);

    const { data } = await position.execute(1, 'claim');

    expect(data).toMatchObject({ bikeId: 1, rank: 3, totalRanked: 3, value: 0.9 });
  });

  it('reports no rank for a model still collecting data', async () => {
    repository.findStats.mockResolvedValue([row(1, { ownerCount: 2 }), row(2)]);

    const { data } = await position.execute(1, 'mileage');

    expect(data).toMatchObject({ rank: null, ownerCount: 2, totalRanked: 1 });
  });

  it('reports an unknown model as unranked with no owners', async () => {
    repository.findStats.mockResolvedValue([row(2)]);

    const { data } = await position.execute(99, 'mileage');

    expect(data).toMatchObject({ rank: null, ownerCount: 0, value: null });
  });
});
