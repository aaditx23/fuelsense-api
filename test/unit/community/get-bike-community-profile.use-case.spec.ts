import { NotFoundException } from '@nestjs/common';
import { GetBikeCommunityProfileUseCase } from '../../../src/modules/community/application/use-cases/get-bike-community-profile.use-case';
import type { CommunityRepository } from '../../../src/modules/community/domain/repositories/community.repository';

describe('GetBikeCommunityProfileUseCase', () => {
  const repository = {
    getBikeById: jest.fn(),
    getBikeMileageSamples: jest.fn(),
    getBikeMaintenanceRecords: jest.fn(),
    getBikeFuelContributorIds: jest.fn(),
  };
  const useCase = new GetBikeCommunityProfileUseCase(
    repository as unknown as CommunityRepository,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    repository.getBikeById.mockResolvedValue({ id: 5, brand: 'Bajaj', model: 'Pulsar' });
    repository.getBikeMaintenanceRecords.mockResolvedValue([]);
    repository.getBikeFuelContributorIds.mockResolvedValue([]);
  });

  it('404s for an unknown bike', async () => {
    repository.getBikeById.mockResolvedValue(null);
    await expect(useCase.execute(99)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('reports zeros and no sample when nobody has a completed reserve cycle', async () => {
    repository.getBikeMileageSamples.mockResolvedValue([]);
    repository.getBikeFuelContributorIds.mockResolvedValue([11]);

    const { data } = await useCase.execute(5);

    expect(data!.mileage).toEqual({ avg: 0, min: 0, max: 0, sampleSize: 0 });
    // The owner logged fuel, so they still count as a contributor.
    expect(data!.totalContributors).toBe(1);
  });

  it('derives min, avg and max from per-owner km/L', async () => {
    repository.getBikeMileageSamples.mockResolvedValue([
      { distance: 300, fuel: 6 }, // 50
      { distance: 200, fuel: 8 }, // 25
    ]);
    repository.getBikeFuelContributorIds.mockResolvedValue([11, 12]);

    const { data } = await useCase.execute(5);

    expect(data!.mileage).toEqual({ avg: 37.5, min: 25, max: 50, sampleSize: 2 });
    expect(data!.totalContributors).toBe(2);
  });

  it('counts an owner who only logged maintenance as a contributor once', async () => {
    repository.getBikeMileageSamples.mockResolvedValue([{ distance: 100, fuel: 2 }]);
    repository.getBikeFuelContributorIds.mockResolvedValue([11]);
    repository.getBikeMaintenanceRecords.mockResolvedValue([
      { userBikeId: 11, category: 'ENGINE_OIL', odometerReading: 1000, partsCost: 500, laborCost: 0, partsBrand: 'Motul' },
      { userBikeId: 12, category: 'ENGINE_OIL', odometerReading: 4000, partsCost: 600, laborCost: 0, partsBrand: 'Motul' },
    ]);

    const { data } = await useCase.execute(5);

    expect(data!.totalContributors).toBe(2);
    expect(data!.parts[0].category).toBe('ENGINE_OIL');
  });
});
