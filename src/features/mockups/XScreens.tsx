import { useState } from 'react';
import { FileText, ShieldAlert, Users, Lock, Eye, Filter, Printer, CheckCircle2, Clock } from 'lucide-react';
import { world } from '../../data/world';
import { descendantsOf } from '../../data/generator/org';

// X01 — Zahtjevi / e-pisarnica (životni ciklus zahtjeva za premještaj)
export function X01Pisarnica() {
  const case1 = {
    id: 'zh-2026-0742',
    kind: 'Premještaj (interno)',
    officer: 'Amar Softić',
    from: 'PS Centar',
    to: 'PS Novi Grad',
    submitted: '02.08.2026.',
    lastAction: '18.08.2026.',
    status: 'u_toku' as const,
    chain: [
      { step: 'Podnesen', when: '02.08.2026.', by: 'Amar Softić', done: true },
      { step: 'Šef smjene — proslijedio', when: '03.08.2026.', by: 'Damir Kovač', done: true },
      { step: 'Komandir PS Centar — proslijedio', when: '08.08.2026.', by: 'Nedžad Klepo', done: true },
      { step: 'Načelnik PU Centar — u razmatranju', when: '—', by: 'Samir Begić', done: false },
      { step: 'Uprava policije — čeka', when: '—', by: '—', done: false },
    ],
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-ink-400">e-Pisarnica</div>
          <h1 className="mt-0.5 text-2xl font-heading font-medium text-ink-800">Predmet {case1.id}</h1>
          <div className="mt-1 text-xs text-ink-500">{case1.kind}</div>
        </div>
        <button className="inline-flex items-center gap-1.5  bg-navy-900 px-3 py-1.5 text-sm font-medium text-paper-50">
          <Printer className="h-4 w-4" />
          Generiši dokument
        </button>
      </header>

      <section className="mb-6  bg-paper-0 p-5 border border-paper-200">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Podnosilac" value={case1.officer} />
          <Field label="Status" value="U razmatranju kod načelnika PU" tone="warn" />
          <Field label="Iz" value={case1.from} />
          <Field label="U" value={case1.to} />
          <Field label="Podnesen" value={case1.submitted} />
          <Field label="Zadnja radnja" value={case1.lastAction} />
        </div>
      </section>

      <section className=" bg-paper-0 p-5 border border-paper-200">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-heading font-medium text-ink-800">
          <FileText className="h-4 w-4 text-ink-500" /> Životni ciklus
        </h2>
        <ol className="relative border-l border-paper-200">
          {case1.chain.map((c, i) => (
            <li key={i} className="mb-4 ml-4">
              <span className={`absolute -left-2 flex h-4 w-4 items-center justify-center rounded-full ${c.done ? 'bg-signal-ok' : 'bg-paper-200'}`}>
                {c.done ? <CheckCircle2 className="h-3 w-3 text-paper-50" /> : <Clock className="h-3 w-3 text-ink-500" />}
              </span>
              <div className="text-sm font-medium text-ink-800">{c.step}</div>
              <div className="text-[11px] text-ink-500">{c.by}{c.when !== '—' ? ` · ${c.when}` : ''}</div>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-6  border border-paper-200 bg-paper-0 p-4 text-xs text-ink-500">
        Vidljivost predmeta ograničena na podnosioca + lanac odobravanja. „Generiši dokument" popunjava obrazac za štampu i digitalni potpis.
      </div>
    </div>
  );
}

// X02 — Stepen tajnosti
const CLASSIFICATION_LEVELS = [
  { id: 'interno', label: 'INTERNO', cls: 'bg-paper-100 text-ink-700 border-paper-300', desc: 'v1 aplikacije pokriva samo ovaj nivo' },
  { id: 'povjerljivo', label: 'POVJERLJIVO', cls: 'bg-signal-warn/10 text-signal-warn border-signal-warn/40' },
  { id: 'tajno', label: 'TAJNO', cls: 'bg-signal-alarm/10 text-signal-alarm border-signal-alarm/40' },
  { id: 'vrlo_tajno', label: 'VRLO TAJNO', cls: 'bg-black text-paper-50 border-black' },
];

export function X02Tajnost() {
  const [showAccessLog, setShowAccessLog] = useState(false);

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      <header className="mb-6">
        <div className="text-xs uppercase tracking-wider text-ink-400">Stepen tajnosti dokumenta</div>
        <h1 className="mt-0.5 text-2xl font-heading font-medium text-ink-800">Kontrola pristupa</h1>
      </header>

      <section className="mb-6  bg-paper-0 p-6 border border-paper-200">
        <div className="mb-4 flex items-center gap-2">
          <span className="rounded border border-signal-warn/40 bg-signal-warn/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-signal-warn">
            POVJERLJIVO
          </span>
          <span className="text-xs text-ink-500">Zabranjeno kopiranje · Log pristupa aktivan</span>
        </div>
        <h2 className="mb-2 text-lg font-heading font-medium text-ink-800">Analiza koordinisanog djelovanja — jul 2026.</h2>
        <p className="text-sm text-ink-600">Sažetak ne prikazuje operativne detalje. Pun tekst dostupan samo korisnicima sa odgovarajućom sigurnosnom akreditacijom.</p>
        <div className="mt-4  border border-dashed border-paper-200 bg-paper-50 p-4 text-center text-xs text-ink-500">
          Sadržaj skriven — potreban stepen: POVJERLJIVO (imate: INTERNO)
        </div>
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-heading font-medium text-ink-800">Nivoi klasifikacije</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {CLASSIFICATION_LEVELS.map((l) => (
            <div key={l.id} className={` border p-4 ${l.cls}`}>
              <div className="text-sm font-bold uppercase tracking-widest">{l.label}</div>
              {l.desc && <div className="mt-1 text-xs opacity-90">{l.desc}</div>}
            </div>
          ))}
        </div>
      </section>

      <section className=" bg-paper-0 p-5 border border-paper-200">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-heading font-medium text-ink-800">
            <Lock className="h-4 w-4 text-ink-500" /> Princip: bez dozvole se ne vidi ni da dokument postoji
          </h2>
          <button
            onClick={() => setShowAccessLog((v) => !v)}
            className="inline-flex items-center gap-1  border border-paper-200 bg-paper-0 px-2.5 py-1 text-xs text-ink-600 hover:border-navy-500"
          >
            <Eye className="h-3 w-3" />
            {showAccessLog ? 'Sakrij' : 'Prikaži'} log pristupa
          </button>
        </div>
        {showAccessLog && (
          <ul className="space-y-1 text-xs">
            <li className="flex items-center justify-between  bg-paper-50 px-3 py-2">
              <span className="text-ink-800">Samir Begić (načelnik PU Centar)</span>
              <span className="text-[10px] text-ink-500">24.08.2026. 09:14</span>
            </li>
            <li className="flex items-center justify-between  bg-paper-50 px-3 py-2">
              <span className="text-ink-800">Nedžad Klepo (komandir PS Centar)</span>
              <span className="text-[10px] text-ink-500">22.08.2026. 15:03</span>
            </li>
            <li className="flex items-center justify-between  bg-signal-alarm/5 px-3 py-2">
              <span className="text-signal-alarm">Nepoznat korisnik — pokušaj pristupa odbačen</span>
              <span className="text-[10px] text-signal-alarm">21.08.2026. 22:47</span>
            </li>
          </ul>
        )}
      </section>

      <div className="mt-6  border border-paper-200 bg-paper-0 p-4 text-xs text-ink-500">
        v1 aplikacije pokriva INTERNO. Viši stepeni (POVJERLJIVO, TAJNO, VRLO TAJNO) uključuju se u fazi sa sigurnosnom akreditacijom.
      </div>
    </div>
  );
}

