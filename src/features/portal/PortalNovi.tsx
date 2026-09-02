import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, FileText, MapPin } from 'lucide-react';
import { useCitizen, useOptionalCitizen } from '../../app/CitizenContext';
import { useStore } from '../../app/store';
import { DOC_TYPES, DOC_OFFICES, type DocType } from '../../data/administration';
import { Button } from '../../components/Button';
import { DOC_ICON, km } from './docUi';

export function PortalNovi() {
  const maybe = useOptionalCitizen();
  if (!maybe) return <Navigate to="/portal/prijava" replace />;
  return <PortalNoviInner />;
}

function PortalNoviInner() {
  const citizen = useCitizen();
  const { submitDocumentRequest } = useStore();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<DocType | null>(null);
  const [psId, setPsId] = useState(DOC_OFFICES[0].psId);
  const [note, setNote] = useState('');
  const [done, setDone] = useState(false);

  const submit = () => {
    if (!selected) return;
    submitDocumentRequest({ citizenId: citizen.jmb, citizenName: citizen.name, kind: selected.kind, psId, note: note.trim() || undefined });
    setDone(true);
    setTimeout(() => navigate('/portal'), 1400);
  };

  if (done) {
    return (
      <div className="mx-auto max-w-md py-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-signal-ok-soft">
          <Check className="h-7 w-7 text-signal-ok" />
        </div>
        <h1 className="font-heading text-xl text-ink-800">Zahtjev je podnesen</h1>
        <p className="mt-1 text-sm text-ink-500">Status možete pratiti na svojoj početnoj stranici.</p>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => navigate('/portal')} className="mb-4 inline-flex items-center gap-1 text-xs text-ink-500 hover:text-ink-800">
        <ArrowLeft className="h-3.5 w-3.5" /> Nazad
      </button>
      <h1 className="font-heading text-2xl text-ink-800">Novi zahtjev</h1>
      <p className="mt-1 text-sm text-ink-500">Odaberite dokument koji tražite.</p>

      {/* Izbor dokumenta */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {DOC_TYPES.map((d) => {
          const Icon = DOC_ICON[d.icon];
          const active = selected?.kind === d.kind;
          return (
            <button
              key={d.kind}
              onClick={() => setSelected(d)}
              className={`flex items-start gap-3 border p-4 text-left transition ${active ? 'border-navy-700 bg-paper-0 ring-1 ring-navy-700' : 'border-paper-200 bg-paper-0 hover:border-navy-300'}`}
            >
              <div className={`flex h-10 w-10 flex-none items-center justify-center ${active ? 'bg-navy-900 text-paper-50' : 'bg-paper-100 text-ink-600'}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="font-medium text-ink-800">{d.title}</div>
                <div className="mt-0.5 text-xs text-ink-500">{d.description}</div>
                <div className="mt-1.5 text-xs">
                  <span className={d.feeKM > 0 ? 'font-medium text-brass-700' : 'text-signal-ok'}>{km(d.feeKM)}</span>
                  <span className="text-ink-400"> · rok ~{d.processingDays} dana</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Detalji za odabrani dokument */}
      {selected ? (
        <div className="mt-6 border border-paper-200 bg-paper-0 p-5">
          <div className="mb-4 flex items-center gap-2 text-ink-700">
            <FileText className="h-4 w-4" />
            <div className="section-label">Potrebna dokumentacija</div>
          </div>
          <ul className="mb-5 space-y-1.5">
            {selected.requiredDocs.map((rd) => (
              <li key={rd} className="flex items-start gap-2 text-sm text-ink-700">
                <Check className="mt-0.5 h-3.5 w-3.5 flex-none text-signal-ok" /> {rd}
              </li>
            ))}
          </ul>

          <label className="mb-4 block">
            <span className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-ink-500">
              <MapPin className="h-3.5 w-3.5" /> Lokacija preuzimanja
            </span>
            <select
              value={psId}
              onChange={(e) => setPsId(e.target.value)}
              className="w-full border border-paper-300 bg-paper-50 px-3 py-2 text-sm text-ink-800 outline-none focus:border-navy-700"
            >
              {DOC_OFFICES.map((o) => (
                <option key={o.psId} value={o.psId}>{o.name} — {o.address}</option>
              ))}
            </select>
          </label>

          <label className="mb-5 block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-ink-500">Napomena (opcionalno)</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="npr. svrha izdavanja"
              className="w-full resize-none border border-paper-300 bg-paper-50 px-3 py-2 text-sm text-ink-800 outline-none focus:border-navy-700"
            />
          </label>

          <div className="flex items-center justify-between border-t border-paper-200 pt-4">
            <div className="text-sm text-ink-600">
              Naknada: <span className="font-medium text-ink-800">{km(selected.feeKM)}</span>
              {selected.feeKM > 0 ? <span className="text-ink-400"> (plaća se na šalteru)</span> : null}
            </div>
            <Button variant="primary" icon={<Check className="h-4 w-4" />} onClick={submit}>Podnesi zahtjev</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
