import { useState } from 'react';
import { Check, RotateCcw, Building2, Palette, ToggleLeft } from 'lucide-react';
import { useOrg } from '../../app/OrgContext';
import { ORG_PRESETS, type LogoVariant, type OrgConfig } from '../../app/orgConfig';
import { OrgCrest, crestInitials } from '../../components/OrgCrest';

// A01 — postavke organizacije (ultra-admin). Ista aplikacija se isporučuje
// različitim upravama; ovdje se podešava naziv, boje i znak, uživo.

const LOGO_LABEL: Record<LogoVariant, string> = {
  stit: 'Štit',
  zvijezda: 'Zvijezda',
  bez: 'Bez znaka',
};

const FEATURE_LABEL: Record<string, string> = {
  kdd: 'Knjiga dnevnih događaja',
  bilten: 'Bilteni smjena i jutarnji brifing',
  mapa: 'Žive mape jedinica',
  simulacija: 'Simulacija za ministra',
  plata: 'Platne liste',
};

export function A01Organizacija() {
  const { org, setOrg, resetOrg } = useOrg();
  const [draft, setDraft] = useState<OrgConfig>(org);
  const [saved, setSaved] = useState(false);

  const patch = (p: Partial<OrgConfig>) => {
    setDraft({ ...draft, ...p });
    setSaved(false);
  };
  const patchColors = (p: Partial<OrgConfig['colors']>) => {
    setDraft({ ...draft, colors: { ...draft.colors, ...p } });
    setSaved(false);
  };

  const save = () => {
    setOrg(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const reset = () => {
    resetOrg();
    setSaved(false);
    // draft se vraća na zadano nakon reset-a konteksta
    setTimeout(() => setDraft((d) => ({ ...d, ...org })), 0);
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <div className="mb-1">
        <div className="section-label text-brass-600">Postavke organizacije</div>
        <h1 className="font-heading text-2xl text-ink-800">Prilagodba za policijsku upravu</h1>
      </div>
      <p className="mb-6 mt-1 max-w-2xl text-sm text-ink-500">
        Naziv, boje i znak se podešavaju po organizaciji — ista aplikacija, drugi vizuelni identitet.
        Promjene se odmah primjenjuju na cijelu aplikaciju.
      </p>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <section className="border border-paper-200 bg-paper-0">
            <div className="flex items-center gap-2 border-b border-paper-200 px-5 py-3">
              <Building2 className="h-4 w-4 text-ink-500" />
              <span className="section-label">Naziv</span>
            </div>
            <div className="space-y-3 p-5">
              <Field label="Puni naziv organizacije">
                <input
                  value={draft.orgName}
                  onChange={(e) => patch({ orgName: e.target.value })}
                  className="w-full border border-paper-200 bg-paper-50 px-3 py-2 text-sm text-ink-800"
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Skraćeni naziv">
                  <input
                    value={draft.orgShort}
                    onChange={(e) => patch({ orgShort: e.target.value })}
                    className="w-full border border-paper-200 bg-paper-50 px-3 py-2 text-sm text-ink-800"
                  />
                </Field>
                <Field label="Naziv proizvoda">
                  <input
                    value={draft.productName}
                    onChange={(e) => patch({ productName: e.target.value })}
                    className="w-full border border-paper-200 bg-paper-50 px-3 py-2 text-sm text-ink-800"
                  />
                </Field>
              </div>
            </div>
          </section>

          <section className="border border-paper-200 bg-paper-0">
            <div className="flex items-center gap-2 border-b border-paper-200 px-5 py-3">
              <Palette className="h-4 w-4 text-ink-500" />
              <span className="section-label">Boje i znak</span>
            </div>
            <div className="space-y-4 p-5">
              <div className="flex flex-wrap gap-2">
                {ORG_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => patchColors({ primary: p.primary, accent: p.accent })}
                    className="flex items-center gap-2 border border-paper-200 bg-paper-50 px-3 py-1.5 text-xs text-ink-700 transition hover:border-brass-500"
                  >
                    <span className="flex">
                      <span className="h-4 w-4" style={{ background: p.primary }} />
                      <span className="h-4 w-4" style={{ background: p.accent }} />
                    </span>
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Institucionalna boja">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={draft.colors.primary}
                      onChange={(e) => patchColors({ primary: e.target.value })}
                      className="h-9 w-14 border border-paper-200 bg-paper-50"
                    />
                    <span className="font-mono text-xs text-ink-600">{draft.colors.primary}</span>
                  </div>
                </Field>
                <Field label="Akcent">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={draft.colors.accent}
                      onChange={(e) => patchColors({ accent: e.target.value })}
                      className="h-9 w-14 border border-paper-200 bg-paper-50"
                    />
                    <span className="font-mono text-xs text-ink-600">{draft.colors.accent}</span>
                  </div>
                </Field>
              </div>

              <Field label="Znak">
                <div className="flex gap-2">
                  {(['stit', 'zvijezda', 'bez'] as LogoVariant[]).map((v) => (
                    <button
                      key={v}
                      onClick={() => patch({ logo: v })}
                      className={`flex items-center gap-2 border px-3 py-2 text-sm transition ${
                        draft.logo === v ? 'border-navy-900 bg-navy-900 text-paper-50' : 'border-paper-200 bg-paper-50 text-ink-700 hover:border-navy-500'
                      }`}
                    >
                      <OrgCrest variant={v} className="h-4 w-4" />
                      {LOGO_LABEL[v]}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          </section>

          <section className="border border-paper-200 bg-paper-0">
            <div className="flex items-center gap-2 border-b border-paper-200 px-5 py-3">
              <ToggleLeft className="h-4 w-4 text-ink-500" />
              <span className="section-label">Moduli po organizaciji</span>
            </div>
            <div className="p-5">
              <ul className="grid gap-2 sm:grid-cols-2">
                {Object.keys(draft.features).map((key) => (
                  <li key={key} className="flex items-center gap-2 text-sm text-ink-500">
                    <input type="checkbox" checked={draft.features[key]} disabled readOnly />
                    {FEATURE_LABEL[key] ?? key}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11px] text-ink-400">
                Uključivanje i isključivanje modula po organizaciji — u pripremi.
              </p>
            </div>
          </section>

          <div className="flex items-center gap-2">
            <button
              onClick={save}
              className="flex items-center gap-2 bg-navy-900 px-4 py-2 text-sm text-paper-50 transition hover:bg-navy-800"
            >
              {saved ? <Check className="h-4 w-4" /> : null}
              {saved ? 'Sačuvano' : 'Sačuvaj i primijeni'}
            </button>
            <button
              onClick={reset}
              className="flex items-center gap-2 border border-paper-300 bg-paper-0 px-4 py-2 text-sm text-ink-600 transition hover:border-brass-500"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Vrati zadano
            </button>
          </div>
        </div>

        {/* Pregled */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="border border-paper-200 bg-paper-0">
            <div className="border-b border-paper-200 px-4 py-3">
              <span className="section-label">Pregled</span>
            </div>
            <div className="p-4">
              <div
                className="mb-3 flex items-center gap-3 p-3"
                style={{ background: draft.colors.primary, color: '#fff' }}
              >
                <OrgCrest variant={draft.logo} className="h-7 w-7" color={draft.colors.accent} initials={crestInitials(draft.orgShort)} />
                <div className="min-w-0 leading-tight">
                  <div className="truncate text-[10px] uppercase leading-[1.4] tracking-wider opacity-70">
                    {draft.productName}
                  </div>
                  <div className="mt-0.5 truncate font-heading text-sm leading-[1.4]">{draft.orgShort}</div>
                </div>
              </div>
              <div className="mb-2 text-xs text-ink-500">{draft.orgName}</div>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 text-xs text-white" style={{ background: draft.colors.primary }}>
                  Primarno dugme
                </span>
                <span
                  className="px-3 py-1.5 text-xs"
                  style={{ background: draft.colors.accent, color: draft.colors.primary }}
                >
                  Akcent
                </span>
              </div>
              <div className="mt-3 border-l-2 pl-3" style={{ borderColor: draft.colors.accent }}>
                <div className="section-label">Popunjenost</div>
                <div className="font-mono text-xl" style={{ color: draft.colors.primary }}>
                  82%
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-600">{label}</span>
      {children}
    </label>
  );
}
