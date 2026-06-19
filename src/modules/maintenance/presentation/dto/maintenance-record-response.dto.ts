import { MaintenanceRecordEntity } from '../../domain/entities/maintenance-record.entity';

export class MaintenanceRecordResponseDto {
  id!: number;
  userId!: number;
  userBikeId!: number;
  odometerReading!: number;
  category!: string;
  description!: string | null;
  partsCost!: number;
  laborCost!: number;
  partsBrand!: string | null;
  serviceDate!: Date;
  createdAt!: Date;
  updatedAt!: Date;

  static fromEntity(entity: MaintenanceRecordEntity): MaintenanceRecordResponseDto {
    return {
      id: entity.id,
      userId: entity.userId,
      userBikeId: entity.userBikeId,
      odometerReading: entity.odometerReading,
      category: entity.category,
      description: entity.description,
      partsCost: entity.partsCost,
      laborCost: entity.laborCost,
      partsBrand: entity.partsBrand,
      serviceDate: entity.serviceDate,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
