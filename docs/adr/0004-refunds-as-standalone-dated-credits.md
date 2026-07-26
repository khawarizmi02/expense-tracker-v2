# Refunds are standalone dated credits in their own Cycle

A Refund is its **own dated record** that credits a category in the Cycle in which the
money actually came back — it does not reach back to edit or cancel the original
Expense, and it does not link to it. We chose this because it matches real cash flow
(the money returned in February, so February reflects it) and it survives the common
case where the original purchase's Cycle is already closed or forgotten. The
surprising consequence a future reader must know: **a category's spend in a Cycle can
go negative** when refunds exceed that Cycle's purchases. We accepted that over the
alternative of retroactively editing a past Expense, which gets messy for partial
refunds and rewrites historical Cycles.

## Considered Options

- **Reach back and cancel/reduce the original Expense** — cleaner per-Cycle numbers,
  but edits closed history and handles partial refunds poorly.
- **Standalone dated credit in its own Cycle** — chosen; can push a Cycle negative.
