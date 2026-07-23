import { LogOut } from 'lucide-react';
import { useScopedWorld } from '../data/useScopedWorld';
import { useRoleActions, useSession } from '../app/RoleContext';
import { ACCESS_ROLE_LABEL } from '../data/types';
import { PageShell } from '../components/PageShell';

interface Props {
  title: string;
  description?: string;
}

/**
 * Phase 1 placeholder — dokazuje da `useScopedWorld()` radi na razini svake uloge.
 * Kasnije faze zamjenjuju ovaj ekran stvarnim funkcionalnim dashboardima,
 * ali `useScopedWorld` ostaje jedina tačka kroz koju bilo koji ekran gleda svijet.
 */
export function RoleHomePlaceholder({ title, description }: Props) {
  const session = useSession();
  const scoped = useScopedWorld();
  const { logout } = useRoleActions();

  const pss = scoped.orgNodes.filter((n) => n.kind === 'ps');
  const pus = scoped.orgNodes.filter((n) => n.kind === 'pu');
  const smjene = scoped.orgNodes.filter((n) => n.kind === 'smjena');

  return (
    <PageShell
      title={title}
      subtitle={`${ACCESS_ROLE_LABEL[session.role]} · ${session.scopeLabel}`}
      right={
        <button
          onClick={() => {
            logout();
            window.location.href = '/';
          }}
          className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 bg-white px-3 py-1.5 text-sm text-ink-600 transition hover:border-ink-400"
        >
          <LogOut className="h-3.5 w-3.5" />
          Odjava
        </button>
      }
    >
      <div className="rounded-xl border border-dashed border-ink-300 bg-white p-6">
        <div className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-400">
          Phase 1 placeholder
        </div>
        <p className="mb-4 text-sm text-ink-600">
          {description ??
            'Ovaj ekran je namjeran placeholder u Phase 1 — dokazuje da scoping podataka radi već sad. U kasnijim fazama se zamjenjuje pravim dashboardom.'}
        </p>

        <div className="grid gap-4 sm:grid-cols-4">
          <Metric label="PU u scope-u" value={pus.length} />
          <Metric label="PS u scope-u" value={pss.length} />
          <Metric label="Smjenskih grupa" value={smjene.length} />
          <Metric label="Policajaca" value={scoped.officers.length} />
        </div>

        {pss.length > 0 && (
          <div className="mt-6">
            <div className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-400">
              Vidljive stanice
            </div>
            <ul className="grid gap-1 sm:grid-cols-2">
              {pss.map((n) => (
                <li
                  key={n.id}
                  className="rounded-md border border-ink-100 bg-ink-50 px-3 py-2 text-sm text-ink-700"
                >
                  {n.name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </PageShell>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-ink-50 p-3">
      <div className="text-xs uppercase tracking-wider text-ink-400">{label}</div>
      <div className="mt-0.5 text-2xl font-semibold text-ink-900">{value}</div>
    </div>
  );
}
