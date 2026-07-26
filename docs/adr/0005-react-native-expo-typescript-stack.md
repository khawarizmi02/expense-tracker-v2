# React Native (Expo) + TypeScript as the mobile stack

Kira ships to **iOS + Android** from one codebase. We chose **React Native with
the Expo framework, in TypeScript**, over Flutter (the other candidate named in
the PRD). This decision carries lock-in — the whole app and the `core` module's
implementation language depend on it — so it is recorded as an ADR (per T1).

## Context

The PRD (§10) names React Native and Flutter as the likely cross-platform
candidates and rules out native Swift/Kotlin for a solo/small-team MVP. The spec
requires a pure, framework-agnostic `core` domain module with a public API that
is portable across whatever stack is chosen, plus a test harness that runs the
core's tests green in CI.

## Decision

- **React Native + Expo, TypeScript.** The `core` module is plain TypeScript with
  no React, React Native, or Expo imports — it stays framework-agnostic as the
  spec requires, and its Jest suite runs in a plain Node environment (no native
  preset), so CI needs no emulator.
- **Expo Router** for the four-tab shell (Home · Insights · History · Profile)
  and the QuickAdd modal behind the center ＋ button.
- **Encryption at rest** via `react-native-mmkv` opened with an encryption key
  generated once and held in the platform secure keystore through
  `expo-secure-store` (iOS Keychain / Android Keystore). Local-first, on-device
  only — no cloud, no network, no bank integration in v1.
- **Version baseline: Expo SDK 54** (React 19.1, React Native 0.81, expo-router 6,
  TypeScript 5.9, new architecture enabled). We track the current SDK because the
  **Expo Go** client only runs the latest SDK — pinning an older SDK means the
  app won't open in an up-to-date Expo Go without side-loading a matching client.

## Considered options

- **Flutter (Dart).** Excellent performance and a single rendering pipeline, but
  Dart would make the `core` a Dart module and pull the team off the JS/TS
  ecosystem. No decisive advantage for Kira's mostly-forms-and-lists UI.
- **React Native without Expo (bare).** More native control, but hands us the
  build/release/OTA plumbing Expo already solves; unnecessary for an MVP.
- **React Native + Expo + TypeScript — chosen.** TS gives the shared, portable
  `core`; Expo removes native build friction; the ecosystem covers our adapters
  (secure storage, OCR, notifications) off the shelf.

## Consequences

- The `core` is authored and tested as pure TypeScript; adapters (persistence,
  OCR, notifications) are RN/Expo modules outside the seam.
- Native builds (`expo run:ios` / `expo run:android`) require the platform SDKs;
  CI validates typecheck + the core suite, which need neither an emulator nor a
  device.
- Should we ever leave RN, only the adapter layer and UI are rewritten — the
  `core` TypeScript travels to any JS/TS runtime.
- **Expo Go caveat:** `react-native-mmkv` is not bundled into Expo Go, so the
  encrypted store is unavailable there — the app falls back to seeded, in-memory
  categories (no crash, no persistence). Real encrypted persistence requires a
  dev build (`expo run:android` / `expo run:ios` or EAS). Expo Go remains a valid
  way to preview the UI shell; it is not the store's test surface.
