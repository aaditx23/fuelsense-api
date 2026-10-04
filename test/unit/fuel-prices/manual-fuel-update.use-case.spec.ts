import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ManualFuelUpdateUseCase } from '../../../src/modules/fuel-prices/application/use-cases/manual-fuel-update.use-case';
import { FuelPriceScraperService } from '../../../src/modules/fuel-prices/application/services/fuel-price-scraper.service';
import type {
  FuelPriceDetail,
  FuelPriceEntity,
} from '../../../src/modules/fuel-prices/domain/entities/fuel-price.entity';
import { PRICE_ALERT_NOTIFIER } from '../../../src/modules/fuel-prices/domain/services/price-alert-notifier';
import { FUEL_PRICE_REPOSITORY } from '../../../src/modules/fuel-prices/domain/repositories/fuel-price.repository';
import type { FuelPriceRepository } from '../../../src/modules/fuel-prices/domain/repositories/fuel-price.repository';

const HOUR_MS = 60 * 60 * 1000;

const detail = (price: number, updatedAt = new Date()): FuelPriceDetail => ({
  price,
  updatedAt,
  effectiveFrom: new Date('2026-06-01'),
  createdAt: updatedAt,
});

const entity = (
  prices: { diesel: number; petrol: number; octane: number },
  updatedAt = new Date(),
): FuelPriceEntity => ({
  diesel: detail(prices.diesel, updatedAt),
  petrol: detail(prices.petrol, updatedAt),
  octane: detail(prices.octane, updatedAt),
});

const scraped = (prices: { diesel: number; petrol: number; octane: number }) => ({
  diesel: { price: prices.diesel, effectiveDate: new Date('2026-06-01') },
  petrol: { price: prices.petrol, effectiveDate: new Date('2026-06-01') },
  octane: { price: prices.octane, effectiveDate: new Date('2026-06-01') },
});

