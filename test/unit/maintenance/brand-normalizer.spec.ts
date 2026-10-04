import {
  KNOWN_BRAND_NAMES,
  normalizeBrand,
} from '../../../src/modules/maintenance/domain/services/brand-normalizer';

describe('normalizeBrand', () => {
  it('treats blank input as no brand', () => {
    expect(normalizeBrand(undefined)).toBeNull();
    expect(normalizeBrand(null)).toBeNull();
    expect(normalizeBrand('')).toBeNull();
    expect(normalizeBrand('   ')).toBeNull();
  });

  it('folds case and spacing onto the canonical brand', () => {
    expect(normalizeBrand('motul')).toBe('Motul');
    expect(normalizeBrand('  MOTUL  ')).toBe('Motul');
    expect(normalizeBrand('liqui  moly')).toBe('Liqui Moly');
    expect(normalizeBrand('Liqui-Moly')).toBe('Liqui Moly');
  });

  it('resolves aliases to the canonical name', () => {
    expect(normalizeBrand('shell')).toBe('Shell Advance');
    expect(normalizeBrand('Yamaha')).toBe('Yamalube');
    expect(normalizeBrand('TotalEnergies')).toBe('Total');
  });

  it('resolves a product line to its brand', () => {
    expect(normalizeBrand('Motul 7100')).toBe('Motul');
    expect(normalizeBrand('Castrol Power1')).toBe('Castrol');
  });

  it('does not match short names as a prefix', () => {
    expect(normalizeBrand('Rkxyz Parts')).toBe('Rkxyz Parts');
    expect(normalizeBrand('Dida Works')).toBe('Dida Works');
  });

  it('title-cases unknown all-lowercase brands', () => {
    expect(normalizeBrand('local brand')).toBe('Local Brand');
  });

  it('leaves unknown mixed or upper case brands as typed', () => {
    expect(normalizeBrand('ZXR')).toBe('ZXR');
    expect(normalizeBrand('SuperGrip')).toBe('SuperGrip');
  });

  it('collapses internal whitespace of an unknown brand', () => {
    expect(normalizeBrand('Super   Grip')).toBe('Super Grip');
  });

  it('is idempotent', () => {
    for (const raw of ['motul 7100', 'local brand', 'NGK', 'shell']) {
      const once = normalizeBrand(raw);
      expect(normalizeBrand(once)).toBe(once);
    }
  });

  it('every canonical name normalizes to itself', () => {
    for (const name of KNOWN_BRAND_NAMES) {
      expect(normalizeBrand(name)).toBe(name);
    }
  });
});
