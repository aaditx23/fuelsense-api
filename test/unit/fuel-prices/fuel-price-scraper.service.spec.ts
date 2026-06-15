import { Test, TestingModule } from '@nestjs/testing';
import { FuelPriceScraperService } from '../../../src/modules/fuel-prices/application/services/fuel-price-scraper.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('FuelPriceScraperService', () => {
  let service: FuelPriceScraperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FuelPriceScraperService],
    }).compile();

    service = module.get<FuelPriceScraperService>(FuelPriceScraperService);
  });

  it('scrapes and parses Bengali digits correctly from table rows', async () => {
    const mockHtml = `
      <table>
        <tr><td>১</td><td>ডিজেল</td><td>১১৫.০০ (টাকা/লিটার)</td><td>০১/০৬/২০২৬</td></tr>
        <tr><td>২</td><td>কেরোসিন</td><td>১৩৫.০০ (টাকা/লিটার)</td><td>০১/০৬/২০২৬</td></tr>
        <tr><td>৩</td><td>অকটেন</td><td>১৪৫.০০ (টাকা/লিটার)</td><td>০১/০৬/২০২৬</td></tr>
        <tr><td>৪</td><td>পেট্রোল</td><td>১৪০.০০ (টাকা/লিটার)</td><td>০১/০৬/২০২৬</td></tr>
      </table>
    `;

    mockedAxios.get.mockResolvedValue({ data: mockHtml });

    const result = await service.scrape();

    expect(result).toEqual({
      diesel: 115,
      petrol: 140,
      octane: 145,
    });
  });
});
