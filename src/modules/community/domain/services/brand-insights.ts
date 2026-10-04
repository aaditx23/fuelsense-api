import type { MaintenanceRecordRow } from '../repositories/community.repository';

/** A brand needs this many distinct bikes behind it before it is ranked. */
export const MIN_BRAND_RIDERS = 3;

/** ...and this many measured lifespans. */
export const MIN_BRAND_SAMPLES = 5;

export type BrandInsight = {
  brand: string;
  /** Lifespans measured for this brand. */
  sampleCount: number;
  /** Distinct bikes those lifespans came from. */
  riderCount: number;
  /** Average km a part of this brand ran before it was replaced. */
  avgLifespanKm: number;
  /** Average parts plus labor cost of those replacements. */
  avgCost: number;
  /** Cost per 1,000 km of use, or null when no cost was logged. */
  costPer1000Km: number | null;
};

export type CategoryBrandInsights = {
  category: string;
  /** Every brand-tagged lifespan measured in this category, ranked or not. */
  sampleCount: number;
  /** Brands with enough data, best (cheapest per 1,000 km) first. */
  brands: BrandInsight[];
};

type Sample = {
  userBikeId: number;
  brand: string;
  lifespan: number;
  cost: number;
};

const keyOf = (brand: string): string => brand.trim().toLowerCase();

/**
 * How long each brand of each part lasts on this bike model.
 *
 * One lifespan is the distance between a logged replacement and the next
 * replacement of the same part on the same bike; it belongs to the brand
 * fitted at the first of the two. A part still in use has no next replacement,
 * so it is left out rather than counted as a short life.
 */
export function computeBrandInsights(
  rows: MaintenanceRecordRow[],
): CategoryBrandInsights[] {
  const byBikeAndCategory = new Map<string, MaintenanceRecordRow[]>();
  for (const row of rows) {
    const key = `${row.userBikeId}\u0000${row.category}`;
    const group = byBikeAndCategory.get(key) ?? [];
    group.push(row);
    byBikeAndCategory.set(key, group);
  }

  const samplesByCategory = new Map<string, Sample[]>();
  for (const group of byBikeAndCategory.values()) {
    const ordered = [...group].sort(
      (a, b) => a.odometerReading - b.odometerReading,
    );
    for (let i = 0; i < ordered.length - 1; i++) {
      const current = ordered[i];
      const lifespan = ordered[i + 1].odometerReading - current.odometerReading;
      const brand = current.partsBrand?.trim();
      if (lifespan <= 0 || !brand) {
        continue;
      }
      const samples = samplesByCategory.get(current.category) ?? [];
      samples.push({
        userBikeId: current.userBikeId,
        brand,
        lifespan,
        cost: (current.partsCost ?? 0) + (current.laborCost ?? 0),
      });
      samplesByCategory.set(current.category, samples);
    }
  }

  return [...samplesByCategory.entries()]
    .map(([category, samples]) => ({
      category,
      sampleCount: samples.length,
      brands: rankBrands(samples),
    }))
    .sort((a, b) => a.category.localeCompare(b.category));
}

function rankBrands(samples: Sample[]): BrandInsight[] {
  const byBrand = new Map<string, Sample[]>();
  for (const sample of samples) {
    const key = keyOf(sample.brand);
    const group = byBrand.get(key) ?? [];
    group.push(sample);
    byBrand.set(key, group);
  }

  const insights: BrandInsight[] = [];
  for (const group of byBrand.values()) {
    const riderCount = new Set(group.map((s) => s.userBikeId)).size;
    if (group.length < MIN_BRAND_SAMPLES || riderCount < MIN_BRAND_RIDERS) {
      continue;
    }

    const totalLifespan = group.reduce((sum, s) => sum + s.lifespan, 0);
    const totalCost = group.reduce((sum, s) => sum + s.cost, 0);
    insights.push({
      // Samples of one brand differ only in case when unnormalized rows exist;
      // show the spelling used most.
      brand: mostCommon(group.map((s) => s.brand)),
      sampleCount: group.length,
      riderCount,
      avgLifespanKm: Math.round(totalLifespan / group.length),
      avgCost: Math.round(totalCost / group.length),
      costPer1000Km:
        totalCost > 0
          ? Math.round((totalCost / totalLifespan) * 1000 * 100) / 100
          : null,
    });
  }

  return insights.sort((a, b) => {
    if (a.costPer1000Km === null && b.costPer1000Km !== null) return 1;
    if (a.costPer1000Km !== null && b.costPer1000Km === null) return -1;
    if (a.costPer1000Km !== b.costPer1000Km) {
      return (a.costPer1000Km ?? 0) - (b.costPer1000Km ?? 0);
    }

    return b.avgLifespanKm - a.avgLifespanKm;
  });
}

function mostCommon(values: string[]): string {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}
