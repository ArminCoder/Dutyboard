# Dutyboard

A role-based workforce management demo for a police organisation: shift rosters, approvals,
overtime control, patrol maps, daily event logs, readiness and budget dashboards, and a public
portal where citizens request documents.

All data is fictional and generated deterministically. The organisation name, short name and
region come from environment config (see `.env.example`), so the same build can be shown to any
organisation. The UI is in Bosnian; code, comments and docs are in English.

## What it does

Nine roles, each with its own screens, and data scoping that is real, not cosmetic. Switching
from one police district to another shows completely different people, shifts and numbers.

| Role | Main screens |
|---|---|
| Officer | My shift, requests, stats, pay, reports, training and knowledge tests |
| Shift lead | Active shift, events log, patrol map, end-of-shift bulletin |
| Station commander | Monthly roster (generate draft, publish, notify), approvals, overtime, people, equipment |
| Dispatch centre | Canton-wide map with sectors, shift bulletins, morning briefing |
| District chief | District-level views of the same data |
| Commissioner | Compstat, readiness index, overtime control, staffing projection |
| Minister | Strategic board, simulation, budget (including own revenue), resources |
| Administration | Citizen document requests: received, in progress, ready, collected |
| Citizen portal | Public: register, request a document, track its status |

There is also a hidden white-label settings screen (name, colours, logo).

## Stack

React 19, Vite, TypeScript, Tailwind v4, react-router, Recharts, Leaflet (OpenStreetMap), and a
small Express server that serves the build and checks an access key. No database: changes made
during a session live in memory and reset on reload, which is what a demo needs.

## Run it

```bash
cp .env.example .env    # optional, defaults are fictional
npm install
npm run dev             # client + server
npm run build           # type-check and build to dist/
npm run start           # production server (needs ACCESS_KEYS)
```

The dev access key is `DEMO-2026` unless `ACCESS_KEYS` is set.

## How this was built

I built this with an AI coding agent (Claude Code), and I want to be clear about the split.

- **My part:** the product. I have worked with police processes, so I wrote the specification
  ([docs/demo-spec.md](docs/demo-spec.md)) and the agent rules ([CLAUDE.md](CLAUDE.md)), decided
  the roles, who approves what, and what each role may see. I ran and reviewed every screen and
  sent back corrections when something did not match how the work is really done.
- **The agent's part:** most of the code, written to that spec and those rules. Commits it helped
  with carry a `Co-Authored-By` line, so the history shows this honestly.

Two examples of review changing the result:

- The first version gave the shift lead the roster and leave approvals. In real stations the
  station commander owns those. I moved scheduling, approvals and overtime to the commander role
  and rewrote the approval chains (see [docs/STATUS.md](docs/STATUS.md), section 3).
- The main bundle had grown to 1016 kB because charts loaded on every page. Lazy loading and
  manual chunks brought it down to 236 kB (51 kB gzipped).

[docs/STATUS.md](docs/STATUS.md) is the running build log.
