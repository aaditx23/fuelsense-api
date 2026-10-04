/**
 * Part brands are typed by riders, so "motul", "MOTUL " and "Motul 7100" would
 * count as three brands. This maps what was typed onto one canonical name so
 * community brand statistics group correctly.
 */

/** Canonical name first, then the other spellings riders use for it. */
const KNOWN_BRANDS: ReadonlyArray<readonly [string, ...string[]]> = [
  ['Motul'],
  ['Castrol'],
  ['Shell Advance', 'Shell', 'Advance'],
  ['Total', 'TotalEnergies', 'Total Energies'],
  ['Liqui Moly', 'LiquiMoly'],
  ['Mobil', 'Mobil 1'],
  ['Yamalube', 'Yamaha Genuine', 'Yamaha'],
  ['Honda Genuine', 'Honda', 'Honda Original'],
  ['Suzuki Ecstar', 'Ecstar', 'Suzuki Genuine', 'Suzuki'],
  ['Bajaj Genuine', 'Bajaj'],
  ['TVS Genuine', 'TVS'],
  ['Hero Genuine', 'Hero'],
  ['Gulf'],
  ['Repsol'],
  ['Valvoline'],
  ['Petronas'],
  ['Idemitsu'],
  ['Veedol'],
  ['Bosch'],
  ['NGK'],
  ['Denso'],
  ['Champion'],
  ['Brembo'],
  ['Ferodo'],
  ['EBC'],
  ['Michelin'],
  ['MRF'],
  ['CEAT', 'Ceat'],
  ['Apollo'],
  ['Pirelli'],
  ['Metzeler'],
  ['Dunlop'],
  ['Bridgestone'],
  ['K&N', 'KN'],
  ['DID'],
  ['RK'],
  ['Regina'],
  ['Exide'],
  ['Yuasa'],
  ['Amaron'],
  ['Rahimafrooz'],
  ['Philips'],
  ['Osram'],
  ['Hella'],
];

/** Lower-case letters and digits only, so spacing and punctuation never split a brand. */
const keyOf = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, '');

const EXACT = new Map<string, string>();
for (const [canonical, ...aliases] of KNOWN_BRANDS) {
  for (const spelling of [canonical, ...aliases]) {
    EXACT.set(keyOf(spelling), canonical);
  }
}

/** A canonical name this long is distinctive enough to match as a prefix. */
const MIN_PREFIX_KEY_LENGTH = 4;

const PREFIX_CANDIDATES = KNOWN_BRANDS.map(([canonical]) => ({
  canonical,
  key: keyOf(canonical),
})).filter((brand) => brand.key.length >= MIN_PREFIX_KEY_LENGTH);

const titleCase = (value: string): string =>
  value.replace(/\b[a-z]/g, (letter) => letter.toUpperCase());

/**
 * The canonical brand for [raw], or `null` when there is none.
 *
 * - Known brands (and their aliases) become their canonical name; a product
 *   line such as "Motul 7100" also resolves to the brand.
 * - Anything else keeps the rider's spelling with whitespace collapsed, except
 *   all-lowercase text, which is title-cased. Mixed or upper case is left alone
 *   so "NGK" or "K&N" are never mangled.
 */
export function normalizeBrand(raw: string | null | undefined): string | null {
  const collapsed = (raw ?? '').replace(/\s+/g, ' ').trim();
  if (!collapsed) {
    return null;
  }

  const key = keyOf(collapsed);
  const exact = EXACT.get(key);
  if (exact) {
    return exact;
  }
  const prefixed = PREFIX_CANDIDATES.find((brand) => key.startsWith(brand.key));
  if (prefixed) {
    return prefixed.canonical;
  }

  return collapsed === collapsed.toLowerCase() ? titleCase(collapsed) : collapsed;
}

/** Every canonical brand name, for autocomplete. */
export const KNOWN_BRAND_NAMES: readonly string[] = KNOWN_BRANDS.map(
  ([canonical]) => canonical,
);
