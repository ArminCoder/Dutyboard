# Demo specifikacija — Platforma za upravljanje ljudstvom (demo)
**Radni naziv: "Smjena" (placeholder — odabrati brend kasnije)**
Verzija 1.1 · Screen-by-screen build checklist + upute za coding agenta (Claude Code)

---

## Šta je novo u v1.1

- Demo se **hostuje online** (DigitalOcean + jeftina domena) umjesto offline s laptopa
- Dodana **pristupna kapija (access key)** — link + ključ idu u email prema MUP-u
- Dodan kompletan odjeljak **"Instructions for the coding agent"** — spreman za Claude Code
- Laptop verzija ostaje kao rezerva za sastanak uživo (isti build, `npm run dev`)

---

## Distribucija i sigurnost dema

**Model:** kupiti jeftinu domenu (npr. nešto neutralno-profesionalno: `smjena-demo.ba` ili .com/.app — izbjegavati bilo šta sa "mup" u domeni jer ne predstavljamo instituciju), hostovati na postojećem DigitalOcean planu, poslati email sa linkom + pristupnim ključem.

**Pristupna kapija:**
- Landing ekran prije svega: logo + polje "Pristupni ključ" + poruka *"Demo okruženje je zaštićeno. Ključ ste dobili u pozivnom emailu."*
- Ključ se provjerava **na serveru** (ne u klijentskom JS-u — ključ u frontend kodu bi bio vidljiv svakome ko otvori DevTools, a upravo policiji to ne smijemo priuštiti)
- Nakon ispravnog ključa: httpOnly cookie, sesija 7 dana
- Mogućnost više ključeva (npr. `DEMO-2026` za ministarstvo, poseban za nas za testiranje) — svaki u env varijabli, pa se vidi i ko je pristupao ako zatreba
- 5 pogrešnih pokušaja → pauza 15 min po IP-u (jednostavan rate limit)

**Iskrena napomena za nas interno:** ovo je lagana kapija, ne prava enterprise sigurnost — i to je OK jer su svi podaci izmišljeni. Njena svrha je (1) da niko slučajno ne naiđe na demo, (2) da MUP-u pošalje poruku "ovi razmišljaju o kontroli pristupa". U emailu i na sastanku govoriti istinu: "demo sadrži isključivo izmišljene podatke, a pristup je ograničen ključem; produkcijski sistem koristi AD/LDAP, 2FA i hosting u BiH." Ne prodavati kapiju kao više nego što jeste.

**Email prema MUP-u (skica):** kratak, formalan, bosanski; link + ključ; napomena da su podaci izmišljeni; poziv na prezentaciju uživo gdje se demo vodi kroz scenarije. (Poseban dokument — pisati kad demo bude gotov.)

---

## Kako čitati ovaj dokument

Svaki ekran ima:
- **Prioritet izgradnje:** PUNI (potpuno funkcionalan s lažnim podacima) / DJELIMIČNI (radi osnovni tok, ostalo statično) / MOCKUP (samo polirani statični ekran)
- **Demo momenat:** šta tačno pokazuješ i koja rečenica ide uz to
- **Podaci:** šta seed-data mora sadržavati

Svi UI tekstovi na bosanskom. Responzivno: komandni ekrani za desktop/projektor, policajski za telefon.

---

## Globalno

### E00a — Pristupna kapija (NOVO)
**Prioritet: PUNI**

- Polje za ključ, poruka o zaštiti, diskretan footer "Svi podaci u demonstraciji su izmišljeni."
- Server-side provjera, httpOnly cookie, rate limit

### E00 — Birač uloge
**Prioritet: PUNI** · Kičma demo prezentacije.

- Logo + "Demo okruženje — svi podaci su izmišljeni"
- Kartice uloga sa fiktivnim korisnicima:
  - **Policajac** — "Amar Softić, policajac, PS Centar, II smjena"
  - **Šef smjene** — "Damir Kovač, stariji narednik, PS Centar"
  - **Dežurni operativac** — "Operativni centar PU Centar"
  - **Načelnik PU** — "Samir Begić, PU Centar" **i** "Edin Hodžić, PU Novi Grad" (dvije kartice namjerno — demonstracija izolacije podataka)
  - **Policijski komesar** — "Uprava policije MUP DK"
  - **Ministar** — "Kabinet ministra"
- Klik = trenutna prijava u ulogu (bez lozinki u demu; produkcija: AD/LDAP + 2FA — reći usmeno)

