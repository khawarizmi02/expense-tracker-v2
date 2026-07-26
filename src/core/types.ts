// Core domain types for Kira.
//
// The `core` module is pure and framework-agnostic (see ADR-0005 and CONTEXT.md):
// no I/O, no framework imports, no clock or randomness of its own. Callers pass
// in the data and any needed effects (id generation, a reference "now").

/**
 * A user-defined bucket that Expenses count against and Budgets are set on.
 * See CONTEXT.md § Category.
 *
 * `archived` implements the "delete = archive, never destroy" rule: an archived
 * category is hidden from new-expense entry and the current dashboard, but its
 * historical Expenses keep pointing at it so past Cycles stay accurate.
 */
export interface Category {
  readonly id: string;
  readonly name: string;
  /** Icon identifier (e.g. an icon-set name); interpreted by the UI adapter. */
  readonly icon: string;
  /** Color token or hex; interpreted by the UI adapter. */
  readonly color: string;
  /** Archived categories are excluded from active views but remain resolvable. */
  readonly archived: boolean;
  /** Origin: `true` for the seeded default set, `false` for user-created. */
  readonly seeded: boolean;
}

/** A factory for unique ids, injected so the core stays free of randomness. */
export type IdFactory = () => string;
