# STATUS — build progress & continuity log

> **Purpose:** if a coding session is lost, read this first (after [CLAUDE.md](../CLAUDE.md) and
> the [spec](demo-spec.md)) to know exactly where things stand. **Keep it current** — update
> the tables and the log whenever you finish or change something.

**Last updated:** 2026-07-26 (Phase 0 done + Phase 1 seed foundation core)
**Health:** `tsc -b` clean · `vite build` succeeds · `oxlint` clean (0 warnings) · world verified deterministic.

> **Master plan:** see the approved plan + [docs/FEATURE-BACKLOG.md](FEATURE-BACKLOG.md). Direction:
> demo-first / wow-focused, build komesar+ministar wow features first, expand the seed richly.

## TL;DR

The app is **feature-complete through Phase 7** (all screens exist, compile, and route; the
critical demo behaviors are wired). The remaining work is **Phase 8 (polish) + a full runtime
walkthrough of the 20-minute demo script** to catch bugs that static analysis can't. Per-screen
"built" below means *implemented and compiling*; it has **not** yet been verified by clicking
through the live demo end-to-end — that verification is the top priority.

## Phase status

| Phase | Scope | State |
|---|---|---|
| 1 — Skeleton + world | server gate, types, seed generator, RoleContext, routing, E00a, E00 | ✅ Built |
| 2 — Officer core | P01, P02, P03 (P04/P05 shells) | ✅ Built |
| 3 — Roster engine | eligibility.ts + K01 warnings/alarms | ✅ Built · ⚠️ runtime-verify both K01 demo moments |
| 4 — Live board + approvals | K02 crisis, K03 + cross-role loop | ✅ Built · ⚠️ runtime-verify round-trip |
| 5 — Dashboards | N01–N05, C01, M01 (+PDF) | ✅ Built · ⚠️ runtime-verify isolation switch |
| 6 — Map | D01 moving units + non-responsive flow | ✅ Built · ⚠️ runtime-verify |
| 7 — Config + mockups | N05, P04/P05, X01–X03 | ✅ Built |
| 8 — Polish pass | transitions, empty/loading, mobile QA, copy review, meta | ⬜ Not started |

## Per-screen status

| ID | Screen | Spec priority | State | Notes |
|---|---|---|---|---|
| E00a | Pristupna kapija | PUNI | ✅ | server/index.ts gate + rate limit; GateScreen.tsx |
| E00 | Birač uloge | PUNI | ✅ | RolePickerScreen.tsx; 6 roles + 2 načelnik cards |
| P01 | Moja smjena | PUNI | ✅ | court-summons flow in store; notifications feed |
| P02 | Moji zahtjevi | PUNI+DJEL | ✅ | slobodan-dan full; other kinds mockup-labeled |
| P03 | Moja statistika | PUNI | ✅ | Recharts, 12mo history |
| P04 | Moja plata | MOCKUP | ✅ | "Integracija u razvoju" label present |
| P05 | Zaduženja/certifikati | DJELIMIČNI | ✅ | cert expiry warnings |
| K01 | Mjesečni raspored | PUNI ★ | ✅ | eligibility greys + reasons; season warning. **Verify live.** |
| K02 | Aktivna smjena | PUNI ★ | ✅ | markOfficerSick → NEPOTPUNA → reassign → shift log |
| K03 | Odobrenja/prekovremeni | PUNI+DJEL | ✅ | approval chain + overtime ranking |
| D01 | Live mapa | PUNI | ✅ | Leaflet, moving units, "ne javlja se" (unit u-5) escalation |
| N01 | Komandna tabla PU | PUNI | ✅ | KPIs, scoped |
| N02 | Analitika učinka | PUNI | ✅ | role-filtered comparison |
| N03 | Briga o kadru | PUNI ★ | ✅ | workload index + sick heatmap + departure risk |
| N04 | Oprema/vozni park | PUNI | ✅ | per-PS vehicle status |
| N05 | Operativne uloge | DJELIMIČNI | ✅ | role catalog + create |
| C01 | Tabla Uprave policije | PUNI | ✅ | all-PU comparison, drill-down |
| M01 | Strateška tabla | PUNI | ✅ | aggregates + PDF via window.print + print CSS |
| X01 | Pisarnica | MOCKUP | ✅ | XScreens.tsx |
| X02 | Stepen tajnosti | MOCKUP | ✅ | XScreens.tsx |
| X03 | Admin/audit log | DJELIMIČNI | ✅ | XScreens.tsx |

★ = spec-flagged as the most important / theatrical screens.

## Non-negotiable behaviors (spec) — wiring check

