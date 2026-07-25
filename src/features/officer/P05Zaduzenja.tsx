import { AlertTriangle, ShieldCheck, Radio, Car, Backpack } from 'lucide-react';
import { world } from '../../data/world';
import { useSoftić } from './useOfficer';
import { formatBs } from '../../data/generator/dates';

// Za Phase 2: statična oprema — Softićev inventar. Kasnije faze povezuju sa vozilima/opremom u worldu.
const SOFTIC_EQUIPMENT = [
  { type: 'oruzje', label: 'Službeno oružje', identifier: 'Glock 17 · s/n G-77241' },
  { type: 'znacka', label: 'Značka', identifier: 'B-4118' },
  { type: 'radio', label: 'Radio-stanica', identifier: 'Motorola R7 · #A-311-04' },
  { type: 'uniforma', label: 'Uniforma (2 kompleta)', identifier: 'zimska + ljetna' },
  { type: 'vozilo', label: 'Vozilo (na smjeni)', identifier: 'A-311-K-121 · Škoda Octavia' },
] as const;

export function P05Zaduzenja() {
  const officer = useSoftić();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4 p-4">
      <div>
        <div className="text-xs uppercase tracking-wider text-ink-400">Oprema i certifikati</div>
        <h1 className="mt-0.5 text-xl font-heading font-medium text-ink-800">Moja zaduženja</h1>
      </div>

      <section className=" bg-paper-0 p-4 border border-paper-200">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-heading font-medium text-ink-800">
          <Backpack className="h-4 w-4 text-ink-500" />
          Zadužena oprema
        </h2>
        <ul className="divide-y divide-paper-200">
          {SOFTIC_EQUIPMENT.map((e) => (
            <li key={e.type} className="flex items-center gap-3 py-2.5">
              <span className="flex h-8 w-8 items-center justify-center  bg-paper-100 text-ink-700">
                {e.type === 'radio' ? <Radio className="h-4 w-4" /> : e.type === 'vozilo' ? <Car className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-ink-800">{e.label}</div>
                <div className="text-xs text-ink-500">{e.identifier}</div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className=" bg-paper-0 p-4 border border-paper-200">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-heading font-medium text-ink-800">
          <ShieldCheck className="h-4 w-4 text-ink-500" />
          Certifikati
        </h2>
        <ul className="divide-y divide-paper-200">
          {officer.certifications.map((c) => {
            const cert = world.certifications.find((x) => x.id === c.certId)!;
            const days = daysBetween(today, c.expires);
            const expired = days < 0;
            const warn = !expired && days <= 30;
            return (
              <li key={c.certId} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-ink-800">{cert.name}</div>
                  <div className="text-xs text-ink-500">važi do {formatBs(c.expires)}</div>
                </div>
                {expired ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-signal-alarm/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-signal-alarm">
                    <AlertTriangle className="h-3 w-3" />
                    istekao
                  </span>
                ) : warn ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-signal-warn/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-signal-warn">
                    <AlertTriangle className="h-3 w-3" />
                    {days} d
                  </span>
                ) : (
                  <span className="text-[11px] text-ink-400">{days} d</span>
                )}
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs text-ink-500">
          Nakon isteka nećeš biti raspoređivan na uloge koje ga zahtijevaju.
        </p>
      </section>
    </div>
  );
}

function daysBetween(fromISO: string, toISO: string): number {
  const a = new Date(fromISO);
  const b = new Date(toISO);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}
