import { useMemo, useState } from 'react';
import { Calendar, Check, Wrench, ChevronRight } from 'lucide-react';
import { world } from '../../data/world';
import { isCurrentPayslip } from '../../data/generator/payslip';
import { useSoftić } from './useOfficer';

const MONTHS_BS = ['januar', 'februar', 'mart', 'april', 'maj', 'juni', 'juli', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar'];

export function P04Plata() {
  const officer = useSoftić();

  const slips = useMemo(
    () =>
      world.payslips
        .filter((p) => p.officerId === officer.id)
        .sort((a, b) => b.yearMonth.localeCompare(a.yearMonth)),
    [officer.id],
  );

  const [selectedYm, setSelectedYm] = useState(slips[0]?.yearMonth ?? '');
  const payslip = slips.find((p) => p.yearMonth === selectedYm) ?? slips[0];
  const jeTekuci = payslip ? isCurrentPayslip(payslip.yearMonth) : false;

  return (
    <div className="space-y-4 p-4">
      <div>
        <div className="text-xs uppercase tracking-wider text-ink-400">Platna lista</div>
        <h1 className="mt-0.5 text-xl font-heading font-medium text-ink-800">Moja plata</h1>
      </div>

      <div className="flex items-center gap-2 border border-signal-warn/20 bg-signal-warn/10 px-3 py-2 text-xs text-signal-warn">
        <Wrench className="h-3.5 w-3.5" />
        Integracija sa sistemom obračuna u razvoju — prikazani iznosi su mockup.
      </div>

      {payslip ? (
        <section className="bg-gradient-to-br from-navy-900 to-navy-700 p-5 text-paper-50">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-wider text-ink-200">
              {formatMonth(payslip.yearMonth)}
            </div>
            {jeTekuci ? (
              <span className="border border-brass-300/40 bg-brass-500/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-brass-100">
                u toku
              </span>
            ) : null}
          </div>
          <div className="mt-1 text-3xl font-semibold tracking-tight">
            {payslip.net.toLocaleString('bs-BA')} KM
          </div>
          <div className="mt-0.5 text-xs text-ink-200">
            {jeTekuci ? 'procjena — obračun još nije zaključen' : 'neto isplata'}
          </div>

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

      <section className="border border-paper-200 bg-paper-0 p-4">
        <h2 className="mb-1 flex items-center gap-2 text-sm font-heading font-medium text-ink-800">
          <Calendar className="h-4 w-4 text-ink-500" />
          Kalendar isplata
        </h2>
        <p className="mb-2 text-[11px] text-ink-400">Odaberi mjesec za prikaz platne liste.</p>
        <ul className="divide-y divide-paper-200">
          {slips.map((s) => {
            const aktivan = s.yearMonth === payslip?.yearMonth;
            const tekuci = isCurrentPayslip(s.yearMonth);
            return (
              <li key={s.yearMonth}>
                <button
                  onClick={() => setSelectedYm(s.yearMonth)}
                  className={`flex w-full items-center justify-between py-2.5 text-left transition ${
                    aktivan ? 'bg-paper-100' : 'hover:bg-paper-50'
                  }`}
                >
                  <div className="pl-2">
                    <div className="text-sm font-medium text-ink-800">{formatMonth(s.yearMonth)}</div>
                    <div className="text-xs text-ink-500">
                      {tekuci
                        ? 'tekući obračun'
                        : `isplaćeno 05.${nextMonth(s.yearMonth)}.${s.yearMonth.slice(0, 4)}.`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pr-2 text-sm font-semibold text-ink-800">
                    {s.net.toLocaleString('bs-BA')} KM
                    {aktivan ? (
                      <Check className="h-3.5 w-3.5 text-brass-600" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-paper-400" />
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function formatMonth(ym: string): string {
  const [y, m] = ym.split('-');
  return `${MONTHS_BS[Number(m) - 1]} ${y}.`;
}

/** Plata se isplaćuje početkom narednog mjeseca. */
function nextMonth(ym: string): string {
  const m = Number(ym.slice(5, 7)) + 1;
  return String(m > 12 ? 1 : m).padStart(2, '0');
}
