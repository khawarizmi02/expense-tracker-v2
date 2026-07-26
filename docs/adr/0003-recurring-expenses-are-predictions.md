# Recurring expenses are predictions, never auto-created ledger entries

A recurring expense (detected or user-declared) is a **prediction**, not a ledger
entry. On the expected date Kira prompts "≈$X due — log it?"; ignoring the prompt
logs nothing, and confirming creates an ordinary Expense. We deliberately rejected
auto-creating the Expense each Cycle. Because Kira has **no bank sync** to reconcile
against, an auto-created charge for a cancelled subscription would silently corrupt
budgets, forecasts, and streaks with spend that never happened — so the ledger only
ever contains user-confirmed spend. A future reader may expect auto-generation "for
convenience"; the truthfulness of the ledger is why we don't.

## Consequences

- Detected recurrences auto-expire after ~2 consecutive unconfirmed cycles; declared
  ones persist until removed.
- An ignored recurring prompt does **not** close a day for Streak purposes.
