import { GetFuelPriceHistoryUseCase } from '../../../src/modules/fuel-prices/application/use-cases/get-fuel-price-history.use-case';
import type { FuelPriceRepository } from '../../../src/modules/fuel-prices/domain/repositories/fuel-price.repository';

describe('GetFuelPriceHistoryUseCase', () => {
  const repository = { findHistory: jest.fn() };
  const useCase = new GetFuelPriceHistoryUseCase(
    repository as unknown as FuelPriceRepository,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-10-04T00:00:00Z'));
  });

  afterEach(() => jest.useRealTimers());

  it('asks for the last 90 days by default', async () => {
    repository.findHistory.mockResolvedValue([]);

    await useCase.execute('PETROL');

    const [fuelType, since] = repository.findHistory.mock.calls[0];
    expect(fuelType).toBe('PETROL');
    expect((since as Date).toISOString()).toBe('2026-07-06T00:00:00.000Z');
  });

  it('honours the requested number of days', async () => {
    repository.findHistory.mockResolvedValue([]);

    await useCase.execute('DIESEL', 30);

    const since = repository.findHistory.mock.calls[0][1] as Date;
    expect(since.toISOString()).toBe('2026-09-04T00:00:00.000Z');
  });

  it('returns the points oldest first as list data', async () => {
    repository.findHistory.mockResolvedValue([
      { effectiveDate: new Date('2026-09-01'), price: 120 },
      { effectiveDate: new Date('2026-10-01'), price: 123 },
    ]);

    const response = await useCase.execute('OCTANE', 60);

    expect(response.success).toBe(true);
    expect(response.listData).toEqual([
      { effectiveDate: new Date('2026-09-01'), price: 120 },
      { effectiveDate: new Date('2026-10-01'), price: 123 },
    ]);
  });

  it('says so when there is no history', async () => {
    repository.findHistory.mockResolvedValue([]);

    const response = await useCase.execute('PETROL');

    expect(response.listData).toEqual([]);
    expect(response.message).toMatch(/No fuel price history/);
  });
});
