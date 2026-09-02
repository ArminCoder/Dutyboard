import { Home, ShieldCheck, FileSearch, Car, IdCard, type LucideIcon } from 'lucide-react';
import type { DocumentKind, DocumentRequestStatus } from '../../data/types';
import type { DocType } from '../../data/administration';

/** Ikona po vrsti dokumenta — dijele je portal i administracija. */
export const DOC_ICON: Record<DocType['icon'], LucideIcon> = {
  home: Home,
  'shield-check': ShieldCheck,
  'file-search': FileSearch,
  car: Car,
  'id-card': IdCard,
};

export type Tone = 'neutral' | 'ok' | 'warn' | 'alarm' | 'brass' | 'ink';

/** Ton bedža po statusu zahtjeva. Crveno je rezervisano za odbijen (alarm). */
export const DOC_STATUS_TONE: Record<DocumentRequestStatus, Tone> = {
  podnesen: 'neutral',
  u_obradi: 'warn',
  spreman: 'ok',
  preuzet: 'ink',
  odbijen: 'alarm',
};

export const km = (n: number) => (n > 0 ? `${n} KM` : 'besplatno');

export function iconForKind(kind: DocumentKind, docTypes: DocType[]): LucideIcon {
  const t = docTypes.find((d) => d.kind === kind);
  return t ? DOC_ICON[t.icon] : FileSearch;
}
