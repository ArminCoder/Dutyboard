import { useMemo } from 'react';
import { useScopedWorld } from '../../data/useScopedWorld';
import { useStore } from '../../app/store';
import type { KddEntry, OrgNode } from '../../data/types';

/**
 * Izolacija za knjigu događaja. KDD upisi žive u store-u (ne u world-u), pa ih
 * useScopedWorld ne filtrira automatski — zato SVAKI ekran mora čitati kroz ovaj hook.
 * Dozvoljene stanice se izvode iz scope-a sesije: šef smjene i komandir vide svoju PS,
 * načelnik svoju PU, komesar sve. Nikad ne čitati store.kddEntries direktno u ekranu.
 */
export function useScopedKdd(): { entries: KddEntry[]; stations: OrgNode[] } {
  const w = useScopedWorld();
  const store = useStore();

  const stations = useMemo(() => w.orgNodes.filter((n) => n.kind === 'ps'), [w.orgNodes]);

  const entries = useMemo(() => {
    const allowed = new Set(stations.map((n) => n.id));
    return store.kddEntries
      .filter((e) => allowed.has(e.psId))
      .sort((a, b) => b.when.localeCompare(a.when));
  }, [store.kddEntries, stations]);

  return { entries, stations };
}
