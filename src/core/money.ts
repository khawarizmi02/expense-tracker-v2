// Money in Kira is held as whole **minor units** (sen) — integers, never floats,
// so totals can't drift the way 0.1 + 0.2 does (see ADR-0006). Rendering an
// amount for a human belongs to the UI edge, not here.

/** Minor units per major unit: 100 sen to the ringgit. */
export const MINOR_UNITS_PER_MAJOR = 100;

/**
 * The largest amount any entry surface accepts: RM 99,999.99.
 *
 * A ceiling rather than a validation rule — the keypad and the cap field simply
 * stop registering digits past it, so an absurd amount never has to be rejected
 * after the fact. Shared so an expense and a cap can't disagree on the limit.
 */
export const MAX_AMOUNT_MINOR = 9_999_999;
