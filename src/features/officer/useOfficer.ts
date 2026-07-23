import { useMemo } from 'react';
import { world } from '../../data/world';
import { useSession } from '../../app/RoleContext';
import type { Officer } from '../../data/types';

/** Vraća oficira kojeg trenutna sesija predstavlja (za policajca — Softić, itd.). */
export function useCurrentOfficer(): Officer {
  const session = useSession();
  return useMemo(() => {
    const o = world.officers.find((x) => x.id === session.identityOfficerId);
    if (!o) throw new Error(`Nema oficira za ${session.identityOfficerId}`);
    return o;
  }, [session.identityOfficerId]);
}

/** Alias za Phase 2 — svi ekrani policajca su za Softića. Kasnije uklanjamo. */
export const useSoftić = useCurrentOfficer;
