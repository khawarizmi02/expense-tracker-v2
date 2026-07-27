# Money is stored as integer minor units

Every amount in Kira — an Expense's `amountMinor`, a day's total, later a Budget
cap — is a **whole number of minor units** (sen), never a decimal ringgit float.
`RM 12.50` is `1250`. Formatting back to `"RM 12.50"` happens at the UI edge
(`src/ui/format.ts`); the core only ever adds integers.

We chose this because the app's core operation is summing money — spent-today,
per-day totals, per-Cycle category totals, budget percentages — and binary
floats can't represent most decimal amounts exactly. Accumulating them drifts
(`0.1 + 0.2 !== 0.3`), and a budgeting app that shows a total a sen off its
parts loses the user's trust in a way no other bug does.

A future reader will notice that `amountMinor` looks awkward at call sites and
that the keypad has to accumulate digits rather than parse a decimal string.
That awkwardness is the point: the type never lets a fractional amount into the
domain in the first place — `addExpense` rejects a non-integer outright.

## Considered options

- **Floating-point ringgit** — reads naturally in code, but drifts under
  summation and needs rounding discipline at every arithmetic site.
- **A decimal library** — exact, but pulls a dependency into the otherwise
  dependency-free `core` for a currency with exactly two decimal places.
- **Integer minor units — chosen.** Exact, dependency-free, and the validation
  lives in one place.

## Consequences

- The core never rounds; only presentation formats.
- v1 is ringgit-only (`MINOR_UNITS_PER_MAJOR = 100`). A currency with a
  different exponent would need that constant to travel with the amount.
- Refunds (T10) can make a *total* negative, but an individual Expense amount is
  always positive — see ADR-0004.
