# Kira — Domain Glossary

Kira is a mobile-first, solo personal expense tracker. This file is the
canonical glossary of domain terms. It is not a spec — it holds meaning, not
implementation.

## Expense

A record of money going **out** — always single-signed (money spent, never
money earned). The central entity of the app. Kira does **not** track income,
paychecks, deposits, or account balances.

Key attributes (meaning only): the amount spent, what category it counts
against, the merchant, when it happened, and how it was captured (see *Capture
source*).

## Merchant

Who the money was paid to (free-text, e.g. "Starbucks"). Drives both
auto-categorization and recurring detection via merchant matching.

## Capture source

How an Expense entered Kira: **manual** (typed), **OCR** (extracted from a
photographed receipt, then user-confirmed), or **recurring-confirmed** (created
by confirming a recurring-expense prompt). Refunds are logged manually.

## Categorization rule

A merchant → category mapping used to guess an Expense's category at capture.
Rules have two origins: **seeded** (Kira ships common ones, e.g. Starbucks →
Dining) and **user-taught**. Recategorizing an Expense teaches/updates the rule
for that merchant, and a user-taught rule **overrides** the seed. Corrections
compound into a personal ruleset — this is Kira's "learning" in v1 (no ML).

## Refund

A correction that returns money previously spent, reducing recorded spend in a
category. A refund is **not** income — it is money-back, not money-earned.

A refund is its **own dated record**, dated when the money came back (not when
the original purchase happened). It credits the category in **its own month**:
January's spend is untouched, and the refund reduces February's spend — which
can push a category's monthly total negative. Kira does not reach back and edit
the original Expense.

A refund is a **standalone category credit** — amount, category, date, note. It
does not point at the Expense it undoes; Kira does not track "was this purchase
ever refunded?"

## Cycle

The recurring budget window. There is **one global Cycle** for the whole app,
anchored to a user-chosen start day (their payday). Every category's budget
resets together at the start of each Cycle. The dashboard shows one current
Cycle and one "days remaining." Kira is *not* pinned to the calendar month —
a Cycle can run, e.g., the 25th → 24th.

Start days that don't exist in a short month **clamp back to that month's last
day** (start day 31 → Feb 28/29, Apr 30, …). The user may pick any day 1–31.

## Budget (cap)

A per-category spending limit for one Cycle. Kira uses a **simple cap**, not
envelope budgeting: at each new Cycle the cap resets to its full amount.
Leftover money does **not** roll forward and overspend does **not** carry over
— every Cycle is independent ("this Cycle I have $200 for Dining").

A Budget is **optional** per category. A category may be *capped* (has a Budget
— shows a progress bar, over-budget alerts, and a forecast limit) or
*tracked-only* (no Budget — collects Expenses and shows a total, but no cap,
bar, or alert).

## Category

A user-defined bucket that Expenses count against and Budgets are set on.
Onboarding seeds a default set (Groceries, Dining, Transport, Bills,
Entertainment, Shopping, Other), but the user can add, rename, re-icon, and
remove categories freely.

Removing a category **archives** it rather than destroying it: it disappears
from new-expense entry and the current dashboard, but its historical Expenses
keep pointing at it so past Cycles stay accurate. "Delete" in the UI means
*archive*, never *rewrite history*.

## Streak

A run of consecutive days on which the user **closed the day**. The habit Kira
rewards is *engaging daily*, not *spending daily*. A day is closed by either
logging at least one Expense **or** marking a No-Spend Day. This deliberately
avoids punishing frugality — a day with no spending still counts.

The streak is **strict** (no free grace days) but **self-healing**: it is
derived from which days are closed, not a counter that only moves forward.
Adding an Expense dated to a past day — or marking that past day no-spend —
retroactively closes it and can stitch a broken streak back together. Honest
backfilling is rewarded; forgetting is not silently excused.

## Day

The unit streaks are counted in: the **device-local calendar day**, with the
boundary at local midnight. "Today" follows the phone's current timezone. Kira
does not use a fixed home timezone or a configurable day-start hour.

## No-Spend Day

An explicit user action recording that they spent nothing that day. It closes
the day for Streak purposes and is itself a positive, celebrated event for a
budgeter (not a gap to be excused).

## Badge

An earned motivational award from a **fixed, curated set** (no user-created
badges). Two kinds: **one-time trophies** (e.g. first Expense logged, first
7-day streak, first No-Spend Day) and **repeatable/tiered** achievements (e.g.
streak milestones at 7/30/100 days; "under every budget this Cycle," re-earned
each qualifying Cycle). Repeatable badges give ongoing reasons to return.

## Recurring expense (subscription)

A predicted, repeating charge (merchant, amount, cadence, next-expected date).
Its **origin** is either *detected* (Kira spots the pattern: same merchant +
similar amount + ~regular cadence) or *declared* (the user says "this is a
subscription").

A recurring expense is a **prediction, not a ledger entry**. On the expected
date Kira prompts "≈$X due — log it?" with one-tap confirm (amount editable).
Ignoring the prompt logs **nothing** — Kira never fabricates spend the user
didn't confirm. Confirming creates an ordinary Expense.

**Detected** recurrences auto-expire after ~2 consecutive expected cycles with
no confirmation (with an easy "still active?" undo); **declared** ones persist
until the user removes them. An ignored/skipped prompt does **not** close the
day for Streak purposes — only a real Expense or a No-Spend Day does.

## Forecast (predictive nudge)

A soft projection of end-of-Cycle spend for a **capped** category, using a
naive linear run-rate (`spent so far ÷ days elapsed × days in Cycle`). It is a
*nudge*, not a prediction engine: it is suppressed for the first few days of a
Cycle so a single early purchase can't trigger a false "you'll be over" alarm,
and it is knowingly rough for lumpy categories.

## Alert

A notification fired when a **capped** category's *actual* spend crosses a
threshold. v1 uses two fixed thresholds — **80%** and **100%** of the cap —
each firing **once per category per Cycle** (no repeats, no escalation, not
user-configurable). Distinct from the Forecast: an Alert is about spend that has
*already happened*; the Forecast is about *projected* spend.