// X03 — Administracija i audit log
export function X03Admin() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <header className="mb-6">
        <div className="text-xs uppercase tracking-wider text-ink-400">Administracija</div>
        <h1 className="mt-0.5 text-2xl font-heading font-medium text-ink-800">Struktura i pristupi</h1>
      </header>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <section className=" bg-paper-0 p-4 border border-paper-200">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-heading font-medium text-ink-800">
            <Users className="h-4 w-4 text-ink-500" /> Org stablo
          </h2>
          <OrgTree />
        </section>

        <div className="space-y-6">
          <section className=" bg-paper-0 p-5 border border-paper-200">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-heading font-medium text-ink-800">
                <ShieldAlert className="h-4 w-4 text-ink-500" /> Audit log
              </h2>
              <div className="flex items-center gap-1  border border-paper-200 bg-paper-0 px-2.5 py-1 text-xs text-ink-500">
                <Filter className="h-3 w-3" /> filter
              </div>
            </div>
            <p className="mb-3 text-xs text-ink-500">Svaki pogled u tuđi dosje ostavlja trag. Nezavisno od uloge.</p>
            <ul className="divide-y divide-paper-200 text-xs">
              <AuditRow when="24.08.2026. 10:14" who="Samir Begić" what="Pregledao dosje: Amar Softić" />
              <AuditRow when="24.08.2026. 09:58" who="Damir Kovač" what="Odobrio zahtjev za slobodan dan (LR-0001)" />
              <AuditRow when="24.08.2026. 08:22" who="Sistem" what="Objavljen raspored PS Centar — septembar 2026" />
              <AuditRow when="23.08.2026. 22:47" who="Nepoznat korisnik" what="Pokušaj pristupa dokumentu POVJERLJIVO — odbačen" tone="alarm" />
              <AuditRow when="23.08.2026. 19:15" who="Edin Hodžić" what="Pregledao dosje: Suad Muminović" />
              <AuditRow when="23.08.2026. 14:03" who="Nedžad Klepo" what="Izmijenio raspored 26.08. II smjena" />
            </ul>
          </section>

          <section className=" bg-paper-0 p-5 border border-paper-200">
            <h2 className="mb-3 text-sm font-heading font-medium text-ink-800">Korisnici i dozvole</h2>
            <p className="text-xs text-ink-500">
              Uloga × jedinica × dozvola. Za demo nije uređivano — u produkciji integrisano sa AD/LDAP-om.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function OrgTree() {
  const roots = world.orgNodes.filter((n) => n.parentId === null);
  return (
    <ul className="space-y-1 text-xs">
      {roots.map((n) => (
        <TreeNode key={n.id} nodeId={n.id} depth={0} />
      ))}
    </ul>
  );
}

