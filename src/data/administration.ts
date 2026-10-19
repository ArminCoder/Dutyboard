// Administracija — katalog dokumenata za građane, šalter-lokacije i prihod od naknada.
//
// Građanin kroz portal podnosi zahtjev za jedan od dokumenata; administrativna služba
// ga obrađuje. Neki dokumenti nose naknadu (KM) — to je vlastiti prihod MUP-a, prikazan
// na ministarskoj tabli budžeta (isto kao pretplata na Akademiju).
//
// Iznosi i uputstva su ilustrativni (demo). Sadržaj je statičan i deterministički.

import type { DocumentKind, DocumentRequest } from './types';
import { PLACE, TENANT, bare, street } from '../app/places';

export interface DocType {
  kind: DocumentKind;
  title: string;
  short: string;
  description: string;
  /** Naknada u KM (0 = besplatno). */
  feeKM: number;
  /** Okvirni rok obrade u danima. */
  processingDays: number;
  /** Dodatna dokumentacija koju građanin treba priložiti. */
  requiredDocs: string[];
  icon: 'home' | 'shield-check' | 'file-search' | 'car' | 'id-card';
}

export const DOC_TYPES: DocType[] = [
  {
    kind: 'uvjerenje_prebivaliste',
    title: 'Uvjerenje o prebivalištu / kretanju',
    short: 'Prebivalište',
    description: 'Potvrda o prijavljenom prebivalištu i prethodnim adresama.',
    feeKM: 0,
    processingDays: 3,
    requiredDocs: ['Lična karta na uvid'],
    icon: 'home',
  },
  {
    kind: 'uvjerenje_nekaznjavanje',
    title: 'Uvjerenje o nekažnjavanju',
    short: 'Nekažnjavanje',
    description: 'Potvrda da lice nije osuđivano — za posao, vizu ili tender.',
    feeKM: 0,
    processingDays: 5,
    requiredDocs: ['Lična karta na uvid', 'Svrha izdavanja (poslodavac, ambasada…)'],
    icon: 'shield-check',
  },
  {
    kind: 'pristup_informacijama',
    title: 'Zahtjev za pristup informacijama',
    short: 'Pristup informacijama',
    description: 'Zahtjev po Zakonu o slobodi pristupa informacijama.',
    feeKM: 20,
    processingDays: 15,
    requiredDocs: ['Precizan opis tražene informacije'],
    icon: 'file-search',
  },
  {
    kind: 'vozacka',
    title: 'Zahtjev za vozačku dozvolu',
    short: 'Vozačka dozvola',
    description: 'Izdavanje ili zamjena vozačke dozvole.',
    feeKM: 60,
    processingDays: 10,
    requiredDocs: ['Ljekarsko uvjerenje', 'Dokaz o položenom ispitu / stara dozvola', 'Dvije fotografije (35×45 mm)'],
    icon: 'car',
  },
  {
    kind: 'licna',
    title: 'Lična karta',
    short: 'Lična karta',
    description: 'Izdavanje ili zamjena lične karte.',
    feeKM: 18,
    processingDays: 7,
    requiredDocs: ['Izvod iz matične knjige rođenih', 'Uvjerenje o prebivalištu', 'Jedna fotografija (35×45 mm)'],
    icon: 'id-card',
  },
];

export function findDocType(kind: DocumentKind): DocType {
  return DOC_TYPES.find((d) => d.kind === kind)!;
}

/** Šalter-lokacije gdje se zahtjevi obrađuju i preuzimaju. `psId` veže na org-stablo
 *  (administracija vidi zahtjeve po stanicama u svom scope-u). */
export interface DocOffice {
  psId: string;
  name: string;
  address: string;
}

export const DOC_OFFICES: DocOffice[] = [
  { psId: 'ps-centar', name: `Šalter sala ${PLACE.puCentar}`, address: `${street(1)} 12, ${TENANT.city}` },
  { psId: 'ps-stari-grad', name: `Šalter ${PLACE.psStariGrad}`, address: `${street(9)} 2` },
  { psId: 'ps-novi-grad', name: `CIPS ${bare(PLACE.psNoviGrad)}`, address: `${street(10)} 4` },
  { psId: 'ps-dobrinja', name: `Šalter ${PLACE.psDobrinja}`, address: `${street(12)} bb` },
];

export function findOffice(psId: string): DocOffice {
  return DOC_OFFICES.find((o) => o.psId === psId) ?? DOC_OFFICES[0];
}

/** Procijenjeni godišnji broj zahtjeva po dokumentu (za projekciju prihoda ministru).
 *  Deterministički — plauzibilan obim za kanton. */
const ANNUAL_VOLUME: Record<DocumentKind, number> = {
  uvjerenje_prebivaliste: 24000,
  uvjerenje_nekaznjavanje: 18000,
  pristup_informacijama: 900,
  vozacka: 21000,
  licna: 46000,
};

/** Prihod od naplaćenih zahtjeva.
 *  - `collected`: stvarno naplaćeno u tekućim (seed) zahtjevima;
 *  - `annualProjection`: godišnja projekcija na osnovu procijenjenog obima. */
export function documentFeeRevenue(requests: DocumentRequest[]) {
  const collected = requests.reduce((s, r) => s + (r.paid ? r.feeKM : 0), 0);
  const annualProjection = DOC_TYPES.reduce((s, d) => s + d.feeKM * ANNUAL_VOLUME[d.kind], 0);
  const paidCount = requests.filter((r) => r.paid).length;
  return { collected, paidCount, annualProjection };
}
