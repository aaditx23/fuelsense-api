import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ManualFuelUpdateUseCase } from '../../../src/modules/fuel-prices/application/use-cases/manual-fuel-update.use-case';
import { FuelPriceScraperService } from '../../../src/modules/fuel-prices/application/services/fuel-price-scraper.service';
import { FUEL_PRICE_REPOSITORY } from '../../../src/modules/fuel-prices/domain/repositories/fuel-price.repository';
import type { FuelPriceRepository } from '../../../src/modules/fuel-prices/domain/repositories/fuel-price.repository';

describe('ManualFuelUpdateUseCase', () => {
  let useCase: ManualFuelUpdateUseCase;

  const repositoryMock: jest.Mocked<FuelPriceRepository> = {
    findLatest: jest.fn(),
    findAll: jest.fn(),
    getSummary: jest.fn(),
    saveIfChanged: jest.fn(),
  };

  const scraperMock = {
    scrape: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ManualFuelUpdateUseCase,
        {
          provide: FUEL_PRICE_REPOSITORY,
          useValue: repositoryMock,
        },
        {
          provide: FuelPriceScraperService,
          useValue: scraperMock,
        },
      ],
    }).compile();

    useCase = module.get<ManualFuelUpdateUseCase>(ManualFuelUpdateUseCase);
  });

  it('throws when scraper cannot extract any price', async () => {
    scraperMock.scrape.mockResolvedValue({
      diesel: null,
      petrol: null,
      octane: null,
    });

    await expect(useCase.execute()).rejects.toThrow(BadRequestException);
    expect(repositoryMock.saveIfChanged).not.toHaveBeenCalled();
  });

  it('returns no-change message when repository does not insert', async () => {
    scraperMock.scrape.mockResolvedValue({
      diesel: 114,
      petrol: 130,
      octane: 135,
    });

    repositoryMock.saveIfChanged.mockResolvedValue({
      inserted: false,
      record: {
        id: 1,
        date: new Date(),
        diesel: 114,
        petrol: 130,
        octane: 135,
        createdAt: new Date(),
      },
    });

    const result = await useCase.execute();

    expect(result.message).toBe('No fuel price changes detected');
    expect(result.data?.diesel).toBe(114);
  });

  it('returns success message when repository inserts new price row', async () => {
    scraperMock.scrape.mockResolvedValue({
      diesel: 115,
      petrol: 131,
      octane: 136,
    });

    repositoryMock.saveIfChanged.mockResolvedValue({
      inserted: true,
      record: {
        id: 2,
        date: new Date(),
        diesel: 115,
        petrol: 131,
        octane: 136,
        createdAt: new Date(),
      },
    });

    const result = await useCase.execute();

    expect(result.message).toBe('Fuel price updated successfully');
    expect(result.data?.petrol).toBe(131);
  });
});
