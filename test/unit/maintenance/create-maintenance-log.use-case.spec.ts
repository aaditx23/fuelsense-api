import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { CreateMaintenanceLogUseCase } from '../../../src/modules/maintenance/application/use-cases/create-maintenance-log.use-case';
import type { MaintenanceRepository } from '../../../src/modules/maintenance/domain/repositories/maintenance.repository';

describe('CreateMaintenanceLogUseCase', () => {
  const repository = {
    isUserBikeOwnedByUser: jest.fn(),
    createMaintenanceRecord: jest.fn(),
  };
  const useCase = new CreateMaintenanceLogUseCase(
    repository as unknown as MaintenanceRepository,
  );

  const base = { userBikeId: 10, odometerReading: 5000, category: 'ENGINE_OIL' };

  beforeEach(() => {
    jest.resetAllMocks();
    repository.isUserBikeOwnedByUser.mockResolvedValue(true);
  });

  it('rejects a bike the user does not own', async () => {
    repository.isUserBikeOwnedByUser.mockResolvedValue(false);
    await expect(useCase.execute(1, base)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects a blank category', async () => {
    await expect(useCase.execute(1, { ...base, category: '   ' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repository.createMaintenanceRecord).not.toHaveBeenCalled();
  });

  it('rejects an unparseable service date', async () => {
    await expect(
      useCase.execute(1, { ...base, serviceDate: 'not-a-date' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('trims the category before saving', async () => {
    repository.createMaintenanceRecord.mockResolvedValue({
      id: 1,
      userId: 1,
      userBikeId: 10,
      odometerReading: 5000,
      category: 'ENGINE_OIL',
      description: null,
      partsCost: 0,
      laborCost: 0,
      partsBrand: null,
      serviceDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await useCase.execute(1, { ...base, category: ' ENGINE_OIL ' });

    expect(repository.createMaintenanceRecord).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'ENGINE_OIL' }),
    );
  });
});