**Demo momenat:** "Svaki nivo vidi samo ono što mu pripada — ista aplikacija kroz šest pari očiju."

---

## Policajac (mobile-first — na sastanku demonstrirati na telefonu u ruci)

### P01 — Moja smjena (početni ekran)
**Prioritet: PUNI**

- Pozdrav + datum
- Kartica **sljedeće smjene**: datum, vrijeme (19:00–07:00), uloga ("Auto-patrola 2-1 · Interventna"), partner, vozilo
- Sedmični pregled (rad/slobodan/godišnji)
- Feed obavještenja: izmjena rasporeda, odobren zahtjev, **sudski poziv**, ponuda prekovremenih s dugmetom "Prihvati"; bedž nepročitanih

**Tok sudskog poziva:** notifikacija "Sudski poziv — Općinski sud, 24.08. u 09:00, K-441/26" → "Potvrdi prisustvo" → nakon termina "Unesi trajanje" (1h/2h/drugo) → "Sati evidentirani za obračun avgust 2026."
**Demo momenat:** "Sati sa suda idu automatski u obračun — nema više papira na kraju mjeseca."

**Podaci:** 14 dana rasporeda za Softića, 5–6 obavještenja, 1 sudski poziv.

### P02 — Moji zahtjevi
**Prioritet: PUNI (slobodan dan) + DJELIMIČNI (ostali tipovi)**

- "Novi zahtjev": Slobodan dan / Godišnji / Premještaj (mockup) / Ostalo
- Statusi sa vidljivim lancem: šef smjene → komandir → načelnik
- Preostali dani godišnjeg

**Demo momenat:** pošalji zahtjev kao Softić → prebaci se u šefa smjene → odobri → notifikacija stigne nazad. Kružni tok za 20 sekundi.

### P03 — Moja statistika
**Prioritet: PUNI**

- Godina: hapšenja, prekršajni nalozi, intervencije, asistencije + trend
- Graf po mjesecima; sati: redovni/noćni/prekovremeni/sud
- Poruka: "Statistika služi tebi — komandiri vide agregate po jedinici"

**Podaci:** 12 mjeseci istorije, brojke korelirane s operativnom ulogom.

### P04 — Moja plata
**Prioritet: MOCKUP (poliran)**

- Platna lista: osnovna, minuli rad, noćni, prekovremeni, **sati sa suda**, topli obrok, prevoz → neto
- Kalendar isplata; arhiva; oznaka "Integracija u razvoju"

### P05 — Moja zaduženja i certifikati
**Prioritet: DJELIMIČNI**

- Oprema: oružje (serijski), radio, značka, uniforme, ev. motocikl
- Certifikati s rokovima; **crveno upozorenje 30 dana prije isteka**
- "Nakon isteka nećeš biti raspoređivan na uloge koje ga zahtijevaju"

**Demo momenat:** "Sistem sam pazi na certifikate — komandir ne otkriva na dan smjene da neko nema važeće gađanje."

---

## Šef smjene / Komandir (desktop-first)

### K01 — Mjesečni raspored (roster builder)
**Prioritet: PUNI — najvažniji ekran u aplikaciji**

- Mreža dani × smjene (I: 07–19, II: 19–07)
- Smjena = **slotovi**; slot traži operativnu ulogu: Pješačka, Auto-patrola (2 policajca), Interventna, Moto, Bicikl (sezonski), Civilna
- Klik na slot → **dostupni** (zeleno) i **nedostupni sa razlogom** (sivo: "Godišnji", "Certifikat istekao 03/26", "Obavezni odmor — radio prošlu noć", "Van sezone", "Nema slobodnog motocikla")
- **Alarm minimalne popune:** noćna smjena bez ≥1 interventne = crveno
- **Sezonsko upozorenje:** bicikl-patrola u novembru → "Bicikl patrole aktivne april–oktobar. Nastaviti?"
- Šabloni sedmice; objava rasporeda → svi dobiju notifikaciju

**Demo momenti:** (1) sivi policajac s razlogom — "Sistem zna pravila." (2) sezonsko upozorenje uživo.

**Podaci:** PS Centar ~80 policajaca, 4 smjenske grupe; 60% samo uniforma / 15% +interventna / 8 moto / 6 bicikl / 5 civili; 3–4 namjerno istekla certifikata.

### K02 — Aktivna smjena (live board)
**Prioritet: PUNI — teatralni vrhunac dema**

