# Streak is a derived, self-healing value

A Streak is **computed from which days are closed** (a day is closed by an Expense
or a No-Spend Day), not stored as a forward-only counter. We chose this so that
back-dating an Expense — or marking a past day no-spend — retroactively closes that
day and can stitch a broken streak back together, rewarding honest backfilling while
keeping the rule strict (no arbitrary grace days). A future reader expecting an
incremented `current_streak` integer will wonder why streaks recompute; the reason is
that "was every day accounted for?" is the real invariant, and it can only be answered
by looking at the set of closed days.

## Consequences

- The data model stores **closed-day facts**, not a streak counter; the streak (and
  longest streak) are projections over those facts.
- Editing or back-dating history can change past and present streak values — this is
  intended, not a bug.
