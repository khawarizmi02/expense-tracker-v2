# Payday-aligned single global Cycle

Budgets in Kira run on **one global Cycle** anchored to a user-chosen start day
(their payday), not the calendar month. We chose this over calendar-month
budgeting because a solo budgeter's real spending rhythm follows their paycheck,
and a single shared start day keeps a coherent "this Cycle" total (per-category
cycles were rejected for the same reason). The cost is that every period, dashboard,
and forecast calculation must derive Cycle boundaries from the start day rather
than assume the 1st; start days of 29–31 clamp back to a short month's last day.

## Considered Options

- **Calendar month** — simplest math, but doesn't match how people paid mid-month
  actually budget.
- **Per-category cycles** — maximum flexibility, but destroys the "total spent this
  Cycle" number and burdens onboarding.
- **Payday-aligned single global Cycle** — chosen.