- Trenutna smjena: patrole kao kartice (Auto 2-1: Softić + Mehić · Interventna · A-311), statusi (Na terenu / Pauza / Intervencija)
- **Scenarij "razbolio se":** Mehić → "Napustio smjenu (bolovanje)" → patrola **NEPOTPUNA (crveno)** → rangirane zamjene iz pješačkih, filtrirane po kvalifikacijama → klik → premješten, push, zeleno → sve u dnevniku smjene
- Dnevnik smjene (log izmjena)

**Demo momenat:** "22:40, Mehić ide kući... šef smjene ovo rješava za deset sekundi, bez telefona, i sve ostaje zapisano."

### K03 — Odobrenja i prekovremeni
**Prioritet: PUNI (odobrenja) + DJELIMIČNI (prekovremeni)**

- Red zahtjeva: odobri / odbij s razlogom / proslijedi
- Prekovremeni: objava (termin, uloga, broj ljudi) → **rangirana lista kvalifikovanih** (najmanje sati prve) → push ponude → Softić prihvata
- Historija: kome nuđeno, ko odbio, ko preskočen; ručna dodjela uz obavezno obrazloženje (logovano)
- Mjesečni bar chart raspodjele prekovremenih

**Demo momenat:** "Sistem predlaže po pravilima; komandir može drugačije — ali i to ostaje zapisano." (Reći neutralno.)

---

## Dežurni operativac

### D01 — Live mapa
**Prioritet: PUNI (simulirano kretanje)**

- Leaflet/OSM mapa Sarajeva, 8 jedinica se kreće realistično (snimljene polilinije po stvarnim ulicama)
- Markeri po operativnoj ulozi (auto / interventna-crno / moto / pješačka / civilna diskretno) + filter
- Klik: sastav, status, zadnja aktivnost
- **Tok "ne javlja se":** narandžasto "bez odgovora 4 min" → "Pošalji provjeru statusa" → simulirani push → bez odgovora 2 min → eskalacija šefu smjene s lokacijom
- Napomena u UI: "Prati se jedinica/vozilo — u svrhu sigurnosti policajaca"

**Demo momenat:** "Ako se patrola ne javlja, znamo gdje je i šaljemo pomoć — sigurnost, ne nadzor."

---

## Načelnik PU (desktop)

### N01 — Komandna tabla PU
**Prioritet: PUNI**

- Zaglavlje **PU Centar** (Begić) — sve skopirano na njegovu PU
- KPI: popunjenost danas (%), godišnji, bolovanja, otvoreni zahtjevi, vozila ispravna/ukupno
- Mini-mapa teritorije, trend prekovremenih, upozorenja (certifikati, smjene ispod minimuma)

**Demo momenat (ključni):** Begić (PU Centar) → odjava → Hodžić (PU Novi Grad) → **svi podaci drugačiji; PU Centar za njega ne postoji.** "Načelnik vidi samo svoju upravu. Uvijek."

**Podaci:** dvije PU, različiti konzistentni setovi (Novi Grad veći, više bolovanja).

### N02 — Analitika učinka
**Prioritet: PUNI**

- Filteri: period, PS, smjenska grupa, **operativna uloga**
- Grafovi po jedinici i policajcu; poredak uz obavezni filter uloge; tooltip "Poređenje unutar iste vrste posla"
- Top/bottom 10 uz kontekst

**Demo momenat:** "Jabuke s jabukama — interventna i pozornik ne rade isti posao, i sistem to zna."

### N03 — Briga o kadru
**Prioritet: PUNI — strateški najvažniji za pitch ministru**

- **Indeks opterećenja**: sati 30 dana, noćne u nizu, prekovremeni, propušteni odmori → zeleno/žuto/crveno
- Bolovanja: po policajcu/jedinici + **heatmap po danu sedmice**
- "Za razgovor": crveni indeks (briga, ne sumnja)
- Indikator rizika odlaska

**Demo momenat:** "Ovaj ekran pokazuje ko izgara prije nego što preda otkaz ili ode na dugo bolovanje."

### N04 — Oprema i vozni park
**Prioritet: PUNI**

- Po PS: vozila (ispravno/servis/oštećeno), motocikli, bicikli, radio, radari, računari
- Vozilo: registracija do, servis do, zaduženo (patrola); upozorenja
- Veza s rasporedom: "Večeras raspoloživo 11/14 vozila"

