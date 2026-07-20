import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as https from 'https';

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
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    });

    let html = response.data;
    const $ = cheerio.load(html);
    const renderer = $('rt-renderer');

    if (renderer.length > 0) {
      const base64Content = renderer.attr('encoded-content');
      if (base64Content) {
        html = Buffer.from(base64Content, 'base64').toString('utf8');
      }
    }

    const $content = cheerio.load(html);
    const rows = $content('tr').toArray();

    let diesel: number | null = null;
    let petrol: number | null = null;
    let octane: number | null = null;

    for (const row of rows) {
      const text = $content(row).text().replace(/\s+/g, ' ').trim();
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

  private convertBengaliToEnglish(text: string): string {
    return text.replace(/[০-৯]/g, (d) => {
      const mapping: Record<string, string> = {
        '০': '0',
        '১': '1',
        '২': '2',
        '৩': '3',
        '৪': '4',
        '৫': '5',
        '৬': '6',
        '৭': '7',
        '৮': '8',
        '৯': '9',
      };
      return mapping[d] || d;
    });
  }

  private extractPrice(text: string): number | null {
    const englishText = this.convertBengaliToEnglish(text);
    const normalized = englishText
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
