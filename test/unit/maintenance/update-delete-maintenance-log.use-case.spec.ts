import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DeleteMaintenanceLogUseCase } from '../../../src/modules/maintenance/application/use-cases/delete-maintenance-log.use-case';
import { UpdateMaintenanceLogUseCase } from '../../../src/modules/maintenance/application/use-cases/update-maintenance-log.use-case';
import { MAINTENANCE_REPOSITORY } from '../../../src/modules/maintenance/domain/repositories/maintenance.repository';
import type { MaintenanceRepository } from '../../../src/modules/maintenance/domain/repositories/maintenance.repository';

const record = {
  id: 7,
  userId: 1,
  userBikeId: 10,
  odometerReading: 5000,
  category: 'ENGINE_OIL',
  description: 'old note',
  partsCost: 500,
  laborCost: 100,
  partsBrand: 'Motul',
  serviceDate: new Date('2026-06-19T00:00:00.000Z'),
  createdAt: new Date('2026-06-19T00:00:00.000Z'),
  updatedAt: new Date('2026-06-19T00:00:00.000Z'),
};

describe('Update/Delete maintenance log use cases', () => {
  let update: UpdateMaintenanceLogUseCase;
  let remove: DeleteMaintenanceLogUseCase;

  const repositoryMock: jest.Mocked<MaintenanceRepository> = {
    isUserBikeOwnedByUser: jest.fn(),
    createMaintenanceRecord: jest.fn(),
    findOwnedRecord: jest.fn(),
    updateMaintenanceRecord: jest.fn(),
    deleteMaintenanceRecord: jest.fn(),
    getUserMaintenanceLogs: jest.fn(),
    getBikeModelMaintenanceLogs: jest.fn(),
    getBikeModelUserBikes: jest.fn(),
    getBikeModelMileageTotals: jest.fn(),
    getRegisteredParts: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateMaintenanceLogUseCase,
        DeleteMaintenanceLogUseCase,
        { provide: MAINTENANCE_REPOSITORY, useValue: repositoryMock },
      ],
    }).compile();

    update = module.get(UpdateMaintenanceLogUseCase);
    remove = module.get(DeleteMaintenanceLogUseCase);
  });

  describe('update', () => {
    it('updates only the provided fields of an owned record', async () => {
      repositoryMock.findOwnedRecord.mockResolvedValue(record);
      repositoryMock.updateMaintenanceRecord.mockResolvedValue({
        ...record,
        partsCost: 650,
      });

      const result = await update.execute(1, 7, { partsCost: 650 });

      expect(repositoryMock.updateMaintenanceRecord).toHaveBeenCalledWith(7, {
        odometerReading: undefined,
        category: undefined,
        description: undefined,
        partsCost: 650,
        laborCost: undefined,
        partsBrand: undefined,
        serviceDate: undefined,
      });
      expect(result.data?.partsCost).toBe(650);
    });

    it('passes null through so optional fields can be cleared', async () => {
      repositoryMock.findOwnedRecord.mockResolvedValue(record);
      repositoryMock.updateMaintenanceRecord.mockResolvedValue({
        ...record,
        description: null,
        partsBrand: null,
      });

      await update.execute(1, 7, { description: null, partsBrand: null });

      expect(repositoryMock.updateMaintenanceRecord).toHaveBeenCalledWith(
        7,
        expect.objectContaining({ description: null, partsBrand: null }),
      );
    });

    it('parses serviceDate into a Date', async () => {
      repositoryMock.findOwnedRecord.mockResolvedValue(record);
      repositoryMock.updateMaintenanceRecord.mockResolvedValue(record);

      await update.execute(1, 7, { serviceDate: '2026-07-01T00:00:00.000Z' });

      expect(repositoryMock.updateMaintenanceRecord).toHaveBeenCalledWith(
        7,
        expect.objectContaining({ serviceDate: new Date('2026-07-01T00:00:00.000Z') }),
      );
    });

    it('rejects an empty update', async () => {
      await expect(update.execute(1, 7, {})).rejects.toThrow(BadRequestException);
      expect(repositoryMock.findOwnedRecord).not.toHaveBeenCalled();
    });

    it('rejects an invalid serviceDate', async () => {
      await expect(
        update.execute(1, 7, { serviceDate: 'not-a-date' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('returns not found for a record the user does not own', async () => {
      repositoryMock.findOwnedRecord.mockResolvedValue(null);

      await expect(update.execute(1, 7, { partsCost: 1 })).rejects.toThrow(
        NotFoundException,
      );
      expect(repositoryMock.updateMaintenanceRecord).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('deletes an owned record', async () => {
      repositoryMock.findOwnedRecord.mockResolvedValue(record);

      const result = await remove.execute(1, 7);

      expect(repositoryMock.deleteMaintenanceRecord).toHaveBeenCalledWith(7);
      expect(result.success).toBe(true);
    });

    it('returns not found and deletes nothing for a record the user does not own', async () => {
      repositoryMock.findOwnedRecord.mockResolvedValue(null);

      await expect(remove.execute(1, 7)).rejects.toThrow(NotFoundException);
      expect(repositoryMock.deleteMaintenanceRecord).not.toHaveBeenCalled();
    });
  });

  describe('brand normalization', () => {
    beforeEach(() => {
      repositoryMock.findOwnedRecord.mockResolvedValue(record);
      repositoryMock.updateMaintenanceRecord.mockResolvedValue(record);
    });

    it('stores the canonical brand', async () => {
      await update.execute(1, 7, { partsBrand: 'castrol' });

      expect(repositoryMock.updateMaintenanceRecord).toHaveBeenCalledWith(
        7,
        expect.objectContaining({ partsBrand: 'Castrol' }),
      );
    });

    it('leaves the brand alone when it is not part of the update', async () => {
      await update.execute(1, 7, { odometerReading: 5100 });

      const input = repositoryMock.updateMaintenanceRecord.mock.calls[0][1];
      expect(input.partsBrand).toBeUndefined();
    });

    it('clears the brand for blank input', async () => {
      await update.execute(1, 7, { partsBrand: '  ' });

      expect(repositoryMock.updateMaintenanceRecord).toHaveBeenCalledWith(
        7,
        expect.objectContaining({ partsBrand: null }),
      );
    });
  });
});
