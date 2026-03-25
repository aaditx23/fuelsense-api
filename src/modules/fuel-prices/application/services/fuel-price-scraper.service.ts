import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

export type ScrapedFuelPrice = {
  diesel: number | null;
  petrol: number | null;
  octane: number | null;
};

@Injectable()
export class FuelPriceScraperService {
  private readonly targetUrl =
    'https://bpc.gov.bd/pages/static-pages/6922ddb6933eb65569e15fbc';

  async scrape(): Promise<ScrapedFuelPrice> {
    const response = await axios.get(this.targetUrl, {
      timeout: 15000,
      validateStatus: (status) => status >= 200 && status < 400,
    });

    const $ = cheerio.load(response.data);
    const rows = $('tr').toArray();

    let diesel: number | null = null;
    let petrol: number | null = null;
    let octane: number | null = null;

    for (const row of rows) {
      const text = $(row).text().replace(/\s+/g, ' ').trim();
      if (!text) {
        continue;
      }

      if (diesel == null && /hsd|diesel|ডিজেল/i.test(text)) {
        diesel = this.extractPrice(text);
      }

      if (petrol == null && /ms|petrol|পেট্রোল/i.test(text)) {
        petrol = this.extractPrice(text);
      }

      if (octane == null && /hobc|octane|অকটেন/i.test(text)) {
        octane = this.extractPrice(text);
      }
    }

    return {
      diesel,
      petrol,
      octane,
    };
  }

  private extractPrice(text: string): number | null {
    const normalized = text
      .replace(/\(tk\/?lit(re|er)?\)/gi, ' ')
      .replace(/tk|৳|টাকা|লিটার/gi, ' ');

    const candidates = normalized.match(/\d+(?:\.\d+)?/g) ?? [];

    for (const raw of candidates) {
      const value = Number(raw);
      if (Number.isFinite(value) && value >= 50 && value <= 200) {
        return value;
      }
    }

    return null;
  }
}
