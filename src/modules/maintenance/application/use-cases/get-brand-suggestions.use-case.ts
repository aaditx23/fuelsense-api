import { Inject, Injectable } from '@nestjs/common';
import { ok, UnifiedResponse } from '../../../../common/api/unified-response';
import { MAINTENANCE_REPOSITORY } from '../../domain/repositories/maintenance.repository';
import type { MaintenanceRepository } from '../../domain/repositories/maintenance.repository';
import {
  KNOWN_BRAND_NAMES,
  normalizeBrand,
} from '../../domain/services/brand-normalizer';

/** Most brands returned; the list feeds an autocomplete, not a catalog. */
const MAX_USED_BRANDS = 100;

@Injectable()
export class GetBrandSuggestionsUseCase {
  constructor(
    @Inject(MAINTENANCE_REPOSITORY)
    private readonly maintenanceRepository: MaintenanceRepository,
  ) {}

  async execute(): Promise<UnifiedResponse<string>> {
    const used = await this.maintenanceRepository.getUsedBrands(MAX_USED_BRANDS);

    // Known brands first, then what riders use. Old rows may still hold an
    // unnormalized spelling, so fold them to the canonical name and drop repeats.
    const names = new Map<string, string>();
    for (const name of [...KNOWN_BRAND_NAMES, ...used]) {
      const canonical = normalizeBrand(name);
      if (canonical && !names.has(canonical.toLowerCase())) {
        names.set(canonical.toLowerCase(), canonical);
      }
    }

    return ok({
      message: 'Brand suggestions fetched successfully',
      listData: [...names.values()].sort((a, b) => a.localeCompare(b)),
    });
  }
}
