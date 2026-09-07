import { useMemo } from 'react';
import { UNITS } from '../dispatch/routes';
import { UnitsMap } from '../dispatch/UnitsMap';
import { useScopedWorld } from '../../data/useScopedWorld';
import { useSession } from '../../app/RoleContext';

// K05 — mapa patrola vlastite stanice. Ista komponenta kao OKC mapa, uži scope.

export function K05Mapa() {
  const w = useScopedWorld();
  const session = useSession();

  const units = useMemo(() => {
    const allowed = new Set(w.orgNodes.filter((n) => n.kind === 'ps').map((n) => n.id));
    return UNITS.filter((u) => allowed.has(u.psId));
  }, [w.orgNodes]);

  return (
    <div className="min-h-full bg-dark-bg text-dark-text">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dark-border bg-dark-surface px-6 py-3">
        <div>
          <div className="section-label text-brass-500">Moje patrole</div>
          <h1 className="font-heading text-lg text-dark-text">{session.scopeLabel} · raspored na terenu</h1>
        </div>
        <span className="text-xs text-dark-muted">{units.length} jedinica u smjeni</span>
      </div>

      <div className="px-6 py-5">
        <UnitsMap units={units} zoom={13} center={[43.858, 18.418]} heightVh={64} />
        <p className="mt-2 text-[11px] text-dark-muted">
          Prati se jedinica/vozilo — u svrhu sigurnosti policajaca. Ne pojedinac.
        </p>
      </div>
    </div>
  );
}