1. ✅ **Real scoping** — `useScopedWorld` filters by org descendants (src/data/useScopedWorld.ts).
2. ✅ **Eligibility returns Bosnian reasons** — src/domain/eligibility.ts, spec-exact strings.
3. ✅ **K02 crisis end-to-end** — wired in store.tsx (markOfficerSick / reassignOfficer / shiftLog).
4. ✅ **Cross-role loop** — leave request (P02) → K03 queue → advanceApproval updates P01/P02.
5. ✅ **Map units move + one goes non-responsive** — D01Mapa.tsx (`NON_RESPONSIVE_UNIT_ID = 'u-5'`).
6. ✅ **Deterministic seed** — src/data/generator/prng.ts + fixed seed.
7. ⚠️ **Responsive** — needs real device/emulator QA (Phase 8).
8. ⚠️ **Bosnian everywhere** — no literal English leaks found in a grep sweep; needs a proper copy pass.

> ⚠️ items are "looks wired but unverified at runtime."

## Known gaps / cleanup backlog

- [ ] **robots.txt missing** — spec deploy requires `public/robots.txt` with `Disallow: /`. (quick)
- [ ] **Dead code:** `src/features/shiftCommander/PlaceholderScreen.tsx` is unused — remove. (quick)
- [ ] **`domain/workload.ts` not extracted** — spec structure lists it; the workload-index logic
      currently lives inline in N03Kadar.tsx. Works, but extract if touching N03 for reuse/testability.
- [ ] **Bundle:** main chunk ~964 kB (Recharts in the main bundle). Consider splitting for load polish.
- [ ] **Lint:** 4 `react(only-export-components)` fast-refresh warnings in store.tsx / RoleContext.tsx
      (cosmetic; only affects HMR, not the build).
- [ ] **Phase 8 proper:** transitions, empty/loading states audit, mobile QA on officer screens,
      Bosnian copy review, favicon/meta polish, English-string sweep.

## The demo dramaturgija (what must run flawlessly, ~20 min)

1. E00a key + E00 picker (30s)
2. Officer on phone: P01 → P02 request → P03 (3m)
3. Šef smjene: K03 approve → K01 roster + season warning → **K02 crisis** (5m — the heart)
4. Dežurni: D01 map + "ne javlja se" (2m)
5. Načelnik: N01 → **switch načelnik (isolation!)** → N02 → N03 → N04 → N05 create role (5m)
6. Komesar: C01 (1m)
7. Ministar: M01 + PDF (1m)
8. X01/X02 on questions

**Definition of done:** a presenter can run the whole script start-to-finish on the hosted URL with
zero errors, phone (officer) + laptop (command), following only the spec.

## Expansion work (post-recovery — the "wow" build)

Driven by the approved master plan + [FEATURE-BACKLOG.md](FEATURE-BACKLOG.md). Progress:

- ✅ **Phase 0 — safety pass:** `public/robots.txt` added; dead `PlaceholderScreen.tsx` removed; oxlint
  fast-refresh warnings cleared (file-level disable on the two provider files); build/lint/typecheck green.