function TreeNode({ nodeId, depth }: { nodeId: string; depth: number }) {
  const node = world.orgNodes.find((n) => n.id === nodeId)!;
  const children = world.orgNodes.filter((n) => n.parentId === nodeId);
  const officerCount = world.officers.filter((o) => descendantsOf(world.orgNodes, nodeId).has(o.orgNodeId)).length;
  return (
    <li>
      <div className="flex items-center justify-between  px-2 py-1.5 hover:bg-paper-50" style={{ paddingLeft: `${depth * 12 + 8}px` }}>
        <span className={`${depth === 0 ? 'font-heading font-medium text-ink-800' : 'text-ink-700'}`}>{node.name}</span>
        <span className="text-[10px] text-ink-400">{officerCount}</span>
      </div>
      {children.length > 0 && (
        <ul className="mt-0.5 space-y-0.5">
          {children.map((c) => (
            <TreeNode key={c.id} nodeId={c.id} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

function AuditRow({ when, who, what, tone }: { when: string; who: string; what: string; tone?: 'alarm' }) {
  return (
    <li className={`flex items-start gap-3 py-2 ${tone === 'alarm' ? 'text-signal-alarm' : 'text-ink-700'}`}>
      <div className="w-32 flex-none text-[10px] text-ink-500">{when}</div>
      <div className="w-32 flex-none font-medium">{who}</div>
      <div className="flex-1">{what}</div>
    </li>
  );
}

function Field({ label, value, tone }: { label: string; value: string; tone?: 'warn' }) {
  return (
    <div>
      <div className="mb-0.5 text-[10px] uppercase tracking-wider text-ink-400">{label}</div>
      <div className={`text-sm ${tone === 'warn' ? 'font-medium text-signal-warn' : 'font-medium text-ink-800'}`}>{value}</div>
    </div>
  );
}