describe('ManualFuelUpdateUseCase', () => {
  let useCase: ManualFuelUpdateUseCase;

  const repositoryMock: jest.Mocked<FuelPriceRepository> = {
    findLatest: jest.fn(),
    findAll: jest.fn(),
    findHistory: jest.fn(),
    getSummary: jest.fn(),
    saveIfChanged: jest.fn(),
  };

  const scraperMock = {
    scrape: jest.fn(),
  };

  const notifierMock = {
    notify: jest.fn(),
    sendTest: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

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
        {
          provide: PRICE_ALERT_NOTIFIER,
          useValue: notifierMock,
        },
      ],
    }).compile();

    useCase = module.get<ManualFuelUpdateUseCase>(ManualFuelUpdateUseCase);
  });

  it('throws when scraper cannot extract any price', async () => {
    repositoryMock.findLatest.mockResolvedValue(null);
    scraperMock.scrape.mockResolvedValue({
      diesel: { price: null, effectiveDate: null },
      petrol: { price: null, effectiveDate: null },
      octane: { price: null, effectiveDate: null },
    });

    await expect(useCase.execute()).rejects.toThrow(BadRequestException);
    expect(repositoryMock.saveIfChanged).not.toHaveBeenCalled();
  });

  it('returns no-change message when repository does not insert', async () => {
    repositoryMock.findLatest.mockResolvedValue(null);
    scraperMock.scrape.mockResolvedValue(
      scraped({ diesel: 114, petrol: 130, octane: 135 }),
    );
    repositoryMock.saveIfChanged.mockResolvedValue({
      inserted: false,
      record: entity({ diesel: 114, petrol: 130, octane: 135 }),
    });

    const result = await useCase.execute();

    expect(result.message).toBe('No fuel price changes detected');
    expect(result.data?.diesel.price).toBe(114);
  });

  it('returns success message when repository inserts new price row', async () => {
    repositoryMock.findLatest.mockResolvedValue(null);
    scraperMock.scrape.mockResolvedValue(
      scraped({ diesel: 115, petrol: 131, octane: 136 }),
    );
    repositoryMock.saveIfChanged.mockResolvedValue({
      inserted: true,
      record: entity({ diesel: 115, petrol: 131, octane: 136 }),
    });

    const result = await useCase.execute();

    expect(result.message).toBe('Fuel price updated successfully');
    expect(result.data?.petrol.price).toBe(131);
  });

  it('skips scraping and returns cached price when updated less than 6 hours ago', async () => {
    repositoryMock.findLatest.mockResolvedValue(
      entity(
        { diesel: 110, petrol: 130, octane: 140 },
        new Date(Date.now() - 2 * HOUR_MS),
      ),
    );

    const result = await useCase.execute();

    expect(result.message).toBe(
      'Fuel price fetched from cache (last updated less than 6 hours ago)',
    );
    expect(result.data?.octane.price).toBe(140);
    expect(scraperMock.scrape).not.toHaveBeenCalled();
  });

  it('proceeds with scraping when last update was more than 6 hours ago', async () => {
    repositoryMock.findLatest.mockResolvedValue(
      entity(
        { diesel: 110, petrol: 130, octane: 140 },
        new Date(Date.now() - 7 * HOUR_MS),
      ),
    );
    scraperMock.scrape.mockResolvedValue(
      scraped({ diesel: 112, petrol: 132, octane: 142 }),
    );
    repositoryMock.saveIfChanged.mockResolvedValue({
      inserted: true,
      record: entity({ diesel: 112, petrol: 132, octane: 142 }),
    });

    const result = await useCase.execute();

    expect(result.message).toBe('Fuel price updated successfully');
    expect(scraperMock.scrape).toHaveBeenCalled();
  });

  describe('price alerts', () => {
    const olderThanCache = () => new Date(Date.now() - 7 * HOUR_MS);

    it('tells the notifier which fuels moved', async () => {
      repositoryMock.findLatest.mockResolvedValue(
        entity({ diesel: 110, petrol: 130, octane: 140 }, olderThanCache()),
      );
      scraperMock.scrape.mockResolvedValue(
        scraped({ diesel: 110, petrol: 133, octane: 140 }),
      );
      repositoryMock.saveIfChanged.mockResolvedValue({
        inserted: true,
        record: entity({ diesel: 110, petrol: 133, octane: 140 }),
      });

      await useCase.execute();

      expect(notifierMock.notify).toHaveBeenCalledWith([
        { fuelType: 'PETROL', oldPrice: 130, newPrice: 133 },
      ]);
    });

    it('notifies nothing when no price moved', async () => {
      repositoryMock.findLatest.mockResolvedValue(
        entity({ diesel: 110, petrol: 130, octane: 140 }, olderThanCache()),
      );
      scraperMock.scrape.mockResolvedValue(
        scraped({ diesel: 110, petrol: 130, octane: 140 }),
      );
      repositoryMock.saveIfChanged.mockResolvedValue({
        inserted: false,
        record: entity({ diesel: 110, petrol: 130, octane: 140 }),
      });

      await useCase.execute();

      expect(notifierMock.notify).toHaveBeenCalledWith([]);
    });

    it('does not notify on the very first price ever stored', async () => {
      repositoryMock.findLatest.mockResolvedValue(null);
      scraperMock.scrape.mockResolvedValue(
        scraped({ diesel: 110, petrol: 130, octane: 140 }),
      );
      repositoryMock.saveIfChanged.mockResolvedValue({
        inserted: true,
        record: entity({ diesel: 110, petrol: 130, octane: 140 }),
      });

      await useCase.execute();

      expect(notifierMock.notify).toHaveBeenCalledWith([]);
    });

    it('does not notify when serving the cached price', async () => {
      repositoryMock.findLatest.mockResolvedValue(
        entity({ diesel: 110, petrol: 130, octane: 140 }),
      );

      await useCase.execute();

      expect(notifierMock.notify).not.toHaveBeenCalled();
    });
  });
});
