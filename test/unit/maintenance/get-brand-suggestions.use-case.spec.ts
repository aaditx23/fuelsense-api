import { GetBrandSuggestionsUseCase } from '../../../src/modules/maintenance/application/use-cases/get-brand-suggestions.use-case';
import type { MaintenanceRepository } from '../../../src/modules/maintenance/domain/repositories/maintenance.repository';

describe('GetBrandSuggestionsUseCase', () => {
  const repository = { getUsedBrands: jest.fn() };
  const useCase = new GetBrandSuggestionsUseCase(
    repository as unknown as MaintenanceRepository,
  );

  beforeEach(() => jest.resetAllMocks());

  it('lists the known brands even when nobody has logged one', async () => {
    repository.getUsedBrands.mockResolvedValue([]);

    const { listData } = await useCase.execute();

    expect(listData).toEqual(expect.arrayContaining(['Motul', 'NGK', 'Castrol']));
  });

  it('adds brands riders use, sorted and without repeats', async () => {
    repository.getUsedBrands.mockResolvedValue(['Super Grip', 'motul', 'MOTUL']);

    const { listData } = await useCase.execute();

    expect(listData).toContain('Super Grip');
    expect(listData!.filter((name) => name.toLowerCase() === 'motul')).toEqual([
      'Motul',
    ]);
    expect(listData).toEqual([...listData!].sort((a, b) => a.localeCompare(b)));
  });

  it('asks for a bounded number of used brands', async () => {
    repository.getUsedBrands.mockResolvedValue([]);

    await useCase.execute();

    expect(repository.getUsedBrands).toHaveBeenCalledWith(100);
  });
});
