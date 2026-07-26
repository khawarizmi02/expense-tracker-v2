# Kira

A mobile-first, solo personal **expense** tracker. See `CONTEXT.md` for the
domain glossary and `docs/adr/` for the architectural decisions.

## Stack

React Native (Expo) + TypeScript — see [ADR-0005](docs/adr/0005-react-native-expo-typescript-stack.md).

- **`src/core/`** — the pure, framework-agnostic domain module. No I/O, no React,
  no Expo. All spending logic lives here behind the public API in `src/core/index.ts`.
- **`src/design/`** — "Subtle Gradient" design-system tokens + light/dark theme.
- **`src/store/`** — encrypted-at-rest, on-device local store (MMKV + secure-keystore key).
- **`src/ui/`** — shared presentational components.
- **`app/`** — Expo Router screens: four-tab shell (Home · Insights · History ·
  Profile) + center ＋ QuickAdd modal.

## Develop

```bash
npm install
npm run typecheck   # tsc across the whole app
npm test            # the core domain suite (the primary test target)
npm run ios         # or: npm run android  (requires platform SDKs / emulator)
```

CI (`.github/workflows/ci.yml`) runs the typecheck and the core suite on every
push and pull request.
