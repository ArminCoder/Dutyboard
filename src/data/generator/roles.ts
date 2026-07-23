import type { Certification, OperationalRole } from '../types';

// Katalog operativnih uloga. Vlasnici su PU (i posebna jedinica).
// Za demo držimo katalog jednostavan i ističemo one koje se koriste u K01 (SPEC linije 122-133).

export const CERTIFICATIONS: Certification[] = [
  { id: 'cert-osnovna', name: 'Osnovna policijska obuka' },
  { id: 'cert-interventna', name: 'Interventna obuka' },
  { id: 'cert-vozac-a', name: 'Vozačka kategorija A (motocikl)' },
  { id: 'cert-vozac-b', name: 'Vozačka kategorija B' },
  { id: 'cert-gadjanje', name: 'Godišnje gađanje' },
  { id: 'cert-eng', name: 'Engleski jezik (B2)' },
  { id: 'cert-civilna', name: 'Rad u civilnom odijelu' },
  { id: 'cert-specijalna', name: 'Specijalna obuka' },
];

/**
 * Operativne uloge — iste kataloške po PU (u pravoj aplikaciji svaka PU može
 * imati različit katalog). Za demo pravimo dvije kopije (Centar i Novi Grad) plus
 * specijalce kao ekskluzivne.
 */
export function buildOperationalRoles(puIds: string[], posebnaId: string): OperationalRole[] {
  const roles: OperationalRole[] = [];

  for (const puId of puIds) {
    const p = (name: string) => `${puId}:${name}`;

    roles.push({
      id: p('pjesacka'),
      name: 'Pješačka patrola',
      orgNodeId: puId,
      requiredCertIds: ['cert-osnovna', 'cert-gadjanje'],
      exclusive: false,
      combinableWith: [],
      minPerShift: 2,
    });

    roles.push({
      id: p('auto'),
      name: 'Auto-patrola',
      orgNodeId: puId,
      requiredCertIds: ['cert-osnovna', 'cert-gadjanje', 'cert-vozac-b'],
      requiredEquipmentType: 'vozilo',
      exclusive: false,
      combinableWith: [p('interventna')],
      minPerShift: 2,
    });

    roles.push({
      id: p('interventna'),
      name: 'Interventna',
      orgNodeId: puId,
      requiredCertIds: ['cert-osnovna', 'cert-gadjanje', 'cert-interventna'],
      exclusive: false,
      combinableWith: [p('auto')],
      minPerShift: 1,
    });

    roles.push({
      id: p('moto'),
      name: 'Moto patrola',
      orgNodeId: puId,
      requiredCertIds: ['cert-osnovna', 'cert-gadjanje', 'cert-vozac-a'],
      requiredEquipmentType: 'motocikl',
      exclusive: false,
      combinableWith: [],
    });

    roles.push({
      id: p('bicikl'),
      name: 'Bicikl patrola',
      orgNodeId: puId,
      seasonWindow: { fromMonth: 4, toMonth: 10 },
      requiredCertIds: ['cert-osnovna', 'cert-gadjanje'],
      requiredEquipmentType: 'bicikl',
      exclusive: false,
      combinableWith: [],
    });

    roles.push({
      id: p('civilna'),
      name: 'Civilna patrola',
      orgNodeId: puId,
      requiredCertIds: ['cert-osnovna', 'cert-gadjanje', 'cert-civilna'],
      exclusive: false,
      combinableWith: [],
    });
  }

  roles.push({
    id: `${posebnaId}:specijalci`,
    name: 'Posebna jedinica',
    orgNodeId: posebnaId,
    requiredCertIds: ['cert-osnovna', 'cert-gadjanje', 'cert-specijalna'],
    exclusive: true,
    combinableWith: [],
  });

  return roles;
}