**Demo momenat:** "Stanje voznog parka — jedan klik umjesto sedmice telefoniranja. I prilog za budžetski zahtjev."

### N05 — Operativne uloge (konfiguracija)
**Prioritet: DJELIMIČNI**

- Katalog uloga + "Nova uloga": naziv, sezona, certifikati (multiselect), oprema, kombinovanje/ekskluzivna, min. popuna
- Primjer ekskluzivne uloge: posebna jedinica (specijalci)

**Demo momenat:** kreiraj "Turistička patrola — jun–septembar, engleski certifikat" uživo. "Sistem se prilagođava vama, ne vi njemu."

---

## Policijski komesar

### C01 — Komandna tabla Uprave policije
**Prioritet: PUNI**

- Sve PU uporedo: popunjenost, prekovremeni, bolovanja, učinak
- Drill-down u PU (reuse N01 komponente, drugi scope)
- Agregirana mapa Kantona; 12-mjesečni trendovi

**Demo momenat:** "Od Kantona do konkretne smjene u tri klika."

---

## Ministar

### M01 — Strateška tabla
**Prioritet: PUNI (jednostavan, velike brojke)**

- Samo agregati, bez ličnih imena: popunjenost vs. sistematizacija, trošak prekovremenih (KM), bolovanja, prosjek staža, projekcija penzionisanja 24 mj, vozni park (%)
- Izvoz u PDF ("za sjednicu Vlade"); "Prikazuju se isključivo zbirni podaci"

**Demo momenat:** "Slika za skupštinsko pitanje za deset sekundi — bez ijednog ličnog podatka policajca."

---

## Mockup ekrani

### X01 — Zahtjevi / e-pisarnica
**Prioritet: MOCKUP** — životni ciklus zahtjeva za premještaj kroz lanac (datumi, statusi); vidljivost samo podnosilac + lanac; "Generiši dokument za potpis" → popunjen obrazac za štampu.

### X02 — Stepen tajnosti
**Prioritet: MOCKUP** — dokument s bedžom **POVJERLJIVO**; nivoi INTERNO / POVJERLJIVO / TAJNO / VRLO TAJNO; princip: bez dozvole se **ne vidi ni da dokument postoji**; log pristupa. Usmeno: v1 pokriva INTERNO; viši stepeni = faza sa sigurnosnom akreditacijom.

### X03 — Administracija i audit log
**Prioritet: DJELIMIČNI** — org stablo klikabilno; korisnici: uloga × jedinica × dozvola; **audit log** filterabilan ("ko je vidio šta i kada", uključujući lične podatke). "Svaki pogled u tuđi dosje ostavlja trag."

---

## Seed podaci — specifikacija

Jedan deterministički generator (seed fiksiran → isti svijet na svakom deployu):

- **Struktura:** PU Centar (PS Centar, PS Stari Grad), PU Novi Grad (PS Novi Grad, PS Dobrinja), 1 posebna jedinica (ekskluzivna uloga)
- **Ljudi:** ~180 policajaca, realna bosanska imena, činovi (policajac → stariji policajac → narednik → stariji narednik → mlađi inspektor...), raspodjela uloga po K01; 10–15% na godišnjem/bolovanju
- **Istorija:** 12 mjeseci učinka koreliranog s ulogom; bolovanja s pon/pet obrascem kod 4–5 osoba; neravnomjerni prekovremeni
- **Oprema:** 14+18 vozila, 4 motocikla, 8 bicikala, statusi servisa/registracije
- **Raspored:** tekući + sljedeći mjesec za PS Centar; ugrađeni problemi: nepopunjen slot, istekao certifikat, sudski poziv u koliziji, jedinica koja "ne odgovara" na mapi
- **Mapa:** 8 jedinica, unaprijed snimljene rute po stvarnim ulicama Sarajeva

## Redoslijed demo prezentacije (dramaturgija, ~20 min)

1. E00a ključ + E00 birač (30 sek)
2. Policajac na telefonu: P01 → P02 zahtjev → P03 (3 min)
3. Šef smjene: K03 odobri zahtjev → K01 raspored + sezonsko upozorenje → **K02 kriza** (5 min — srce dema)
4. Dežurni: D01 mapa + "ne javlja se" (2 min)
5. Načelnik: N01 → **zamjena načelnika (izolacija!)** → N02 → **N03** → N04 → N05 kreiraj ulogu (5 min)
6. Komesar: C01 (1 min)
7. Ministar: M01 + PDF (1 min — završiti na ekranu donosioca odluke)
8. X01/X02 na pitanja

