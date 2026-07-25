# Product Requirements Document
## Expense Tracker App (Solo Personal Budgeting)

**Status:** Draft v1
**Owner:** [Your name]
**Last updated:** 2026-07-25

---

## 1. Overview

A mobile-first expense tracking app for individuals managing their own personal budget. The app prioritizes fast, low-friction expense logging and daily engagement over deep automation — the goal is to make tracking spending feel effortless enough that users actually keep doing it.

**Platforms:** iOS + Android (cross-platform)
**Primary user:** Solo personal budgeters (not couples, not businesses, not group expense splitting)
**Monetization:** TBD — see Section 9

---

## 2. Problem Statement

Most people lose track of where their money goes not because they lack willpower, but because logging expenses is either too slow (manual entry apps) or too passive to build a habit (auto-sync apps people stop opening). Existing tools force a trade-off between speed of capture and depth of insight. This app aims to close that gap for a single-user audience specifically, without the complexity of budgeting philosophies (e.g. YNAB's zero-based method) that have a steep learning curve.

---

## 3. Goals

- Make logging an expense take under 10 seconds
- Give users a daily reason to open the app (not just at month-end)
- Surface overspending *before* it happens, not after
- Build a habit loop strong enough to survive without bank-account sync in v1

### Success Metrics (initial targets — revisit post-launch)
- % of users who log at least 1 expense on 5+ days per week
- 7-day and 30-day retention
- Average time-to-log per expense (target: <10s)
- % of users with an active budget streak at day 30

---

## 4. Target User

**Persona: "Solo Budgeter"**
- Manages their own finances, no shared household budgeting needed
- Wants visibility into spending without a steep learning curve
- May be privacy-conscious about linking bank credentials
- Motivated by small wins/feedback loops (streaks, progress bars) more than spreadsheets

---

## 5. MVP Scope

Per product decision: **full scope**, including gamification, ships in v1 (not deferred to v2).

### 5.1 Core Loop

| Feature | Description |
|---|---|
| **Manual expense entry** | Quick-add flow: amount, category, merchant/note, date. Must be completable in a few taps. |
| **Receipt capture (OCR)** | Photo of a receipt auto-extracts amount, merchant, and date. User confirms/edits before saving. |
| **Auto-categorization** | Merchant-based rule matching in v1 (e.g. "Starbucks" → Dining) with manual override. ML-based categorization is a post-MVP upgrade, not required for launch. |
| **Category budgets** | Simple limit-per-category model (not full zero-based/envelope budgeting). User sets a monthly cap per category. |
| **Dashboard** | Spend-vs-budget view per category (progress bars or simple charts), plus a monthly total. |
| **Recurring/subscription detection** | Rule-based: same amount + same merchant + roughly monthly cadence gets flagged as recurring and surfaced to the user. |
| **Over-budget alerts** | Push notification when a category crosses a threshold (e.g. 80% and 100% of its cap). |

### 5.2 Differentiators (included in v1 per MVP decision)

| Feature | Description |
|---|---|
| **Frictionless logging tools** | Quick-add shortcut/widget, and batch receipt scanning (multiple photos in one session) so a pile of receipts can be logged at once. |
| **Streaks & badges** | Daily/weekly logging streaks, and budget-adherence badges (e.g. "stayed under budget in Dining for 4 weeks"). This is the primary accountability mechanism since there's no shared household member to provide it. |
| **Predictive nudges** | Simple forecast: "At this pace, you'll be $X over your Dining budget by month end," calculated from current spend rate vs. days remaining in the period. |
| **Privacy-first default** | No bank account linking required to use the app. Manual entry + receipt scan is the default path; bank sync (if built) is an opt-in, later addition — not required for MVP. |

---

## 6. Explicitly Out of Scope for v1

- Bank account sync / transaction auto-import (Plaid-style aggregation) — significant infra cost and ongoing maintenance; revisit post-launch based on retention data
- Multi-currency support
- Group/shared expenses or bill-splitting (Splitwise-style)
- Couples/partner shared budgeting mode
- Business expense features (policy rules, approvals, invoicing)
- Full zero-based/envelope budgeting methodology (YNAB-style) — may be offered later as an optional "strict mode"
- Net worth / investment account tracking

---

## 7. Key User Flows

### 7.1 Onboarding
1. Welcome / value prop screens
2. Set up initial categories (offer sensible defaults: Groceries, Dining, Transport, Bills, Entertainment, Shopping, Other)
3. Set a monthly budget per category (optional — can skip and set later)
4. Prompt to log first expense immediately (get to "aha" moment fast)

### 7.2 Add an Expense
1. Tap quick-add (from dashboard or home-screen widget)
2. Choose: manual entry / snap receipt / batch scan
3. Confirm auto-detected amount, merchant, category, date
4. Save → dashboard updates, streak increments if applicable

### 7.3 Review Budget
1. Open dashboard
2. See per-category progress bars (spent vs. budget)
3. Tap a category to see transaction list + edit/recategorize any entry
4. See forecast nudge if trending over budget

---

## 8. Data Model (high-level)

- **User** — id, preferences, streak state
- **Category** — id, name, icon, monthly budget amount
- **Transaction** — id, amount, category_id, merchant, date, note, source (manual/OCR/recurring), receipt_image_ref
- **RecurringExpense** — id, merchant, amount, cadence, linked transaction history
- **Streak** — id, user_id, current streak count, longest streak, last logged date
- **Badge** — id, user_id, badge_type, date_earned

---

## 9. Monetization

**Not yet decided.** Options to evaluate post-MVP based on usage data:
- Freemium: core tracking free, gamification/insights or advanced categorization behind a paid tier
- One-time purchase (appeals to the privacy-conscious segment who dislike subscriptions)
- Fully free (relies on future monetization path, e.g. later premium features)

Recommendation: launch free to build a user base and validate retention before locking in a pricing model — pricing decisions made pre-launch on a v1 app are usually wrong.

---

## 10. Non-Functional Requirements

- **Offline support:** core logging (manual entry) must work without network connectivity; sync when back online
- **Performance:** quick-add flow should feel instant (<1s to open, no network dependency to save an entry)
- **Privacy/security:** receipt images and transaction data encrypted at rest; no data sold to third parties (positioning point, not just compliance)
- **Cross-platform tech:** to be decided by engineering — React Native or Flutter are the likely candidates given the iOS + Android target; native (Swift/Kotlin) would double development effort and isn't recommended for a solo/small-team MVP

---

## 11. Open Questions

- [ ] Final app name / branding
- [ ] Monetization model (see Section 9)
- [ ] Default category list — finalize based on user testing
- [ ] Should streak-breaking be forgiving (e.g. one grace day) or strict?
- [ ] OCR: build in-house vs. third-party API (e.g. Google ML Kit, AWS Textract)?
- [ ] Post-MVP roadmap priority: bank sync vs. ML-based categorization vs. envelope budgeting mode?

---

## 12. Future Considerations (post-MVP)

- Bank account sync (opt-in)
- ML-based auto-categorization (replacing rule-based matching)
- Optional zero-based/envelope budgeting mode for power users
- Export/reporting (CSV, PDF monthly summary)
- Widget/watch app support for even faster logging
