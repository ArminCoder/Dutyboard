# STATUS — handoff & continuity log

> **Read this first** when picking up work, then [CLAUDE.md](../CLAUDE.md) (conventions) and the
> [spec](demo-spec.md) (original brief — note: parts of it are now superseded, see below).
> **Keep this file current.**

**Last updated:** after Administracija (citizen portal + admin dash), Akademija, all-4-station
rosters, keyless map fix.
**Health:** `npx tsc -b`, `npm run lint`, `npm run build` all clean · world verified deterministic ·
every package browser-verified before commit.

---

## 1. What this is

A role-based **police workforce-management demo** for **MUP Demo kantona**, shown to a ministry
behind an access-key gate. All data is fake and generated deterministically. UI is **Bosnian**; code,
comments and commits are English.

The owner has **real police domain knowledge** and reviews the running app. His corrections outrank
the original spec — several spec assumptions turned out to be wrong (see §3). When he describes how
something works in the field, implement that, and update the docs rather than arguing with the spec.

## 2. Current state — everything below is built AND browser-verified

| Role | Screens |
|---|---|
| **Policajac** | P01 Smjena (+ ScheduleSection week/month calendar) · P02 Zahtjevi · P03 Statistika · P04 Plata · **P06 Izvještaji** · **P07 Akademija** (edukacija + provjera znanja) · P05 Zaduženja |
| **Šef smjene** | K06 Moja smjena (read-only) · K02 Aktivna smjena · K04 Knjiga događaja (write) · K05 Mapa patrola · K07 Bilten |
| **Komandir PS** | PC00 Komandna tabla · PC01 Ljudstvo · K01 Mjesečni raspored (**+ „Generiši raspored" → nacrt → objava + notifikacije**) · K03 Odobrenja · K03 Prekovremeni · PC02 Naoružanje i oprema · **PC03 Dokumenti** · KDD (read) · N02 · N03 |
| **OKC (dežurni)** | D01 Mapa kantona (+ sector zones) · D02 Bilteni smjena · D03 Jutarnji brifing |
| **Načelnik PU** | N01 · KDD (read) · N02 · N03 · N04 · N05 |
| **Komesar** | C01 Compstat · C02 Jutarnji brifing · C03 Kontrola prekovremenih · C04 Indeks spremnosti · C05 Kadrovska projekcija · C06 Radno vrijeme · KDD (read, sve stanice) |
| **Ministar** | M01 Strateška tabla · M02 Simulacija · M03 Budžet (**+ vlastiti prihodi: Akademija + naknade**) · M04 Resursi i oprema |
| **Administracija** | Zahtjevi građana za dokumente — obrada (podnesen → u obradi → spreman → preuzet), naplata, scope po psId |
| **Portal građana** | `/portal` — javno, **izvan interne kapije**: registracija/prijava (JMB+lozinka, mock), novi zahtjev (dokument + naknada + lokacija), praćenje statusa i preuzimanja |
| **Admin (skriven)** | A01 Postavke organizacije (white-label) — reached via a discreet role-picker link |

All roles render through **one shared `components/SidebarShell`** (desktop sidebar; mobile top strip,
or bottom tabs for the officer; light + dark variants; `print:hidden`).

## 3. The role model — get this right, it was the biggest correction

- **Šef smjene does NOT build the roster or approve leave.** He commands the shift he is given:
  active patrols, the daily events book, and the end-of-shift bilten.
- **Komandir PS** owns the monthly roster, approvals and overtime, plus his station's people,
  weapons/equipment and documents.
- **Načelnik PU** is the PU-level aggregate view (N01–N05).
- **OKC (dežurni) is kanton-wide** — it is the 122 call centre, not a PU office. It sees all stations,
  collects biltens and compiles the morning briefing for the komesar.
- **Approval chains:** slobodan dan / bolovanje → **komandir**; godišnji / ostalo → **komandir →
  načelnik**. (`chainFor()` in `src/app/store.tsx`.) There is no šef-smjene approval step any more.
- **Overtime is assigned by order, never offered/accepted.**
- **Training (gađanje, permanentna obuka) is announced** at a fixed time and place — never booked.

⚠️ The spec (`docs/demo-spec.md`) still describes K01/K03 as šef-smjene screens and scripts a
demo around that. **That part of the spec is superseded.** Use §7 for the current demo flow.

## 4. Architecture map (what changed from the spec's layout)

```
src/data/generator/     deterministic world: prng, names, org, officers, equipment, roles, shifts,
                        vehicles, performance, court, payslip, finance, targets, dates
src/domain/             eligibility · unitStats · workTime · overtimeCost · readiness · workforce
                        · reportTemplates
src/features/
  officer/              P01–P05 + ScheduleSection      shiftCommander/   K02, K05, K06, K07
  precinctCommander/    K01, K03×2, PC00–PC03          kdd/              KddBook (all roles)
  reports/              P06 Izvještaji                 dispatch/         D01, D02, JutarnjiBilten, UnitsMap, sectors
  chief/ commissioner/ minister/ admin/ gate/ rolePicker/ mockups/
  portal/               citizen portal (PortalShell, Login, Register, Home, Novi, docUi)
  administracija/       admin dash (AdministracijaShell, AdminZahtjevi)
src/app/                RoleContext · CitizenContext · OrgContext (white-label) · session ·
                        citizenSession · store · routes
src/data/               + academy.ts (Akademija bank/revenue) · administration.ts (doc catalog/fees)
```

**„Generiši raspored":** `generateRoster()` was factored into `buildRoster(rand, officers, start, end,
planted)`; `generateRosterForMonth(seed, officers, ym)` produces any month with `planted=false` (no
August-only alarm/Softić). August stays byte-identical (the `planted &&` guards no-op when true). The
komandir workflow (draft → objava) lives in the store as `generatedRosters` (per-ym `nacrt`/`objavljen`)
with `generateRosterDraft`/`publishRoster`/`discardRoster`; publish pushes an officer notification.
K01 shows the store roster for months with no `world.shifts`, filtered to scope by `psId`.

**Tenants (per access key branding):** each `ACCESS_KEYS` label can have a profile in the
gitignored `tenants.json` (`server/tenants.ts`; shape in `tenants.example.json`): org name/short,
root/region, city, map centre, PU/PS display names, street list. `/api/session` returns it;
`src/main.tsx` sets it (`app/tenant.ts`) **before** dynamic-importing `bootstrap.tsx`, so every
load-time constant (generator org tree, `ORG_ROOT_NAME`, `PLACE` from `app/places.ts`) sees the
tenant. Internal ids (`ps-centar`, …) never change — only display names. Patrol polylines are drawn
around Sarajevo and shifted to the tenant city (`shiftToTenant`). Gate login does a full reload so
the new tenant boots. No tenant → fictional "Demo kanton" defaults.

**Two auth layers, two contexts:** internal police roles use `RoleContext` + the access-key gate.
The **citizen portal is a separate public area**: `CitizenContext` (mock JMB+lozinka, accounts in
localStorage), routed under `/portal/*` **above** the gate check in `routes.tsx` so it needs no
internal key. The **`administracija`** role is a normal internal role (role picker → `/administracija`)
that processes the shared `documentRequests` store slice, scoped by `psId` like PC03.

## 5. Seed facts (deterministic — same every run)

- **308 officers**, establishment 330 · 4 PS (72 each) · 18 per shift group · 36 vehicles ·
  **248 shifts (August 2026, all 4 stations)** · 7392 performance rows (24 months).
  - Rosters now cover **ps-stari-grad** (A-411 fleet, sektori 1–4) and **ps-dobrinja** (A-611 fleet,
    5 sektora, **no moto** — fleet has none). New stations are appended after Centar/Novi Grad in
    `ROSTER_STATIONS` so those two rosters stay byte-identical (planted alarm + Softić slot intact).
- **Akademija (P07):** deterministic question bank in `src/data/academy.ts` (5 oblasti × 6 pitanja),
  functional timed quiz → rezultat + certifikat; results in store (`academyAttempts`, seeded one 5/6
  pass for Softić so a certifikat shows). `academyRevenue()` feeds the **ministar Budžet** revenue line
  (kanton ~35k KM/god, FBiH projection). Pretplata 10 KM/mj (svi policajci + kadeti).
- **Map:** `UnitsMap.tsx` uses **keyless OSM tiles** + a CSS dark filter on `.map-dark .leaflet-tile-pane`
  (markers/sektori are SVG overlays, unaffected). Carto `dark_all` needed a key — never reintroduce it.
- **Stable IDs:** `off-0001` Amar Softić (policajac) · `off-0002` Damir Kovač (šef smjene) ·
  `off-0003` Samir Begić (načelnik) · `off-0004` Edin Hodžić (unused since his card was cut) ·
  `off-komandir-centar` Adnan Softić (komandir — **fixed id on purpose**).
- **Tonight (24.08.2026, II smjena, PS Centar):** 13 slots / 19 officers — 3 auto + interventna +
  straža + 2 pješačke + 6 sektora.
- **Planted demo moments:** interventna empty on 26./27.08 nights (K01 alarm) · 4 expired certificates ·
  Softić's gađanje expires in 21 days · PS Dobrinja's bilten missing (OKC amber) · PU Novi Grad over
  its overtime budget (108%).
- Realistic figures: ~7 arrests/year, ~40–50 night hours/month (night = 22:00–06:00 → **8 h per night
  shift**), a few court hours per year.

## 6. Traps — these bite, they all bit once already

1. **Officer ID stability.** `generateOfficers` consumes `rand()` in sequence; adding or removing a
   draw shifts every later officer's id. Named officers are generated first; Adnan is appended with a
   **fixed literal id**; equipment is a **separate pass with its own PRNG**. Keep it that way.
2. **`store.tsx` dep array.** Every new slice/mutator must be added to the interface, the value memo
   **and** the manually mirrored dep array, or the UI goes silently stale.
3. **Store data isn't scoped by `useScopedWorld`.** KDD/bilten/reports live in the store — read them
   through a scoped hook (`features/kdd/useScopedKdd.ts` is the pattern), never raw in a screen.
4. **Two clocks.** Seeds and `demoNow()` anchor on `DEMO_TODAY` (2026-08-24). Never use `new Date()`
   for domain data — it breaks determinism (this caused the old "certificates change daily" bug).
5. **Role switch must not hard-reload.** `SidebarShell` logout uses router navigation; `window.location`
   would wipe the in-session store and break every cross-role demo flow.
6. **Raising headcount changes every aggregate** — re-verify C01–C05, M01–M04, N01–N04 and rescale
   `generator/finance.ts` budgets afterwards.
7. **Roster ↔ fleet coupling.** Vehicle plates referenced by the roster must exist in
   `generator/vehicles.ts` (plate numbering is station-local for exactly this reason).
8. **Sector numbers repeat across stations** — match coverage by `psId`, not by number alone.
9. **Never hardcode a place name in UI text.** Use `PLACE.psCentar` / `street(i)` / `TENANT.city`
   from `app/places.ts`, or the TK/ZDK demos show Sarajevo names. Anything that reads the tenant
   must be imported from the app tree (after `setTenant`), never from `main.tsx`.

## 7. Demo flow (current — replaces the spec's script)

1. Gate (`DEMO-2026`) → role picker
2. **Policajac:** month calendar + hours summary → statistics (Mjesec/Godina) → new request → write a
   report from two sentences
3. **Šef smjene:** Moja smjena → Aktivna smjena (set pauza with countdown; remove someone → confirm
   with reason → NEPOTPUNA → reassign) → Knjiga događaja → Bilten
4. **Komandir:** Komandna tabla ("Traži pažnju") → Ljudstvo → Odobrenja (the officer's request is
   here) → Raspored (26./27. alarm) → Naoružanje i oprema → Dokumenti (print queue)
5. **OKC:** kanton map + sector coverage + "ne javlja se" escalation (writes to the KDD) → Bilteni →
   Jutarnji brifing
6. **Komesar:** Compstat drill-down → prekovremeni fairness → spremnost → kadrovi
7. **Ministar:** Simulacija „+20 policajaca" → Budžet → Resursi (helikopter) → PDF
8. **A01** white-label: change colours, whole app re-themes live

## 8. Verification recipe (use this — it has caught real bugs every time)

```bash
npx tsc -b && npm run lint && npm run build
# determinism: two generateWorld() calls must be byte-identical
NODE_ENV=production PORT=3100 npx tsx server/index.ts &   # then poll /healthz
npm i --no-save playwright-core                            # drives system Chrome
```
Drive with `chromium.launch({ channel: 'chrome', headless: true })`, gate key `DEMO-2026`.
**Look at the screenshots** — and note that *fullPage* headless screenshots drop animated SVG bars
(a capture quirk, not a bug); screenshot the chart element or the viewport instead.

## 9. Not done / next candidates

> **Owner review progress:** the owner is walking the app role by role and giving live feedback.
> **He was last reviewing the _komesar_ role — resume the walkthrough there next session.**

**Open feature requests from the owner's review (NOT yet built):**
- **Named / custom shift types.** "Smjenska grupa A/B/C/D" reads wrong to him — real shifts are
  _dnevna / noćna_ and there can be others (_8–4_, _vanredni_). Wants the ability to **create and name**
  shift types, not just the fixed A–D rotation. ⚠ Needs a scope decision (rename the rotation vs. a full
  shift-type editor) + touches the generator's I/II `ShiftKind` model — clarify before building.
- **Načelnik personnel-by-function table** (`/nacelnik`). A table of all officers grouped by function:
  _rukovodstvo_ (komandir, zamjenik komandira, 3–4 pomoćnici — inspectors, 1–4 stars) · _administracija_
  (office cops: plate checks, ticket routing — NOT the citizen Administracija module) · _šefovi smjena_ ·
  _sektori_ · _terenski_. ⚠ Needs a functional-position taxonomy that the generator doesn't model yet
  (officers have rank + operationalRoleIds, not these buckets) — will require deriving/assigning positions.

**Done this session (owner review round):** map API-key fix (keyless OSM) · intervencija start-time on
K02 (editable) · KDD new-entry sorts to top · removed map sector squares · optional reason on odobrenja ·
document preview before printing (PC03) · **komandir can edit future shift assignments (K01 add/remove,
past/≤24h locked)** · portal header contrast fix.

- **Phase 8 polish (mostly done):** full mobile sweep at 390 px across **all 27 screens / 6 roles** —
  now **0 horizontal overflow everywhere**. Fixed: `SidebarShell` content column needed `min-w-0`
  (was stretching every screen past the viewport and clipping content); PC01/PC02 komandir tables
  needed `overflow-auto` (were clipping columns). Officer 7-tab nav fits; portal header uses `orgShort`
  on mobile. Empty/loading states + Bosnian copy verified. **Bundle split done:** N01Komandna was eager and
  pulled recharts into `index` (1016 kB); made it lazy + added `manualChunks` (react-vendor,
  charts-vendor). Now index 236 kB (51 kB gz), react-vendor 399/123 gz (eager, cached), charts-vendor
  449/129 gz (**async** — only chart screens fetch it), no chunk-size warning.
- **Dress rehearsal: PASS.** Full end-to-end run through all 8 roles in one browser session, switching
  roles via the in-app Odjava→role-picker (router nav). **0 console/page errors.** Cross-role state
  persistence confirmed: an officer's tagged request appeared in the komandir's Odobrenja after the
  role switch (trap #5 — no hard reload). New features exercised inline (Akademija, generiši+objavi
  raspored, administracija, both revenue lines). Also fixed a stale P02 copy string that still named the
  šef smjene in the godišnji approval chain (now "komandir → načelnik", per §3).
  - ⚠ Trap: any shared shell flex column that holds arbitrary content needs `min-w-0`, and every wide
    (`min-w-[…]`) table needs an `overflow-auto` wrapper, or it clips on mobile instead of scrolling.
- **Rosters for the 2 non-demoed stations are static** — fine for the scripted demo. (Historic note:
  ps-stari-grad / ps-dobrinja now have generated August rosters too — see §5.)
- `docs/demo-spec.md` is **partly superseded** (role model + demo script) — worth annotating.
- Per-org **feature toggles** in A01 are rendered but disabled ("u pripremi").
- Backlog ideas in [FEATURE-BACKLOG.md](FEATURE-BACKLOG.md): primopredaja smjene, komandir odobrenja
  SLA, helicopter on the OKC map, KDD → bilten auto-counts, HR/training roles.

## 10. Working agreements with the owner

- Ship in packages, **verify in a real browser before committing**, then report plainly what was
  checked. He values the honest "this is template-filled, an LLM does it in production" framing over
  overclaiming.
- Commit messages: English, explain *why*, mention what was verified.
- When his domain input contradicts the code, his input wins — and say so in the commit.
- Rotate the demo access key (`DEMO-2026`, in `DEPLOY.md`) before sending the real invite email.
