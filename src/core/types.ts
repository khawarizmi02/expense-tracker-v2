// Core domain types for Kira.
//
// The `core` module is pure and framework-agnostic (see ADR-0005 and CONTEXT.md):
// no I/O, no framework imports, no clock or randomness of its own. Callers pass
// in the data and any needed effects (id generation, a reference "now").

import type { LocalDay } from './day';

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

/**
 * How an Expense entered Kira. See CONTEXT.md § Capture source.
 *
 * v1 logs `manual` only; `ocr` (T9) and `recurring-confirmed` (T12) arrive with
 * their own capture flows.
 */
export type CaptureSource = 'manual' | 'ocr' | 'recurring-confirmed';

/**
 * A record of money going **out** — always single-signed. The central entity of
 * the app. See CONTEXT.md § Expense.
 *
 * Money coming back is never a negative Expense: a Refund is its own dated
 * record (see ADR-0004).
 */
export interface Expense {
  readonly id: string;
  /** Amount spent in whole minor units (sen); always greater than zero. */
  readonly amountMinor: number;
  /** The Category this counts against. */
  readonly categoryId: string;
  /** Who the money was paid to; empty when the user didn't say. */
  readonly merchant: string;
  /** Free-text note; empty when the user didn't add one. */
  readonly note: string;
  /** The device-local calendar day the spending happened on. */
  readonly day: LocalDay;
  readonly source: CaptureSource;
}

/** What a caller supplies to log an Expense; the core fills in id and defaults. */
export interface ExpenseInput {
  readonly amountMinor: number;
  readonly categoryId: string;
  readonly day: LocalDay;
  readonly merchant?: string;
  readonly note?: string;
  /** Defaults to `manual`. */
  readonly source?: CaptureSource;
}

/** A factory for unique ids, injected so the core stays free of randomness. */
export type IdFactory = () => string;
