# FEATURE BACKLOG — "Smjena" / Dutyboard

> Living, product-benchmarked feature catalog for every role, optimized to wow ministry decision-makers
> in the ~20-min demo. Source: feature-research pass (all roles). Companion to [STATUS.md](STATUS.md)
> and the [spec](demo-spec.md). **Keep updated** as features ship (mark ✅ / link the screen).
>
> Positioning: **demo-first, wow-focused** · fake deterministic data · Bosnian UI · top-level screens
> **aggregate-only / no names** with drill-down. Cost legend: **S** = hours/reuse · **M** = one screen +
> modest generator data · **L** = new role/subsystem + real generator work.

## Grounding levers (why this is cheap)
- Scoping (`useScopedWorld`) works → any dashboard through it inherits airtight isolation for free.
- **3 data gaps block half the exec wow, all cheap:** (1) `performance.ts` anchors to real `new Date()`
  not `DEMO_TODAY` → exec charts half-empty; (2) `Officer` has no `hireDate`/`birthDate` → M01 hardcodes
  staž/pension/`sistematizacija=220`; (3) `equipmentAssigned` always `[]`. Fix → workforce planning,
  Compstat trends, minister numbers all unlock.
- Reuse: `Kpi`, `Card`, `StatusBadge`, `PageHeader`, `chartTheme.ts`, print stylesheet, `ChiefShell`,
  store mutation pattern, `eligibility.ts` (already encodes rest rules).

---

## BUILD-NEXT — first 15, ranked by (wow × low-cost)

