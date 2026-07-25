import { useState } from 'react';
import { Plus, X, ShieldCheck, CalendarDays, Package } from 'lucide-react';
import { useScopedWorld } from '../../data/useScopedWorld';
import { world } from '../../data/world';
import { useSession } from '../../app/RoleContext';

interface DraftRole {
  name: string;
  fromMonth: number;
  toMonth: number;
  certIds: string[];
  requiredEquipmentType: 'none' | 'auto' | 'motocikl' | 'bicikl';
  exclusive: boolean;
}

const MONTHS_BS = ['januar', 'februar', 'mart', 'april', 'maj', 'juni', 'juli', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar'];

export function N05Uloge() {
  const scoped = useScopedWorld();
  const session = useSession();
  const [creating, setCreating] = useState(false);
  const [customRoles, setCustomRoles] = useState<DraftRole[]>([]);

  const catalog = scoped.operationalRoles.filter((r) => r.orgNodeId === session.scopeNodeId);

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-ink-400">Katalog operativnih uloga</div>
          <h1 className="mt-0.5 text-2xl font-heading font-medium text-ink-800">Sistem se prilagođava tebi</h1>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1.5  bg-navy-900 px-3 py-1.5 text-sm font-medium text-paper-50 transition hover:bg-navy-800"
        >
          <Plus className="h-4 w-4" />
          Nova uloga
        </button>
      </header>

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-ink-700">Postojeće</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {catalog.map((r) => {
            const season = r.seasonWindow ? `${MONTHS_BS[r.seasonWindow.fromMonth - 1]}–${MONTHS_BS[r.seasonWindow.toMonth - 1]}` : 'cijela godina';
            return (
              <div key={r.id} className=" bg-paper-0 p-4 border border-paper-200">
                <div className="mb-1 text-sm font-heading font-medium text-ink-800">{r.name}</div>
                <div className="mb-3 flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="rounded-full bg-paper-100 px-2 py-0.5 text-ink-600">{season}</span>
                  {r.exclusive && <span className="rounded-full bg-signal-warn/15 px-2 py-0.5 text-signal-warn">ekskluzivna</span>}
                  {r.requiredEquipmentType && (
                    <span className="rounded-full bg-paper-100 px-2 py-0.5 text-ink-600">oprema: {r.requiredEquipmentType}</span>
                  )}
                </div>
                <div className="text-[11px] text-ink-500">
                  {r.requiredCertIds.length} certifikat/a potrebno · min. po smjeni: {r.minPerShift ?? '—'}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {customRoles.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-ink-700">Novo kreirano u ovoj sesiji</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {customRoles.map((r, i) => (
              <div key={i} className=" bg-signal-ok/5 p-4 border ring-signal-ok/30">
                <div className="mb-1 flex items-center justify-between">
                  <div className="text-sm font-heading font-medium text-ink-800">{r.name}</div>
                  <span className="rounded-full bg-signal-ok/15 px-2 py-0.5 text-[10px] font-medium uppercase text-signal-ok">
                    novo
                  </span>
                </div>
                <div className="text-[11px] text-ink-500">
                  {MONTHS_BS[r.fromMonth - 1]}–{MONTHS_BS[r.toMonth - 1]} · {r.certIds.length} cert.
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {creating && (
        <CreateDialog
          onClose={() => setCreating(false)}
          onCreate={(d) => {
            setCustomRoles((prev) => [d, ...prev]);
            setCreating(false);
          }}
        />
      )}
    </div>
  );
}

function CreateDialog({ onClose, onCreate }: { onClose: () => void; onCreate: (d: DraftRole) => void }) {
  const [name, setName] = useState('Turistička patrola');
  const [fromMonth, setFromMonth] = useState(6);
  const [toMonth, setToMonth] = useState(9);
  const [certIds, setCertIds] = useState<string[]>(['cert-eng']);
  const [requiredEquipmentType, setEquip] = useState<DraftRole['requiredEquipmentType']>('none');
  const [exclusive, setExclusive] = useState(false);

  const toggleCert = (id: string) => {
    setCertIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg  bg-paper-0 p-5 ">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-heading font-medium text-ink-800">Nova operativna uloga</h3>
          <button onClick={onClose} className=" p-1 text-ink-400 hover:bg-paper-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <label className="block">
            <div className="mb-1 text-xs font-medium text-ink-600">Naziv</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full  border border-paper-200 bg-paper-50 px-3 py-2 text-sm"
            />
          </label>

          <div>
            <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-ink-600">
              <CalendarDays className="h-3 w-3" /> Sezonski prozor
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select value={fromMonth} onChange={(e) => setFromMonth(Number(e.target.value))} className=" border border-paper-200 bg-paper-50 px-3 py-2 text-sm">
                {MONTHS_BS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <select value={toMonth} onChange={(e) => setToMonth(Number(e.target.value))} className=" border border-paper-200 bg-paper-50 px-3 py-2 text-sm">
                {MONTHS_BS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-ink-600">
              <ShieldCheck className="h-3 w-3" /> Traženi certifikati
            </div>
            <div className="flex flex-wrap gap-1.5">
              {world.certifications.map((c) => {
                const on = certIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleCert(c.id)}
                    className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
                      on ? 'border-navy-900 bg-navy-900 text-paper-50' : 'border-paper-200 bg-paper-0 text-ink-500'
                    }`}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-ink-600">
              <Package className="h-3 w-3" /> Oprema
            </div>
            <select
              value={requiredEquipmentType}
              onChange={(e) => setEquip(e.target.value as DraftRole['requiredEquipmentType'])}
              className="w-full  border border-paper-200 bg-paper-50 px-3 py-2 text-sm"
            >
              <option value="none">Ne zahtijeva</option>
              <option value="auto">Vozilo</option>
              <option value="motocikl">Motocikl</option>
              <option value="bicikl">Bicikl</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input type="checkbox" checked={exclusive} onChange={(e) => setExclusive(e.target.checked)} />
            Ekskluzivna (ne kombinuje se sa drugim ulogama u istoj smjeni)
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className=" px-3 py-2 text-sm text-ink-600 hover:bg-paper-100">
            Odustani
          </button>
          <button
            onClick={() => onCreate({ name, fromMonth, toMonth, certIds, requiredEquipmentType, exclusive })}
            className=" bg-navy-900 px-4 py-2 text-sm font-medium text-paper-50"
          >
            Kreiraj ulogu
          </button>
        </div>
      </div>
    </div>
  );
}
