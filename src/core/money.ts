// Money in Kira is held as whole **minor units** (sen) — integers, never floats,
// so totals can't drift the way 0.1 + 0.2 does. Presentation (the "RM" prefix,
// grouping separators) belongs to the UI; this module only renders the number.

/** Minor units per major unit: 100 sen to the ringgit. */
export const MINOR_UNITS_PER_MAJOR = 100;

/** Render minor units as a fixed two-decimal amount, e.g. `1250` → `"12.50"`. */
export function minorToDecimalString(minor: number): string {
  const sign = minor < 0 ? '-' : '';
  const absolute = Math.abs(minor);
  const major = Math.floor(absolute / MINOR_UNITS_PER_MAJOR);
  const remainder = absolute % MINOR_UNITS_PER_MAJOR;
  return `${sign}${major}.${String(remainder).padStart(2, '0')}`;
}
