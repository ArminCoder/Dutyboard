import { Calendar, ArrowUpRight, Wrench } from 'lucide-react';
import { world } from '../../data/world';
import { useSoftić } from './useOfficer';

const HISTORY = [
  { yearMonth: '2026-08', net: 1811 },
  { yearMonth: '2026-07', net: 1774 },
  { yearMonth: '2026-06', net: 1802 },
  { yearMonth: '2026-05', net: 1758 },
  { yearMonth: '2026-04', net: 1791 },
];

const MONTHS_BS = ['januar', 'februar', 'mart', 'april', 'maj', 'juni', 'juli', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar'];

export function P04Plata() {
  const officer = useSoftić();
  const payslip = world.payslips.find((p) => p.officerId === officer.id);

  return (
    <div className="space-y-4 p-4">
      <div>
        <div className="text-xs uppercase tracking-wider text-ink-400">Platna lista</div>
        <h1 className="mt-0.5 text-xl font-semibold text-ink-900">Moja plata</h1>
      </div>

      <div className="flex items-center gap-2 rounded-md border border-signal-warn/20 bg-signal-warn/10 px-3 py-2 text-xs text-signal-warn">
        <Wrench className="h-3.5 w-3.5" />
        Integracija sa sistemom obračuna u razvoju — prikazani iznosi su mockup.
      </div>

      {payslip ? (
        <section className="rounded-2xl bg-gradient-to-br from-ink-900 to-ink-700 p-5 text-white shadow-lg">
          <div className="text-xs uppercase tracking-wider text-ink-200">
            {formatMonth(payslip.yearMonth)}
          </div>
          <div className="mt-1 text-3xl font-semibold tracking-tight">
            {payslip.net.toLocaleString('bs-BA')} KM
          </div>
          <div className="mt-0.5 text-xs text-ink-200">neto isplata</div>

          <ul className="mt-4 space-y-1.5 border-t border-white/10 pt-3 text-sm">
            {payslip.lines.map((l) => (
              <li key={l.label} className="flex items-center justify-between">
                <span className="text-ink-100">{l.label}</span>
                <span className="font-medium">{l.amount.toLocaleString('bs-BA')} KM</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-ink-100">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-900">
          <Calendar className="h-4 w-4 text-ink-500" />
          Kalendar isplata
        </h2>
        <ul className="divide-y divide-ink-100">
          {HISTORY.map((h) => (
            <li key={h.yearMonth} className="flex items-center justify-between py-2.5">
              <div>
                <div className="text-sm font-medium text-ink-900">{formatMonth(h.yearMonth)}</div>
                <div className="text-xs text-ink-500">isplaćeno 05.{h.yearMonth.slice(5, 7)}.{h.yearMonth.slice(0, 4)}.</div>
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-ink-800">
                {h.net.toLocaleString('bs-BA')} KM
                <ArrowUpRight className="h-3.5 w-3.5 text-ink-300" />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function formatMonth(ym: string): string {
  const [y, m] = ym.split('-');
  return `${MONTHS_BS[Number(m) - 1]} ${y}.`;
}