| # | Feature | Role | Cost | Why first |
|---|---|---|---|---|
| 1 | Seed fix: performance anchored to `DEMO_TODAY` + 24-mo history | seed | S | Fills every exec chart; prerequisite. |
| 2 | Seed: `hireDate`/`birthDate` + `establishment` counts | seed | S | Kills M01 hardcodes; unlocks workforce planning. |
| 3 | ✅ **Simulacija „+20 policajaca"** | ministar | M | Minister deciding on your screen = the close. **DONE** (`M02Simulacija.tsx`). |
| 4 | **Operativni pregled (Compstat)** | komesar | M | Definitive command-accountability artifact + drill-down. |
| 5 | **Usklađenost radnog vremena** | komesar | M | EU legal-risk + wellbeing in one number. |
| 6 | **Budžet i troškovi ljudstva** | ministar | M | The money argument for the Vlada. |
| 7 | **Kontrola prekovremenih (trošak + pravednost)** | komesar | M | Cost + anti-favoritism, handled safely. |
| 8 | **Indeks spremnosti** | komesar | S | One defensible composite number, drills to detail. |
| 9 | **Brifing za sjednicu (auto-brief PDF)** | ministar | S | "Parliamentary answer in 10 seconds." |
| 10 | **Mapa popunjenosti Kantona (choropleth)** | komesar | M | Geospatial gravitas (Leaflet already in stack). |
| 11 | **Kadrovska projekcija** | komesar | M | Retirement cliff + pyramid (unlocked by #2). |
| 12 | **Rano prepoznavanje (early intervention)** | načelnik | M | Snapshot→trend duty-of-care beat. |
| 13 | **Održivost ljudstva (sustainability index)** | ministar | S | Reframes the pitch as workforce sustainability. |
| 14 | **Zaštita odmora + Primopredaja smjene** | šef smjene | M | Makes command screens feel operationally real. |
| 15 | **Interna kontrola (aggregate first)** | new role | L→stage | Integrity/public-trust maturity. |

---

## Per-role catalog

### Policajac (officer, mobile) — existing P01–P05
| Feature (bs) | Description | Why it wows | Borrows from | Cost | Reuses | New data |
|---|---|---|---|---|---|---|
| **Zamjena smjene** | Officer proposes swap; qualified peer accepts; commander one-tap approves; roster updates. | Modern self-service, chain stays in control. | Deputy, When-I-Work | M | store mutation, eligibility.ts, P02 approval UI | `ShiftSwap` type |
| **Moja dostupnost** | Mark preferred/blocked days feeding roster as soft constraints. | Fairness/morale; roster isn't arbitrary. | Deputy | S | P02 forms, P01 calendar cells | `availabilityPrefs[]` |
| **Instrukcije za upoznavanje** | Read-and-acknowledge policy feed with deadline + stamp. | Auditable training compliance. | PowerDMS | S | Notification feed, store | `PolicyDoc` + `acknowledgedAt` |
| **Kako si? (dobrovoljni check-in)** | Optional 3-tap wellbeing pulse; only aggregate reaches command. | Wellbeing as support not surveillance. | First Sign, Guardian | S | Officer shell, StatusBadge | anon `wellnessPulse` |
| **Digitalna značka** | Clean credential card: rank, unit, valid certs, clearance. | Tangible "real product" moment on phone. | Axon/Mark43 | S | existing officer fields | none |
| **Termini obuke i gađanja** | Book cert-renewal/range slots before expiry; ties to P05 red warnings. | Closes cert-expiry loop (warns AND books). | PowerDMS, InTime | S | P05 logic, P02 form | `TrainingSlot` |

### Šef smjene / Komandir (desktop) — existing K01–K03
| Feature (bs) | Description | Why it wows | Borrows from | Cost | Reuses | New data |
|---|---|---|---|---|---|---|
| **Primopredaja smjene** | Start-of-shift briefing/pass-down: BOLOs, standing orders, prior-shift log, personnel changes → printable. | The daily ritual command staff recognize as "real ops." | Motorola CommandCentral, Mark43 | M | `shiftLog`, K02 cards | `BriefingItem[]` |
| **Zaštita odmora (fatigue guard)** | Flags officers approaching EU rest-period breach *before* assignment. | EU Working Time Directive compliance = legal + wellbeing. | UKG/Kronos, InTime | M | eligibility.ts rest rule, K01 grid | `restRules`, recent-hours rollup |
| **Popunjenost — prognoza (7 dana)** | Forward coverage forecast per role/shift; gaps amber, breaches red. | Proactive: "we see Thursday's hole on Monday." | InTime min-staffing | M | roster (all-PS), Kpi | full rosters all PS |
| **Ovjera sati (timesheet)** | Approve monthly hours incl. auto-fed court/overtime → payslip. | Closes the sud→obračun loop; kills paper. | UKG/Kronos, InTime | M | CourtSummons + PerformanceMonth + payslip | `Timesheet` rollup |
| **Ravnomjernost prekovremenih** | Per-officer OT-distribution ledger + fairness indicator. | Anti-favoritism transparency. | InTime equity | S | K03 offerLog, performance | none (derive) |

### Dežurni operativac (dispatch) — existing D01
| Feature (bs) | Description | Why it wows | Borrows from | Cost | Reuses | New data |
|---|---|---|---|---|---|---|
| **Statusna tabla jedinica** | Side-panel: every unit's status/composition/last-contact, sortable, coverage-gap banner. | Command-center gravitas paired with the map. | Motorola CommandCentral | S | D01 units, store activePatrols, StatusBadge | none |
| **Dnevnik događaja (CAD-lite)** | Log incident, assign nearest unit, auto-timeline, close-out. No PII. | Reaches into live ops without surveillance. | CentralSquare, Mark43 CAD | L | D01 map, store pattern | `IncidentEvent` |
| **Sigurnosni alarm (duress)** | Extends "ne javlja se" into full officer-safety escalation ladder + map pin + ack log. | "Safety, not surveillance" dramatized. | Motorola, Samsara | S | D01 non-responsive flow | escalation states |
| **Raspoloživost snaga** | Real-time "deployable now" count by role across the PU. | One-glance readiness to act on. | Motorola, ArcGIS | S | scoped officers + patrols | none |

### Načelnik PU — existing N01–N05
| Feature (bs) | Description | Why it wows | Borrows from | Cost | Reuses | New data |
|---|---|---|---|---|---|---|
| **Rano prepoznavanje** | Supportive watchlist: workload/sick/incident thresholds → "za razgovor", with positive markers too. | Duty-of-care model, European-safe; extends N03 to trends. | Benchmark, First Sign, Guardian | M | N03 index (extract `domain/workload.ts`) | 24-mo history, incident counts |
| **Sistematizacija vs stanje** | Establishment vs actual per PS/role: vacancies, over/under, fill %. | Vacancy mgmt = budget & recruitment justification. | UKG, ArcGIS | M | N01 KPIs, org tree | `establishment` per node |
| **Pregled stanica** | Compstat-lite side-by-side of PU stations + period-over-period arrows. | The weekly accountability-meeting artifact. | Compstat | M | N02, C01 card pattern | 24-mo history |
| **Integritet i pritužbe (PU nivo)** | Aggregate complaints/use-of-force + resolution; drill to PS counts, never a name. | Internal-control maturity, carefully aggregate. | IAPro/BlueTeam, Benchmark | M | scoping, StatusBadge | aggregate complaints/UoF |
| **Rokovi zahtjeva (SLA)** | Aging view of open leave/transfer vs target turnaround. | "Nothing rots in an inbox." | ServiceNow, InTime | S | store.leaveRequests, N01 | request timestamps (exist) |

### Komesar (commissioner) — TOP PRIORITY — existing C01
| Feature (bs) | Description | Why it wows | Borrows from | Cost | Reuses | New data |
|---|---|---|---|---|---|---|
| **Operativni pregled (Compstat)** | All PUs ranked on coverage/OT/sick/output + period-over-period arrows + "objašnjenje" drill-down. | Most recognizable command-accountability artifact; komesar commands the whole Kanton from one screen. | Compstat/NYPD | M | C01 cards, `descendantsOf`, 24-mo history | period-over-period, KPI targets |
| **Usklađenost radnog vremena** | Kanton-wide EU rest/working-time compliance %, breach hotspots, trend. Red only for real breaches. | Legal-risk shield + wellbeing in a ministry's language. | UKG, InTime, EU WTD | M | eligibility rest logic, Kpi, choropleth | `restRules`, recent-hours, all-PS rosters |
| **Kontrola prekovremenih** | OT KM cost per PU vs budget + distribution-fairness (concentration in few officers). | Money AND fairness — political heat, controlled. | UKG/Kronos, InTime | M | C01 prekov agg, chartTheme | budget lines, OT rate |
| **Mapa popunjenosti Kantona** | Choropleth of Sarajevo by PU on live coverage %, click-through PU→PS→shift. | Situational clarity; geospatial = serious system. | Esri/ArcGIS | M | Leaflet, scoping | PU boundary polygons |
| **Indeks spremnosti** | Composite score per PU (staffing×fleet×certs×workload), ranked + driver. | One defensible number that still drills down. | Exec BI, Compstat | S | N01/N04/N03 aggregations | none (derived) |
| **Kadrovska projekcija** | Retirement cliff (24 mo), age/seniority pyramid, hiring-need per PU. | "Who's leaving and can we replace them." | UKG workforce planning | M | M01 pattern, Recharts | hireDate/birthDate |
| **Usklađenost obuke i certifikata** | Kanton-wide cert/training validity %, upcoming expiries, per-PU readiness. | Readiness + liability. | PowerDMS | S | certifications[], N01 alerts | training catalog (opt) |

### Ministar (minister) — TOP PRIORITY — existing M01
| Feature (bs) | Description | Why it wows | Borrows from | Cost | Reuses | New data |
|---|---|---|---|---|---|---|
| **Simulacija „+20 policajaca"** | Slider/what-if: change headcount or OT budget → coverage %, OT cost, burnout recompute live. Aggregate-only. | Interactive decision-support — minister deciding on your screen is the close. | UKG scenario, ArcGIS what-if | M | M01 math, Kpi | establishment, cost rates, targets |
| **Budžet i troškovi ljudstva** | Personnel & OT cost trend (KM), cost-per-PU, per-capita, projected savings. Board-ready. | The Vlada speaks money; this is the funding argument. | UKG/Kronos | M | M01 PDF, chartTheme | budget lines, cost rates |
| **Održivost ljudstva** | Single index: burnout %, sick %, retirement cliff, staffing gap. | Reframes workforce as sustainability/duty-of-care. | Benchmark, UKG | S | N03 workload, M01 layout | 24-mo history, dates |
| **Javna sigurnost — pokazatelji** | Aggregate outcome KPIs vs targets as gauges; strictly no names. | Answers "how safe is the Kanton" in the minister's vocabulary. | Compstat outcomes, Esri | M | performance agg, Recharts | KPI targets |
| **Brifing za sjednicu** | One-page generated narrative brief + charts → PDF for a government session. | "Parliamentary-question answer in 10 seconds." | Exec BI narratives | S | M01 print stylesheet | none (assembles aggregates) |

### New roles worth adding
| Role (bs) | Key screens | Why | Borrows from | Cost | New data |
|---|---|---|---|---|---|
| **Interna kontrola / Profesionalni standardi** | Predmeti, Rano prepoznavanje, Pregled upotrebe sile | Integrity & public-trust maturity; feeds komesar/načelnik aggregates behind clearance; reinforces X02/X03. | IAPro/BlueTeam, Benchmark, Guardian | L | `IntegrityCase`, `UseOfForceReport` (aggregate-safe), EI thresholds |
| **Kadrovska / HR** | Sistematizacija, Regrutacija, Odsustva, Penzionisanje | Turns hire/birth-date seed into a role: vacancy mgmt, recruitment pipeline, org-wide leave, retirement. | UKG/Kronos, SAP SuccessFactors | M | establishment, dates, leave balances, recruitment stages |
| **Obuka / Akademija** | Katalog obuka, Usklađenost certifikata, Raspored gađanja | Owns cert/training compliance end-to-end (feeds P05, komesar readiness, minister compliance). Cheap — cert data exists. | PowerDMS, InTime | M | `TrainingCourse`, `TrainingRecord`, range schedule |
| *(opt)* **Logistika / Materijalno** | Vozni park (Kanton), Održavanje, Nabavke | Elevates N04 into fleet-telematics utilization/maintenance + procurement justification. | Samsara, Geotab | M | vehicle utilization/mileage, service history |

---

## Seed-enrichment spec (generator/types additions, by unlock value)

**Officer** (`types.ts` + `officers.ts`): `hireDate`, `birthDate` (realistic pyramid) → staž/age/retirement;
populate `equipmentAssigned[]` (weapon serial, radio, badge, uniforms, vehicle link); `wellnessPulse?`
(aggregate), `availabilityPrefs?` (in-store).
**Establishment/org** (`org.ts` + `types.ts`): `establishment` per PU/PS/role; approx. **PU boundary
polygons** (hardcoded rings, like D01 route polylines).
**Performance** (`performance.ts`): anchor to `DEMO_TODAY`, generate **24 months**; add real dated
sick-leave pon/pet events for 4–5 officers (N03 currently fakes the heatmap).
**New world collections** (scope via `useScopedWorld`): `leaveRequests[]` + `notifications[]` world-wide
(today only Softić in store); full-month rosters for **all four PS**; `IncidentEvent[]` timeline; aggregate
`complaints`/`useOfForce` per PS.
**Finance/targets/rules** (new `finance.ts`/`targets.ts`): `overtimeRateKM`, `budgetLines` per PU;
`kpiTargets` (coverage %, OT ceiling, sick %, cert validity); `restRules` (max consecutive nights, min rest).
**Vehicle**: add `mileage`/`utilization` + small `serviceHistory[]`.

## Demo-narrative upgrade
After the načelnik isolation moment, land the komesar on **Operativni pregled (Compstat) + Usklađenost
radnog vremena** ("from the Kanton to a single shift in three clicks — every officer within legal rest
limits"). Close on the minister dragging the **Simulacija „+20 policajaca"** slider (OT cost falls, coverage
rises) and exporting the **Brifing za sjednicu** — a decision-maker making a decision on your product, zero
personal data on screen.
