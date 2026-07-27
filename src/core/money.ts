// Money in Kira is held as whole **minor units** (sen) — integers, never floats,
// so totals can't drift the way 0.1 + 0.2 does (see ADR-0006). Rendering an
// amount for a human belongs to the UI edge, not here.

/** Minor units per major unit: 100 sen to the ringgit. */
export const MINOR_UNITS_PER_MAJOR = 100;
