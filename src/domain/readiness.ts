import type { OrgNode, World } from '../data/types';
import { descendantsOf } from '../data/generator/org';
import { unitStat } from './unitStats';
import { workTimeStat } from './workTime';

/**
 * Indeks spremnosti — jedan branjiv broj po jedinici, sastavljen od četiri
 * mjerljiva izvora. Namjerno je objašnjiv: uz ocjenu ide i doprinos svake
 * komponente, da komesar može reći ZAŠTO je neka uprava niže rangirana.
 */

export interface ReadinessDriver {
  key: 'popunjenost' | 'certifikati' | 'vozila' | 'opterecenje';
  label: string;
  /** Vrijednost komponente 0–100 (veće = bolje). */
  value: number;
  weight: number;
  display: string;
}

export interface ReadinessScore {
  node: OrgNode;
  score: number;
  drivers: ReadinessDriver[];
}

const WEIGHTS = { popunjenost: 0.4, certifikati: 0.25, vozila: 0.2, opterecenje: 0.15 };

/** Ciljevi po komponenti — jedinica koja dostiže cilj nosi 100 bodova. */
const FLEET_TARGET = 90;
const COMPLIANCE_TARGET = 95;

/** Bodovanje prema cilju: svaki postotni poen ispod cilja košta dva boda,
 *  pa se razlike među jedinicama vide umjesto da se izgube u zaokruživanju. */
function scoreAgainst(actual: number, target: number): number {
  const gap = Math.max(0, target - actual);
  return Math.max(0, Math.min(100, 100 - gap * 2));
}

export function readinessIndex(w: World, nodeId: string): ReadinessScore {
  const stat = unitStat(w, nodeId);
  const wt = workTimeStat(w, nodeId);

  const inScope = descendantsOf(w.orgNodes, nodeId);
  const vehicles = w.vehicles.filter((v) => inScope.has(v.psId));
  const okVehicles = vehicles.filter((v) => v.status === 'ispravno').length;

  const drivers: ReadinessDriver[] = [
    {
      key: 'popunjenost',
      label: 'Popunjenost',
      value: scoreAgainst(stat.coveragePct, w.targets.coveragePct),
      weight: WEIGHTS.popunjenost,
      display: `${stat.coveragePct}%`,
    },
    {
      key: 'certifikati',
      label: 'Važeći certifikati',
      value: scoreAgainst(stat.certValidPct, w.targets.certValidityPct),
      weight: WEIGHTS.certifikati,
      display: `${stat.certValidPct}%`,
    },
    // Jedinica bez voznog parka (npr. posebna jedinica) ne dobija besplatnih 100 bodova —
    // komponenta se izostavlja, a težine se preraspodijele.
    ...(vehicles.length > 0
      ? [
          {
            key: 'vozila' as const,
            label: 'Ispravna vozila',
            value: scoreAgainst(Math.round((okVehicles / vehicles.length) * 100), FLEET_TARGET),
            weight: WEIGHTS.vozila,
            display: `${okVehicles}/${vehicles.length}`,
          },
        ]
      : []),
    {
      key: 'opterecenje',
      label: 'Usklađenost opterećenja',
      value: scoreAgainst(wt.compliancePct, COMPLIANCE_TARGET),
      weight: WEIGHTS.opterecenje,
      display: `${wt.compliancePct}%`,
    },
  ];

  const totalWeight = drivers.reduce((s, d) => s + d.weight, 0);
  const score = Math.round(drivers.reduce((s, d) => s + d.value * d.weight, 0) / totalWeight);
  return { node: stat.node, score, drivers };
}

export function readinessBand(score: number): { label: string; tone: 'ok' | 'warn' | 'alarm' } {
  if (score >= 88) return { label: 'visoka', tone: 'ok' };
  if (score >= 78) return { label: 'zadovoljavajuća', tone: 'warn' };
  return { label: 'niska', tone: 'alarm' };
}