---
---

# INSTRUCTIONS FOR THE CODING AGENT (Claude Code)

> This section is written in English for precision. Everything user-facing in the app itself MUST be in Bosnian (bs), using the labels and screen contents specified above. Date format dd.mm.yyyy, currency KM, 24h time.

## Mission

Build the demo web application specified above: a role-based police workforce management demo for MUP Demo kantona, with fully client-side fake data, a minimal Node server for static serving + access-key gate, deployable to DigitalOcean. Target: production-polished look and feel; this demo will be shown to a government ministry.

## Stack (fixed — do not substitute)

- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS
- **Routing:** react-router-dom (role-scoped route trees)
- **Charts:** Recharts
- **Maps:** Leaflet + react-leaflet, OpenStreetMap tiles (no API keys)
- **Icons:** lucide-react
- **Server:** Node 20 + Express — serves the built SPA, handles `/api/auth` for the access gate, sets httpOnly cookie, simple in-memory rate limit (5 attempts → 15 min per IP)
- **No database.** All demo data generated at build/startup by a deterministic seeded generator
- **State:** React context + hooks; no Redux. In-session mutations (approving a request, reassigning a patrol) live in memory and reset on reload — that is acceptable and desirable for a demo

## Project structure

```
smjena-demo/
  server/
    index.ts          # express: static + /api/auth + rate limit
  src/
    data/
      generator/      # deterministic seed generator (people, org, history, routes)
      types.ts        # all domain types
      world.ts        # the generated world singleton
    domain/
      eligibility.ts  # who can fill which slot & why not (returns reason strings in Bosnian)
      workload.ts     # workload index, sick-leave patterns
    app/
      routes.tsx      # role-scoped routing
      RoleContext.tsx # current role + scope (org node)
    features/
      gate/           # E00a
      rolePicker/     # E00
      officer/        # P01–P05
      shiftCommander/ # K01–K03
      dispatch/       # D01
      chief/          # N01–N05
      commissioner/   # C01
      minister/       # M01
      mockups/        # X01–X03
    components/       # shared: KpiCard, OrgScopedDashboard, StatusBadge, Timeline, ...
  CLAUDE.md           # summary of conventions for the agent (create it)
```

## Domain model (types.ts) — core entities

- `OrgNode` (tree: MUP → Uprava → PU → PS → Smjena; special units are siblings of PU with `exclusiveRoles: true`)
- `Officer` { id, name, rank, orgNodeId, operationalRoleIds[], certifications[] (with expiry), clearanceLevel, equipmentAssigned[], status }
- `OperationalRole` { id, name, orgNodeId (catalog owner), seasonWindow?, requiredCertIds[], requiredEquipmentType?, exclusive, combinable, minPerShift? }
- `ShiftSlot` { shiftId, requiredRoleId, capacity, assignedOfficerIds[] }
- `Shift`, `Roster`, `LeaveRequest` (with approvalChain[]), `OvertimePosting` (with offerLog[]), `CourtSummons` (with hoursCredited), `Vehicle`/`Equipment` (status, serviceDue, registrationDue), `PerformanceMonth` (per officer, correlated to role), `AuditEntry`
- `AccessRole` enum: policajac | sefSmjene | dezurni | nacelnik | komesar | ministar (+ admin for X03)

## Non-negotiable behaviors

1. **Data scoping is real, not cosmetic.** Every dashboard/list/chart pulls through a `useScopedWorld()` hook filtered by the current role's org node. Switching from načelnik PU Centar to načelnik PU Novi Grad must show entirely different data with zero leakage. This is demonstrated live in the pitch — it must be airtight.
2. **Eligibility engine returns reasons.** `eligibility.ts` returns `{ eligible: boolean, reason?: string }` with Bosnian reason strings exactly as specified in K01 ("Godišnji", "Certifikat istekao 03/26", "Obavezni odmor — radio prošlu noć", "Van sezone za ovu ulogu", "Nema slobodnog motocikla"). The roster UI greys out ineligible officers and shows the reason on hover/tap.
3. **The K02 crisis flow works end-to-end:** mark officer as left-sick → patrol turns red "NEPOTPUNA" → ranked replacement suggestions (foot patrols first, eligibility-filtered) → one click reassigns → toast simulating push notification → entry appears in shift log.
4. **The cross-role loop works:** leave request submitted as Softić (P02) appears in K03 queue; approving it updates P01/P02 state. Same for overtime accept and court-summons hour crediting flowing into the P04 payslip mock.
5. **Map units move.** Pre-recorded polylines along real Sarajevo streets (hardcode 8 plausible routes; approximate coordinates are fine), interpolated positions on a timer. One unit is scripted to become non-responsive to drive the D01 escalation flow.
6. **Deterministic seed.** Same world every deploy. Bosnian names, realistic ranks, performance numbers correlated with operational role (interventna high interventions, bicycle patrol low). Include the planted problems listed in the seed spec.
7. **Responsive:** officer screens designed mobile-first (≤430px primary), command screens desktop-first but usable on tablet. Test both.
8. **Bosnian everywhere** in UI. No English leaks in labels, toasts, empty states, or chart axes.