- ✅ **Phase 1 — seed foundation (core):** performance now anchors on `DEMO_TODAY` + **24 months** (was
  buggy real-date/12mo → 2026 charts were half-empty); `Officer` gained **`hireDate`/`birthDate`**
  (rank-correlated, realistic pyramid — kills M01's hardcoded staž/pension); `OrgNode.establishment` on
  PS/posebna + `establishmentUnder()` rollup; new `FinanceConfig`/`KpiTargets`/`RestRules` on the `World`
  via `generator/finance.ts` + `generator/targets.ts`; `useScopedWorld` passes them through. Verified
  deterministic. **M01 still displays its old hardcodes — rewire to the new data when rebuilding M01 (Phase 3).**
- ✅ **build-next #3 — Ministar *Simulacija „+20 policajaca"*:** interactive what-if. Two sliders
  (dodatni policajci 0–40, limit prekovremenih h/officer) → live recompute of coverage %, annual OT cost
  (KM), burnout index (zeleno/žuto/crveno), and a budget-tradeoff panel (nove plate vs OT ušteda → neto) +
  a live Bosnian narrative. Model in `M02Simulacija.tsx` (`simulate()`), verified monotonic. Ministar role
  converted to a tabbed shell (`MinisterShell.tsx`): **Strateška tabla | Simulacija**. Routes nested under
  `/ministar`. **M01 rewired to real data** — establishment via `establishmentUnder`, staž/pension from
  `hireDate`/`birthDate`, OT rate from `finance` (all former hardcodes gone).
- ✅ **build-next #4 — Komesar *Operativni pregled (Compstat)*:** ranked accountability board with real
  **drill-down Kanton→PU→PS→smjena** (breadcrumb + focus state), traffic-light KPIs vs `targets`, and
  **period-over-period** arrows (last complete month `2026-07` vs `2026-06`) with semantic coloring.
  Reusable `src/domain/unitStats.ts` (unitStat / childUnitsOf / pathFromRoot / monthlyIntervencije). Komesar
  converted to `KomesarShell` (tabbed). **Posebna jedinica is now visible to the komesar** (was excluded).
  Old `C01Uprava.tsx` removed. Browser-verified (drill + PoP + lights, zero console errors).
- ✅ **build-next #5 — Komesar *Usklađenost radnog vremena*:** EU working-time compliance as a KomesarShell
  tab. `src/domain/workTime.ts` computes per-officer compliance from last-month hours (weekly hours healthy
  ~38.5h; the real signal is overtime — 23 over the 16h limit, 10 clear breaches). Screen shows compliance %,
  breaches, avg weekly, night share, a per-PU ranked table, and a color-coded overtime histogram (green→red
  tail). Browser-verified, zero console errors. Note: viewport screenshots DO render animated bars — only
  *fullPage* headless drops them.
- ✅ **App-wide sidebar unification:** all six roles now use one `components/SidebarShell` (desktop sidebar
  + mobile top-strip or bottom-tabs; light + dark variants; `print:hidden` so PDF exports stay clean).
  Komesar/Ministar moved from top-bar to sidebar (badges C0x/M0x); Officer got a desktop sidebar (mobile
  bottom-tabs kept); Dežurni got a dark sidebar (D01Mapa refactored to shed its own chrome). Browser-verified
  all six, zero console errors.
- ✅ **build-next #6 — Ministar *Budžet i troškovi ljudstva*:** MinisterShell tab (M03). Per-PU personnel/OT
  budget vs actual, OT-budget utilization with traffic lights (Novi Grad 109% = over budget, red), grouped
  budget-vs-cost chart, and the "OT cost ≈ N salaries" hiring argument tied to the simulator. PDF export.
  **`finance.ts` budgets rescaled** to the ~99-officer demo (were placeholder-large). Browser-verified.
### Domain-feedback wave (v2 plan — police-insider corrections)

- ✅ **WP1 — Officer pack:** P01 gained a **Sedmica | Mjesec** schedule (month calendar with per-day
  detail: shift, role/callSign, partner(s), vehicle, hours) + a **monthly hours summary** (radnih/noćnih
  sati, godišnji/bolovanje/slobodan days, leave excluded from hour totals). P04 lists **six generated
  payslips**, any month opens its full platna lista (current month badged as an estimate). P05 dropped the
  day counters for VAŽEĆI / ISTIČE USKORO badges. P02 dropped *premještaj*, added *bolovanje*.
  Bugs fixed: hero card used `slots[0]` regardless of the officer's actual slot; cert expiry + store
  timestamps ran on the real clock (non-deterministic) → now `DEMO_TODAY` / `demoNow()`.
- ✅ **WP2 — Knjiga dnevnih događaja + komandir:** `KddEntry` type + store slice (`addKddEntry` /
  `updateKddEntry`, 13 seeded entries across all 4 PS). `src/features/kdd/useScopedKdd.ts` is the
  **isolation seam** — screens must never read `store.kddEntries` directly. `KddBook.tsx` serves all roles
  (date filter, full-text search, type chips, station chips when scope > 1 PS, expandable rows, "Novi upis"
  + "Zaključi upis" when `canWrite`). New **komandir** role (Adnan Softić, `off-0100`, PS Centar) on
  ChiefShell with `showN05={false}`. Access verified: šef smjene 7 (writes) · komandir 7 (read-only) ·
  načelnik 9 (2 PS) · komesar 12 (4 PS).
  **Also fixed:** Odjava did `window.location.href` (hard reload) which wiped the in-session store, so
  cross-role flows silently lost data — including the spec's signature P02→K03 request round-trip. Now
  router navigation; a real refresh still resets, as intended.
- ⏳ **Phase 1 remainder (staged with their screens):** populate `equipmentAssigned`; generate rosters for
  all PS (only PS Centar/Aug today); world-wide `leaveRequests`/`notifications`; aggregate complaints/UoF;
  PU boundary polygons for the choropleth.
- ⬜ **Next up:** build-next #7 Komesar *Kontrola prekovremenih (trošak + pravednost)*; then #8 *Indeks
  spremnosti*, #10 choropleth — see FEATURE-BACKLOG.md.

> **Browser verification is set up** (Playwright via system Chrome). Pattern: `NODE_ENV=production PORT=3100
> npx tsx server/index.ts` (bg), `npm i --no-save playwright-core`, drive with `channel:'chrome'`; gate key
> `DEMO-2026`; screenshot the **chart element** (fullPage headless drops animated SVG bars — a screenshot
> quirk, not an app bug). Ministar + Komesar suites both browser-verified this way.

## Continuity log

- **2026-07-26** — Master-plan session. Ran feature-research (all roles) → `docs/FEATURE-BACKLOG.md`.
  Completed Phase 0 + Phase 1 seed-foundation core (above). Build green & deterministic. New generator
  files: `finance.ts`, `targets.ts`. Modified: `types.ts`, `dates.ts`, `performance.ts`, `officers.ts`,
  `org.ts`, `generator/index.ts`, `useScopedWorld.ts`.
- **2026-07-25** — Recovered a "lost" prior session. Found the build far ahead of the last commit
  message (`Phase 2`): all phases 1–7 implemented, tree clean, everything compiles. Created
  CLAUDE.md + this file, moved the spec into `docs/`.
