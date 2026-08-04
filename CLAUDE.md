# CLAUDE.md — "Smjena" / Dutyboard

Role-based **police workforce-management demo** for MUP Demo kantona. Shown to a government
ministry. All data is fake and generated deterministically. This file is the agent onboarding
doc — read it and [docs/STATUS.md](docs/STATUS.md) first when picking up work.

- **Full spec (source of truth):** [docs/demo-spec.md](docs/demo-spec.md)
- **Living build status / what's done / what's left:** [docs/STATUS.md](docs/STATUS.md) — **update it as you work.**

## Golden rules

1. **All user-facing text is Bosnian (bs).** No English leaks in labels, toasts, empty states,
   chart axes, buttons. Code, comments, commits, and these docs are English.
2. **Formats:** dates `dd.mm.yyyy`, time 24h, currency `KM`.
3. **Data scoping is real, not cosmetic.** Every list/dashboard/chart pulls through
   `useScopedWorld()` (src/data/useScopedWorld.ts). Switching načelnik PU Centar → PU Novi Grad
   must show entirely different data with zero leakage. This is demoed live — keep it airtight.
4. **Red is reserved for alarms only** (NEPOTPUNA patrol, expired certs, below-minimum shift).
   Don't use red for ordinary UI accents, or alarms stop feeling like alarms.
5. **In-session mutations live in memory and reset on reload** — this is intentional and desirable
   for a demo. All of it is in [src/app/store.tsx](src/app/store.tsx). Role switching uses router
   navigation (not `window.location`) so cross-role flows survive a role change.
6. **Nadležnosti su stvarne:** šef smjene vodi smjenu (aktivna smjena, knjiga, bilten); **komandir PS**
   pravi raspored i odobrava zahtjeve/prekovremeni; načelnik je na nivou PU. Ne miješati.
7. **Don't invent modules beyond the spec.** Polish beats surface area. "What NOT to build" section
   of the spec is binding: no real auth/DB/integrations, responsive web only.

## Stack (fixed — do not substitute)

React 19 + Vite + TypeScript + Tailwind v4 · react-router-dom · Recharts · Leaflet/react-leaflet
(OSM, no keys) · lucide-react · Express (Node) server for static + access-key gate. No database.

## Run / build

```bash
npm run dev      # client (vite) + server (tsx watch) via concurrently
npm run build    # tsc -b && vite build  → dist/
npm run start    # production: serves dist/ + API (needs ACCESS_KEYS env)
npm run lint     # oxlint
```

Gate keys come from `ACCESS_KEYS` env (comma-separated `label:key`, e.g. `demo:DEMO-2026`).
For local dev see the server default / DEPLOY.md.

## Architecture map

```
server/index.ts            Express: static SPA + POST /api/auth (gate) + rate limit + /healthz
src/data/
  types.ts                 all domain types
  generator/               deterministic seeded world (prng, names, org, officers, roles,
                           shifts, vehicles, performance, court, payslip, dates)
  world.ts                 the generated world singleton
  useScopedWorld.ts        scoping hook — the isolation backbone (rule #3)
src/domain/                eligibility (ko može u slot i zašto ne) · unitStats · workTime ·
                           overtimeCost · readiness · workforce · reportTemplates
src/app/
  RoleContext.tsx          current role + org scope
  routes.tsx               role-scoped route trees + gate + RequireRole guards
  store.tsx                all in-session mutations (leave, court, overtime, K02 crisis, shift log)
src/features/
  gate/ rolePicker/        E00a, E00
  officer/                 P01–P06 + ScheduleSection (mobile-first)
  shiftCommander/          K02 aktivna, K05 mapa, K06 moja smjena, K07 bilten
  precinctCommander/       K01 raspored, K03 odobrenja/prekovremeni, PC00–PC03 (komandir PS)
  kdd/                     Knjiga dnevnih događaja (piše šef smjene, čitaju nadređeni)
  reports/                 P06 izvještaji (zabilješke, prijave) + red za štampu
  dispatch/                D01 mapa kantona, D02 bilteni, jutarnji brifing, UnitsMap, sektori
  chief/                   N01–N05 (načelnik PU)
  commissioner/ minister/  C01–C05, M01–M04
  admin/                   A01 postavke organizacije (white-label)
  mockups/                 X01–X03
src/components/            shared UI (Button, Card, Kpi, StatusBadge, shells, chartTheme, ...)
```

## Screen priority legend (from spec)

**PUNI** = fully functional with fake data · **DJELIMIČNI** = basic flow works, rest static ·
**MOCKUP** = polished static screen. The priority per screen is in the spec and STATUS.md.

## Conventions

- Bosnian identifiers appear in domain enums/status values (`na_terenu`, `godisnji`, `bolovanje`,
  `sefSmjene`, …) — match existing casing; don't anglicize them.
- Reason strings in eligibility.ts are spec-exact ("Godišnji", "Certifikat istekao MM/YY",
  "Obavezni odmor — radio prošlu noć", "Van sezone za ovu ulogu", "Nema slobodnog motocikla").
  Don't reword — they're demoed verbatim.
- Officer screens target ≤430px first; command screens desktop-first but usable on tablet.
- Loading/empty/transition states are part of the deliverable, not an afterthought.