## Access gate (server)

- `POST /api/auth { key }` → compare against `ACCESS_KEYS` env (comma-separated `label:key` pairs, e.g. `demo:DEMO-2026,interno:DEV-1234`) → on success set httpOnly cookie (7d), return label
- All non-`/api` routes serve SPA only if cookie valid; otherwise the SPA shows the gate screen (server can simply always serve SPA and expose `GET /api/session`; SPA decides — simpler and fine here)
- Rate limit: 5 failed attempts per IP → 429 for 15 min (in-memory map is fine)
- Never ship keys in client bundle

## Visual direction

Read the frontend-design skill if available. Beyond that: this must NOT look like a default Tailwind admin template. Direction: "operativni centar" — dark-capable but default light; a disciplined navy/steel palette with one signal color (red reserved exclusively for alarms like NEPOTPUNA and expired certs, so alarms feel like alarms); generous data density on command screens, calm and spacious on officer mobile screens; Bosnian typography-friendly font (Inter or IBM Plex Sans); consistent StatusBadge language across the whole app. Loading states, empty states, and transitions are part of the deliverable — the demo's credibility lives there.

## Build order (work in phases; each phase must run end-to-end before the next)

1. **Phase 1 — Skeleton + world:** project setup, types, seed generator, RoleContext, routing, E00a + E00. Acceptance: can enter key, pick any role, see placeholder scoped to correct org node.
2. **Phase 2 — Officer core:** P01, P02, P03 (P04/P05 static shells). Acceptance: officer flow demo-able on a phone.
3. **Phase 3 — Roster engine:** eligibility.ts + K01 with warnings/alarms. Acceptance: both K01 demo moments reproducible.
4. **Phase 4 — Live board + approvals:** K02 crisis flow, K03 with cross-role loop to P01/P02. Acceptance: full "zahtjev" round-trip and crisis scenario work.
5. **Phase 5 — Dashboards:** N01 (as reusable OrgScopedDashboard), C01, M01 (+ PDF export via print stylesheet), N02, N03, N04. Acceptance: načelnik-switch isolation demo works flawlessly.
6. **Phase 6 — Map:** D01 with moving units + non-responsive flow.
7. **Phase 7 — Config + mockups:** N05, P04, P05 polish, X01, X02, X03.
8. **Phase 8 — Polish pass:** transitions, empty/loading states, mobile QA, Bosnian copy review, favicon/meta, remove any English strings.

## Deployment (DigitalOcean)

- Single Dockerfile: build Vite app, run Express serving `dist/` + API. Alternatively DO App Platform (Node service) — either is fine; prefer whatever matches the owner's existing DO plan. Expose `PORT` env.
- Env: `ACCESS_KEYS`, `PORT`, `SESSION_SECRET`
- HTTPS via DO/App Platform or a Let's Encrypt-terminating proxy if on a droplet (Caddy is the simplest: 5-line Caddyfile, auto-TLS for the custom domain)
- `robots.txt`: `Disallow: /` (no indexing of the demo)
- Health endpoint `GET /healthz`

## What NOT to build

- No real auth (AD/LDAP), no database, no real integrations (TETRA, finance, CAD) — UI flows only
- No native apps; responsive web only
- No data above INTERNO classification concept — X02 is a static illustration
- Do not invent extra modules beyond this spec; polish beats surface area

## Definition of done

The 20-minute demo script (dramaturgija section above) can be executed start-to-finish on the hosted URL with zero errors, on a phone (officer part) and a laptop (command part), by a presenter following this document only.
