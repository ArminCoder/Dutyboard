import { useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Plus, MapPin, Clock, CheckCircle2, CreditCard } from 'lucide-react';
import { useCitizen, useOptionalCitizen } from '../../app/CitizenContext';
import { useStore } from '../../app/store';
import { DOC_TYPES, findDocType } from '../../data/administration';
import { DOC_REQUEST_STATUS_LABEL } from '../../data/types';
import { formatBs } from '../../data/generator/dates';
import { Button } from '../../components/Button';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import { DOC_STATUS_TONE, iconForKind, km } from './docUi';

export function PortalHome() {
  const maybe = useOptionalCitizen();
  if (!maybe) return <Navigate to="/portal/prijava" replace />;
  return <PortalHomeInner />;
}

function PortalHomeInner() {
  const citizen = useCitizen();
  const { documentRequests } = useStore();

  const mine = useMemo(
    () =>
      documentRequests
        .filter((r) => r.citizenId === citizen.jmb)
        .sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1)),
    [documentRequests, citizen.jmb],
  );

  const active = mine.filter((r) => r.status !== 'preuzet' && r.status !== 'odbijen').length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl text-ink-800">Dobrodošli, {citizen.name.split(' ')[0]}</h1>
          <p className="mt-1 text-sm text-ink-500">
            {active > 0 ? `${active} zahtjev${active === 1 ? '' : 'a'} u toku.` : 'Nemate zahtjeva u toku.'}
          </p>
        </div>
        <Link to="/portal/novi">
          <Button variant="primary" icon={<Plus className="h-4 w-4" />}>Novi zahtjev</Button>
        </Link>
      </div>

      {mine.length === 0 ? (
        <EmptyState
          title="Još nemate zahtjeva"
          hint="Podnesite zahtjev za lični dokument ili uvjerenje — pratite status i mjesto preuzimanja ovdje."
          right={<Link to="/portal/novi"><Button variant="secondary" icon={<Plus className="h-4 w-4" />}>Podnesi zahtjev</Button></Link>}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {mine.map((r) => {
            const doc = findDocType(r.kind);
            const Icon = iconForKind(r.kind, DOC_TYPES);
            const ready = r.status === 'spreman';
            return (
              <article key={r.id} className="border border-paper-200 bg-paper-0 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-none items-center justify-center bg-navy-900 text-paper-50">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-heading text-base text-ink-800">{doc.title}</h3>
                      <StatusBadge tone={DOC_STATUS_TONE[r.status]} size="sm">{DOC_REQUEST_STATUS_LABEL[r.status]}</StatusBadge>
                    </div>
                    <div className="mt-1 text-xs text-ink-500">
                      Podnesen {formatBs(r.submittedAt.slice(0, 10))} · naknada {km(r.feeKM)}
                      {r.feeKM > 0 ? (
                        <span className={r.paid ? 'text-signal-ok' : 'text-signal-warn'}> · {r.paid ? 'plaćeno' : 'nije plaćeno'}</span>
                      ) : null}
                    </div>

                    {ready ? (
                      <div className="mt-3 flex items-start gap-2 border border-signal-ok/30 bg-signal-ok-soft px-3 py-2 text-xs text-ink-700">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 flex-none text-signal-ok" />
                        <span>Spremno za preuzimanje na lokaciji <span className="font-medium">{r.pickupLocation}</span>. Ponesite ličnu kartu.</span>
                      </div>
                    ) : r.status === 'preuzet' ? (
                      <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-ink-500">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Preuzeto na {r.pickupLocation}
                      </div>
                    ) : r.status === 'odbijen' ? (
                      <div className="mt-2 text-xs text-signal-alarm">Zahtjev je odbijen. Obratite se šalteru za dodatne informacije.</div>
                    ) : (
                      <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-ink-500">
                        <Clock className="h-3.5 w-3.5" /> Očekivano do {r.status === 'podnesen' ? `${doc.processingDays} dana` : 'kraja obrade'} · preuzimanje: {r.pickupLocation}
                      </div>
                    )}

                    {r.feeKM > 0 && !r.paid && r.status !== 'odbijen' ? (
                      <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-signal-warn">
                        <CreditCard className="h-3.5 w-3.5" /> Naknada se plaća na šalteru pri preuzimanju.
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
