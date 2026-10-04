import { NotFoundException } from '@nestjs/common';
import { GetBikeBrandInsightsUseCase } from '../../../src/modules/community/application/use-cases/get-bike-brand-insights.use-case';
import type {
  CommunityRepository,
  MaintenanceRecordRow,
} from '../../../src/modules/community/domain/repositories/community.repository';
import {
  computeBrandInsights,
  MIN_BRAND_RIDERS,
  MIN_BRAND_SAMPLES,
} from '../../../src/modules/community/domain/services/brand-insights';

const row = (
  userBikeId: number,
  odometerReading: number,
  partsBrand: string | null,
  cost = 400,
  category = 'ENGINE_OIL',
): MaintenanceRecordRow => ({
  userBikeId,
  category,
  odometerReading,
  partsCost: cost,
  laborCost: 0,
  partsBrand,
});

/** `bikes` bikes each changing oil `changes` times, 1000 km apart. */
function history(
  brand: string,
  bikes: number,
  changes: number,
  firstBike = 1,
  cost = 400,
): MaintenanceRecordRow[] {
  const rows: MaintenanceRecordRow[] = [];
  for (let b = 0; b < bikes; b++) {
    for (let c = 0; c <= changes; c++) {
      rows.push(row(firstBike + b, c * 1000, brand, cost));
    }
  }

  return rows;
}

describe('computeBrandInsights', () => {
  it('measures a lifespan from one replacement to the next', () => {
    const rows = [row(1, 1000, 'Motul'), row(1, 2500, 'Motul')];

    const [category] = computeBrandInsights(rows);

    expect(category.sampleCount).toBe(1);
    // One sample is below the ranking threshold, so no brand is listed yet.
    expect(category.brands).toEqual([]);
  });

  it('ranks a brand with enough bikes and lifespans', () => {
    const [category] = computeBrandInsights(history('Motul', 3, 2));

    expect(category.sampleCount).toBe(6);
    expect(category.brands).toHaveLength(1);
    expect(category.brands[0]).toMatchObject({
      brand: 'Motul',
      sampleCount: 6,
      riderCount: 3,
      avgLifespanKm: 1000,
      avgCost: 400,
      costPer1000Km: 400,
    });
  });

  it('needs enough distinct bikes, not just enough samples', () => {
    const [category] = computeBrandInsights(history('Motul', 2, 4));

    expect(category.sampleCount).toBe(8);
    expect(category.brands).toEqual([]);
  });

  it('needs enough samples even with enough bikes', () => {
    const [category] = computeBrandInsights(history('Motul', 3, 1));

    expect(category.sampleCount).toBe(3);
    expect(category.brands).toEqual([]);
    expect(MIN_BRAND_SAMPLES).toBeGreaterThan(3);
    expect(MIN_BRAND_RIDERS).toBe(3);
  });

  it('leaves out the part still in use, which has no next replacement', () => {
    const [category] = computeBrandInsights(history('Motul', 3, 2));

    // 3 bikes x 3 logs = 9 rows, but only 6 completed lifespans.
    expect(category.sampleCount).toBe(6);
  });

  it('gives a lifespan to the brand fitted first, not the one that replaced it', () => {
    const rows = [
      ...history('Motul', 3, 2),
      // One bike switched brands: its Motul lasted 1000, its Castrol is still on.
      row(9, 0, 'Motul'),
      row(9, 1000, 'Castrol'),
    ];

    const [category] = computeBrandInsights(rows);

    expect(category.sampleCount).toBe(7);
    expect(category.brands.map((b) => b.brand)).toEqual(['Motul']);
  });

  it('ranks the cheaper brand per 1,000 km first', () => {
    const rows = [
      ...history('Motul', 3, 2, 1, 600), // 600 per 1000 km
      ...history('Castrol', 3, 2, 10, 300), // 300 per 1000 km
    ];

    const [category] = computeBrandInsights(rows);

    expect(category.brands.map((b) => b.brand)).toEqual(['Castrol', 'Motul']);
  });

  it('weighs cost by distance, not per replacement', () => {
    // Same 500 TK per change, but one brand lasts twice as long.
    const longer: MaintenanceRecordRow[] = [];
    for (let b = 0; b < 3; b++) {
      for (let c = 0; c <= 2; c++) {
        longer.push(row(20 + b, c * 2000, 'Longlife', 500));
      }
    }
    const rows = [...history('Standard', 3, 2, 1, 500), ...longer];

    const [category] = computeBrandInsights(rows);

    expect(category.brands[0]).toMatchObject({
      brand: 'Longlife',
      costPer1000Km: 250,
    });
  });

  it('has no cost figure when no cost was logged, and lists it last', () => {
    const rows = [
      ...history('Free', 3, 2, 1, 0),
      ...history('Paid', 3, 2, 10, 500),
    ];

    const [category] = computeBrandInsights(rows);

    expect(category.brands.map((b) => b.brand)).toEqual(['Paid', 'Free']);
    expect(category.brands[1].costPer1000Km).toBeNull();
  });

  it('groups brands that differ only in case', () => {
    const rows = [
      ...history('Motul', 2, 2, 1),
      ...history('motul', 1, 2, 5),
    ];

    const [category] = computeBrandInsights(rows);

    expect(category.brands).toHaveLength(1);
    expect(category.brands[0].riderCount).toBe(3);
    expect(category.brands[0].brand).toBe('Motul');
  });

  it('ignores replacements with no brand, and non-increasing odometers', () => {
    const rows = [
      row(1, 1000, null),
      row(1, 2000, 'Motul'),
      row(2, 3000, 'Motul'),
      row(2, 3000, 'Motul'),
    ];

    const [category] = computeBrandInsights(rows);

    expect(category?.sampleCount ?? 0).toBe(0);
  });

  it('keeps categories apart', () => {
    const rows = [
      ...history('Motul', 3, 2),
      ...history('NGK', 3, 2, 1).map((r) => ({ ...r, category: 'SPARK_PLUG' })),
    ];

    const categories = computeBrandInsights(rows);

    expect(categories.map((c) => c.category)).toEqual(['ENGINE_OIL', 'SPARK_PLUG']);
    expect(categories[1].brands[0].brand).toBe('NGK');
  });

  it('returns nothing for no maintenance', () => {
    expect(computeBrandInsights([])).toEqual([]);
  });
});

describe('GetBikeBrandInsightsUseCase', () => {
  const repository = {
    getBikeById: jest.fn(),
    getBikeMaintenanceRecords: jest.fn(),
  };
  const useCase = new GetBikeBrandInsightsUseCase(
    repository as unknown as CommunityRepository,
  );

  beforeEach(() => jest.resetAllMocks());

  it('404s for an unknown bike', async () => {
    repository.getBikeById.mockResolvedValue(null);

    await expect(useCase.execute(99)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns the thresholds and the categories', async () => {
    repository.getBikeById.mockResolvedValue({ id: 5 });
    repository.getBikeMaintenanceRecords.mockResolvedValue(history('Motul', 3, 2));

    const { data } = await useCase.execute(5);

    expect(data).toMatchObject({
      bikeId: 5,
      minRiders: MIN_BRAND_RIDERS,
      minSamples: MIN_BRAND_SAMPLES,
    });
    expect(data!.categories[0].brands[0].brand).toBe('Motul');
  });
});
